import "@logseq/libs";

import React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { settings } from './settings';
import type { Settings } from './models';
import { logseq as PL } from "../package.json";
import { extractIssues as extractIssueKeys, regexes, getAuthHeader } from "./utils";

// Add Axios and support caching.
import Axios from 'axios';

const axios = Axios.create();

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args);

const pluginId = PL.id;

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


async function main() {
  console.info(`#${pluginId}: MAIN`);
  const root = ReactDOM.createRoot(document.getElementById("app")!);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // function createModel() {
  //   return {
  //     show() {
  //       logseq.showMainUI();
  //     },
  //   };
  // }

  // logseq.provideModel(createModel());
  // logseq.setMainUIInlineStyle({
  //   zIndex: 11,
  // });

  // const openIconName = "template-plugin-open";

  // logseq.provideStyle(css`
  //   .${openIconName} {
  //     opacity: 0.55;
  //     font-size: 20px;
  //     margin-top: 4px;
  //   }

  //   .${openIconName}:hover {
  //     opacity: 0.9;
  //   }
  // `);

  // logseq.App.registerUIItem("toolbar", {
  //   key: openIconName,
  //   template: `
  //     <div data-on-click="show" class="${openIconName}">⚙️</div>
  //   `,
  // });

  logseq.Editor.registerSlashCommand('Pull JQL results', async() => {
    await getJQLResults();
  })

  logseq.useSettingsSchema(settings);

  logseq.Editor.registerSlashCommand('Update Jira Issue', async () => {
    await updateJiraIssue(false);
  });


  if (logseq.settings?.enableSecond) {
    logseq.Editor.registerSlashCommand('Update Jira Issue for 2nd Organization', async () => {
      await updateJiraIssue(true);
    });
  }
}

async function getJQLResults(useSecondOrg: boolean = false) {

  const block = await logseq.Editor.getCurrentBlock();

  const query = logseq.settings?.jqlQuery ;
  const baseURL = useSecondOrg ? logseq.settings?.jiraBaseURL2 : logseq.settings?.jiraBaseURL;
  const token = useSecondOrg ? logseq.settings?.jiraAPIToken2 : logseq.settings?.jiraAPIToken;
  const user = useSecondOrg ? logseq.settings?.jiraUsername2 : logseq.settings?.jiraUsername;
  const apiVersion = useSecondOrg ? logseq.settings?.jiraAPIVersion2 : logseq.settings?.jiraAPIVersion || "3";

  if (!baseURL || !token || !user) {
    logseq.UI.showMsg('Jira credentials not set. Update in Plugin settings.')
    throw new Error('Jira base URL not set.');
  }

  const creds: string = btoa(`${user}:${token}`);
  const authHeader = getAuthHeader(useSecondOrg, token, user, creds);
    const jqlQuery = `https://${baseURL}/rest/api/${apiVersion}/search?jql=${query}`;
    const body = await axios.get(jqlQuery, {
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader
      }
    });
    
    const response = body.data.issues.map((issue: any) => {
      const jiraURL = `https://${baseURL}/browse/${issue.key}`
      return {body: issue, jiraURL }
    })
    
    if (!!block) {
      const outputBlocks = response.map((row: any) => `[${row.body.key}|${row.body.fields.summary}](${row.jiraURL})`)

      await logseq.Editor.insertBatchBlock(
        block.uuid, 
        outputBlocks.map((_uuid: any) => ({
          content: `${_uuid}`,
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
    const value = await logseq.Editor.getEditingBlockContent(); // This has more current content (whereas currentBlock.content is stale)

    if ( currentBlock === null) {
      throw new Error('Select a block before running this command');
    }
    
    const uuid = currentBlock?.uuid;

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

    await logseq.Editor.updateBlock(uuid, newValue);
  } catch (e) {
    //console.error('logseq-jira', e.message);
  }
}

// Fetch Jira issues
async function getIssues(issues: Array<string>, useSecondOrg = false) {

  const baseURL = useSecondOrg ? logseq.settings?.jiraBaseURL2 : logseq.settings?.jiraBaseURL;
  const token = useSecondOrg ? logseq.settings?.jiraAPIToken2 : logseq.settings?.jiraAPIToken;
  const user = useSecondOrg ? logseq.settings?.jiraUsername2 : logseq.settings?.jiraUsername;
  const apiVersion = useSecondOrg ? logseq.settings?.jiraAPIVersion2 : logseq.settings?.jiraAPIVersion || "3";

  if (!baseURL || !token || !user) {
    logseq.UI.showMsg('Jira credentials not set. Update in Plugin settings.')
    throw new Error('Jira base URL not set.');
  }

  const creds: string = btoa(`${user}:${token}`);
  const authHeader = getAuthHeader(useSecondOrg, token, user, creds);

  const requests = issues.map(async (issueKey: string) => {
    const issueRest = `https://${baseURL}/rest/api/${apiVersion}/issue/${issueKey}`;
    const jiraURL = `https://${baseURL}/browse/${issueKey}`;

    const body = await axios.get(issueRest, {
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader
      }
    });

    return { body, jiraURL }
  }
  );

  const response = await Promise.all(requests);

  return response;
};

// Generate markdown text from response data
function generateTextFromResponse(responses: any[]): Data {
  const data: Data = {};

  responses.forEach((response) => {
    const {
      jiraURL,
      body: {  
        data: {
          key,
          fields: {
            summary,
            status,
            issuetype,
            priority,
            creator,
            reporter,
            fixVersions,
            assignee,
            resolution

            /*
            created,
            issuelinks,
            statuscategory.
            statuscategorychangedate,
            project: {
              key,
              name,

              projectCategory: {
                description:
                name:
              }
            }

            */

        }}
      }
    } = response;
    data[key] = {
      text: `[${key}|${summary}](${jiraURL})`,
      summary: summary ?? 'None',
      status: status?.name ?? 'None',
      type: issuetype?.name ?? 'None',
      priority: priority?.name ?? 'None',
      creator: creator?.displayName ?? 'None',
      reporter: reporter?.displayName ?? 'None',
      assignee: assignee?.displayName ?? 'None',
      fixVersion: fixVersions?.[0]?.name ?? 'None',
      resolution: resolution?.name ?? null,
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