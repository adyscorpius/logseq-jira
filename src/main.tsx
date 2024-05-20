import "@logseq/libs";

import React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { settings } from './settings';
import type { Settings } from './models';
import { logseq as PL } from "../package.json";
import { extractIssues, regexList, getAuthHeader } from "./utils";


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

// Main function to update Jira issues
async function updateJiraIssue(useSecondOrg: boolean = false): Promise<void> {
  try {
    const currentBlock = await logseq.Editor.getCurrentBlock();

    if (!currentBlock?.content) {
      logseq.UI.showMsg("Couldn't find a valid Jira issue key.", 'error');
      throw new Error("Couldn't find a valid Jira issue key.");
    }

    const value = currentBlock.content;
    const uuid = currentBlock.uuid;
    
    const issuesList = extractIssues(value);

    if (!issuesList || issuesList.length < 1) {
      logseq.UI.showMsg("Couldn't find any Jira issues in this block.", 'error');
      return;
    }

    const issues = await getIssues(issuesList, useSecondOrg);

    const data = generateTextFromResponse(issues);
    console.log(data);
    let newValue = value;
    if (logseq.settings?.updateInlineText) {
      newValue = await replaceAsync(value, data);
    }

    if (logseq.settings?.addToBlockProperties) {
      const properties = genProperties(data[issuesList[0]]);
      newValue = formatTextBlock(newValue, properties);
    }

    await logseq.Editor.updateBlock(uuid, newValue);
  } catch (e) {
    //console.error('logseq-jira', e.message);
  }
}

// Fetch Jira issues
async function getIssues(issuesList: Array<string>, useSecondOrg = false) {

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

  const requests = issuesList.map(async (issueKey: string) => { 
      const issueRest = `https://${baseURL}/rest/api/${apiVersion}/issue/${issueKey}`;
      const jiraURL = `https://${baseURL}/browse/${issueKey}`;

      let response = await fetch(issueRest, {
          headers: {
              'Accept': 'application/json',
              'Authorization': authHeader
          }
      });
      const body = await response.json();
      return { issueKey, body, jiraURL }
  }
  );

  return await Promise.all(requests);
};

// Generate markdown text from response data
function generateTextFromResponse(responses: any[]): Data {
  const data: Data = {};

  responses.forEach((response) => {
    data[response.issueKey] = {
      text: `[${response.body.key}|${response.body.fields.summary}](${response.jiraURL})`,
      summary: response.body.fields.summary ?? 'None',
      status: response.body.fields.status?.name ?? 'None',
      type: response.body.fields.issuetype?.name ?? 'None',
      priority: response.body.fields.priority?.name ?? 'None',
      creator: response.body.fields.creator?.displayName ?? 'None',
      reporter: response.body.fields.reporter?.displayName ?? 'None',
      assignee: response.body.fields.assignee?.displayName ?? 'None',
      fixVersion: response.body.fields.fixVersions?.[0]?.name ?? 'None',
      resolution: response.body.fields.resolution?.name ?? null,
    };
  });

  return data;
}

// Helper to perform regex replacements asynchronously
async function replaceAsync(str: string, data: Data): Promise<string> {
  let newString = str;
  for (const regex of regexList) {
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
