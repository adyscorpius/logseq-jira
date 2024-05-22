import "@logseq/libs";
import React from "react";
import * as ReactDOM from "react-dom/client";
import Axios from 'axios';

import App from "./App";
import "./index.css";
import { settings } from './settings';
import type { Settings } from './models';
import { logseq as PL } from "../package.json";
import { extractIssues as extractIssueKeys, statusCategoryGenerator, regexes, getAuthHeader } from "./utils";

// Add Axios
const axios = Axios.create();

type Data = Record<
  string,
  {
    text: string;
    summary: string;
    status: string;
    type: string;
    priority: string;
    creator: string;
    reporter: string;
    assignee: string;
    fixVersion: string;
    resolution: string;
  }
>;

// @ts-expect-error
const css = (t: TemplateStringsArray, ...args) => String.raw(t, ...args);

const pluginId = PL.id;

async function main() {
  console.info(`#${pluginId}: MAIN`);
  const root = ReactDOM.createRoot(document.getElementById("app")!);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Setup Logseq settings
  logseq.useSettingsSchema(settings);

  // Register Logseq commands
  logseq.Editor.registerSlashCommand('Jira: Pull JQL results', async() => {
    await getJQLResults();
  })

  logseq.Editor.registerSlashCommand('Jira: Update Issue', async () => {
    await updateJiraIssue(false);
  });


  if (logseq.settings?.enableSecond) {
    logseq.Editor.registerSlashCommand('Jira: Update Issue for 2nd Org.', async () => {
      await updateJiraIssue(true);
    });
  }
}

async function getJQLResults(useSecondOrg: boolean = false) {
  const block = await logseq.Editor.getCurrentBlock();
  const settings = logseq.settings;

  const baseURL = useSecondOrg ? settings?.jiraBaseURL2 : settings?.jiraBaseURL;
  const token = useSecondOrg ? settings?.jiraAPIToken2 : settings?.jiraAPIToken;
  const user = useSecondOrg ? settings?.jiraUsername2 : settings?.jiraUsername;
  const apiVersion = useSecondOrg ? settings?.jiraAPIVersion2 : settings?.jiraAPIVersion || "3";

  if (!baseURL || !token || !user) {
    logseq.UI.showMsg('Jira credentials not set. Update in Plugin settings.')
    throw new Error('Jira base URL not set.');
  }

  const creds: string = btoa(`${user}:${token}`);
  const authHeader = getAuthHeader(useSecondOrg, token, user, creds);
  const jqlQuery = `https://${baseURL}/rest/api/${apiVersion}/search?jql=${settings?.jqlQuery}`;
  
  const response = await axios.get(jqlQuery, {
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader
      }
    });
    
    const issues = response.data.issues.map((issue: any) => {
      const jiraURL = `https://${baseURL}/browse/${issue.key}`
      return {body: issue, jiraURL }
    })
    
    if (!!block) {
      const outputBlocks = issues.map((row: any) => 
        `[${statusCategoryGenerator(row.body.fields.status.statusCategory.colorName)} ${row.body.fields.status.statusCategory.name} - ${row.body.key}|${row.body.fields.summary}](${row.jiraURL})`)
      await logseq.Editor.insertBatchBlock(
        block.uuid, 
        outputBlocks.map((content: any) => ({
          content: `${content}`,
        })),
      {
        before: false,
        sibling: false
      });
    }
    

}

// Main function to update Jira issues
async function updateJiraIssue(useSecondOrg: boolean = false): Promise<void> {
  try {
    const currentBlock = await logseq.Editor.getCurrentBlock();
    const value = await logseq.Editor.getEditingBlockContent();

    if (!currentBlock) {
      throw new Error('Select a block before running this command');
    }

    const issueKeys = extractIssueKeys(value);

    if (!issueKeys || issueKeys.length < 1) {
      logseq.UI.showMsg("Couldn't find any Jira issues.", 'error');
      throw new Error("Couldn't find a valid Jira issue key.");
    }

    const issues = await getIssues(issueKeys, useSecondOrg);
    const data = generateTextFromResponse(issues);
    let newValue = value;
    if (logseq.settings?.updateInlineText) {
      newValue = await replaceAsync(value, data);
    }

    if (logseq.settings?.addToBlockProperties) {
      const properties = genProperties(data[issueKeys[0]]);
      newValue = formatTextBlock(newValue, properties);
    }

    await logseq.Editor.updateBlock(currentBlock.uuid, newValue);
  } catch (e) {
    //console.error('logseq-jira', e.message);
  }
}

// Fetch Jira issues
async function getIssues(issues: Array<string>, useSecondOrg = false) {
  const settings = logseq.settings;
  const baseURL = useSecondOrg ? settings?.jiraBaseURL2 : settings?.jiraBaseURL;
  const token = useSecondOrg ? settings?.jiraAPIToken2 : settings?.jiraAPIToken;
  const user = useSecondOrg ? settings?.jiraUsername2 : settings?.jiraUsername;
  const apiVersion = useSecondOrg ? settings?.jiraAPIVersion2 : settings?.jiraAPIVersion || "3";

  if (!baseURL || !token || !user) {
    logseq.UI.showMsg('Jira credentials not set. Update in Plugin settings.')
    throw new Error('Jira base URL not set.');
  }

  const creds: string = btoa(`${user}:${token}`);
  const authHeader = getAuthHeader(useSecondOrg, token, user, creds);

  const requests = issues.map(async (issueKey: string) => {
    const issueRest = `https://${baseURL}/rest/api/${apiVersion}/issue/${issueKey}`;
    const jiraURL = `https://${baseURL}/browse/${issueKey}`;

    const response = await axios.get(issueRest, {
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader
      }
    });

    return { body: response.data, jiraURL }
  }
  );
  const result = await Promise.all(requests);

  return result;
};

// Generate markdown text from response data
function generateTextFromResponse(responses: any[]): Data {
  const data: Data = {};

  responses.forEach(({jiraURL, body: {key, fields }}) => {
    data[key] = {
      text: `[${statusCategoryGenerator(fields.status.statusCategory.colorName)} ${fields.status.statusCategory.name} - ${key}|${fields.summary}](${jiraURL})`,
      summary: fields.summary ?? 'None',
      status: fields.status?.name ?? 'None',
      type: fields.issuetype?.name ?? 'None',
      priority: fields.priority?.name ?? 'None',
      creator: fields.creator?.displayName ?? 'None',
      reporter: fields.reporter?.displayName ?? 'None',
      assignee: fields.assignee?.displayName ?? 'None',
      fixVersion: fields.fixVersions?.[0]?.name ?? 'None',
      resolution: fields.resolution?.name ?? null,
    };
  });
  return data;
}

// Helper to perform regex replacements asynchronously
async function replaceAsync(str: string, data: Data): Promise<string> {
  let newString = str;
  for (const regex of regexes) {
    newString = newString.replace(regex, (match, ...args) => {
      const { issue } = args.pop();
      return data[issue].text;
    });
  }
  return newString;
}

// Format block text with properties
function formatTextBlock(input: string, keyValuePairs: Record<string, string>): string {
  const lines = input.split('\n');
  const existingKeys = new Set<string>();

  for (const line of lines) {
    const separatorIndex = line.indexOf('::');
    if (separatorIndex !== -1) {
      const key = line.slice(0, separatorIndex).trim();
      existingKeys.add(key);
    }
  }

  let formattedText = input;

  for (const [key, value] of Object.entries(keyValuePairs)) {
    if (!existingKeys.has(key)) {
      formattedText += `\n${key}:: ${value}`;
    } else {
      const regex = new RegExp(`${key}::.*`, 'g');
      formattedText = formattedText.replace(regex, `${key}:: ${value}`);
    }
  }

  return formattedText;
}

// Generate properties object from data
function genProperties(properties: any): Record<string, string> {
  const { assignee, priority, fixVersion, status, reporter, summary, resolution } = properties;
  const settings = logseq.settings as unknown as Settings;
  const {
    showSummary,
    showAssignee,
    showPriority,
    showFixVersion,
    showStatus,
    showReporter,
    showResolution,
  } = settings;

  const propertyObject: Record<string, string> = {};

  if (showSummary) propertyObject.summary = summary;
  if (showAssignee) propertyObject.assignee = assignee;
  if (showPriority) propertyObject.priority = priority;
  if (showFixVersion) propertyObject['fix-version'] = fixVersion;
  if (showStatus) propertyObject.status = status;
  if (showReporter) propertyObject.reporter = reporter;
  if (showResolution && resolution) propertyObject.resolution = resolution;

  return propertyObject;
}


logseq.ready(main).catch(console.error);