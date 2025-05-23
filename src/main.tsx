import "@logseq/libs";
import React from "react";
import * as ReactDOM from "react-dom/client";
import Axios, { AxiosError } from 'axios';

import App from "./App";
import "./index.css";
import { settings } from './settings';
import type { JiraPluginSettings } from './models';
import { logseq as PL } from "../package.json";
import {
  extractIssues as extractIssueKeys, formatIssue, getIssuePageTypeProperties, getJiraConnectionSettings, getIssuePage as getOrCreateIssuePage, getPagePreBlock, getMarkdownRegexes, getOrgModeRegexes, removeProperties, statusCategoryGenerator, updateBlockProperties, type StatusCategoryColor
} from "./utils/utils";
import { db } from "./db";
import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin";
import { 
  getIssueUrl, 
  makeIssueRequest, 
  makeSearchRequest 
} from "./utils/jiraUtils";
import { Issue, IssuesWithDomain } from "./jiraTypes";

// Add Axios
const axios = Axios.create();

export type Data = Record<
  string,
  {
    link: string;
    key: string;
    text: string;
    pageTitle: string;
    summary: string;
    status: string;
    type: string;
    priority: string;
    creator: string;
    reporter: string;
    assignee: string;
    fixVersion: string;
    resolution: string;
    customTags: string;
  }
>;

// @ts-expect-error
const css = (t: TemplateStringsArray, ...args) => String.raw(t, ...args);

const pluginId = PL.id;

async function main() {

  await db.open();

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
  logseq.Editor.registerSlashCommand('Jira: Pull JQL results', async () => {
    await getJQLResults();
  });

  // Register Slash command for Update issue.
  logseq.Editor.registerSlashCommand('Jira: Update Issue', async () => {
    await updateJiraIssue(false);
  });
  logseq.Editor.registerBlockContextMenuItem('Jira: Update Issue', async (event) => {
    await updateJiraIssue(false, event.uuid);
  })
  
  const jiraSettings = logseq.settings as JiraPluginSettings;

  // Register Slash command for 2nd organization if enabled.
  if (jiraSettings.enableSecond) {
    logseq.Editor.registerSlashCommand('Jira: Update Issue for 2nd Org.', async () => {
      await updateJiraIssue(true);
    });
    logseq.Editor.registerBlockContextMenuItem('Jira: Update Issue for 2nd Org.', async (event) => {
      await updateJiraIssue(true, event.uuid);
    })
  }

  const mainContentContainer = parent.document.getElementById(
    "main-content-container",
  );

  if (jiraSettings.updateOnPaste === "Yes") {
    mainContentContainer?.addEventListener("paste", pasteHandler);
  }

  logseq.ready().then(async () => {
    if (logseq.settings?.autoRefresh === "No") return;
    console.log("Starting DB refresh");

    await db.issues.each(async (val) => {
      await updateJiraIssue(val.useSecondOrg, val.blockid);
    })
    const count = await db.issues.count();
    logseq.UI.showMsg(`Experimental: Refresh ${count} Jira issues...`)
  })

  logseq.beforeunload(async () => {
    db.close();

    if (jiraSettings.updateOnPaste === "Yes") {
      mainContentContainer?.removeEventListener("paste", pasteHandler);
    }
  })

}

async function pasteHandler(e: ClipboardEvent) {
  const text = e.clipboardData?.getData("text");
  if (text)
  {
    const issueKeys = extractIssueKeys(text);
    if (issueKeys && issueKeys.length > 0)
    {
      await updateJiraIssueOnPaste(text, false);
    }
  }
}

async function getJQLResults(useSecondOrg: boolean = false) {
  try {
    const block = await logseq.Editor.getCurrentBlock();

    if (!logseq.settings) {
      logseq.UI.showMsg('Jira Plugin failed to get LogSeq settings');
      throw new Error(`Failed to get LogSeq settings`);
    }

    const settings = logseq.settings as JiraPluginSettings;
    const connectionSettings = getJiraConnectionSettings(settings, useSecondOrg);

    const enableOrgMode = settings?.enableOrgMode as boolean;
    const jqlTitle = settings?.jqlQueryTitle;

    if (!connectionSettings.baseURL || !connectionSettings.APIToken || !connectionSettings.username) {
      logseq.UI.showMsg('Jira credentials not set. Update in Plugin settings.')
      throw new Error('Jira base URL not set.');
    }

    const response = await makeSearchRequest(settings.jqlQuery, connectionSettings);

    const issues: IssuesWithDomain[] = response.issues.map((issue: Issue) => ({
      body: issue,
      jiraURL: getIssueUrl(issue, connectionSettings.baseURL)
    }));

    if (block) {
      const outputBlocks = issues.map((row: IssuesWithDomain) => {
        const statusCategoryIcon = statusCategoryGenerator(
          row.body.fields.status.statusCategory.colorName as StatusCategoryColor
        );
        const statusCategoryName = row.body.fields.status.statusCategory.name;
        const summary = row.body.fields.summary;
        const key = row.body.key;

        if (enableOrgMode) {
          return `[[${row.jiraURL}][${statusCategoryIcon} ${statusCategoryName} - ${key}|${summary}]]`;
        }

        return `[${statusCategoryIcon} ${statusCategoryName} - ${key}|${summary}](${row.jiraURL})`;
      });

      if (jqlTitle) {
        await logseq.Editor.updateBlock(block.uuid, jqlTitle);
      }

      await logseq.Editor.insertBatchBlock(
        block.uuid,
        outputBlocks.map((content: string) => ({ content })),
        {
          before: false,
          sibling: false
        }
      );
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
    logseq.UI.showMsg(`Failed to fetch JQL results: ${errorMessage}`, 'error');
  }
}

// Main function to update Jira issues
async function updateJiraIssue(useSecondOrg: boolean, blockUUID?: string): Promise<void> {
  try {

    let currentBlock: BlockEntity | null;
    let value: string;
    if (blockUUID) {
      currentBlock = await logseq.Editor.getBlock(blockUUID);
      value = currentBlock?.content ?? "";
    } else {
      currentBlock = await logseq.Editor.getCurrentBlock();
      value = await logseq.Editor.getEditingBlockContent();
    }

    if (!currentBlock) {
      throw new Error('Select a block before running this command');
    }

    // extract issuekeys from content only and ignoring the properties    
    const contentText = removeProperties(value.split("\n")).join("\n")
    const { key = "", linkedkey = "", link = "" } = currentBlock.properties ?? {};
    const issueKeys = extractIssueKeys(`${key} ${linkedkey} ${link} ${contentText}`);

    if (!issueKeys || issueKeys.length < 1) {
      logseq.UI.showMsg("Couldn't find any Jira issues.", 'error');
      throw new Error("Couldn't find a valid Jira issue key.");
    }

    const issues = await getIssues(issueKeys, useSecondOrg);
    if (issues === undefined || issues.length === 0) {
      return;
    }

    const settings = logseq.settings as JiraPluginSettings;
    const enableOrgMode = settings.enableOrgMode;
    const data = generateTextFromResponse(issues, enableOrgMode);
    const blockProperties = settings.addToBlockProperties ? genProperties(data[issueKeys[0]]) : {};

    if (settings.createPage) {
      await Promise.all(Object.values(data).map(async issue => {
        const page: PageEntity | undefined = await getOrCreateIssuePage(issue);

        if (typeof page?.uuid === "string") {
          const preBlock = await getPagePreBlock(page.name);

          if (preBlock){
            await updateBlockProperties(preBlock, {
              ...getIssuePageTypeProperties(issue.key),
              ...blockProperties,
            });
          }
        }
      }))
    }

    let newValue = value;
    if (settings.updateInlineText) {
      newValue = await replaceAsync(value, data, enableOrgMode);
    }

    if (settings.addToBlockProperties && !settings.createPage) {
      const properties = genProperties(data[issueKeys[0]]);
      newValue = formatTextBlock(newValue, properties);
    }

    await logseq.Editor.updateBlock(currentBlock.uuid, newValue);

    await db.issues.add({ blockid: currentBlock.uuid, name: issueKeys.toString(), useSecondOrg, timestamp: Date.now() });

  } catch (e: any) {
    console.error('logseq-jira', e.message);
  }
}

async function updateJiraIssueOnPaste(value: string, useSecondOrg: boolean): Promise<void> {
  try {

    const currentBlock = await logseq.Editor.getCurrentBlock();
    const blockContent = await logseq.Editor.getEditingBlockContent();
    const cursor = await logseq.Editor.getEditingCursorPosition();
    if (cursor) {
      value = blockContent.substring(0, cursor?.pos) + value + blockContent.substring(cursor?.pos);
    }

    if (!currentBlock) {
      throw new Error('Select a block before running this command');
    }

    // extract issuekeys from content only and ignoring the properties    
    const contentText = removeProperties(value.split("\n")).join("\n")
    const { key = "", linkedkey = "", link = "" } = currentBlock.properties ?? {};
    const issueKeys = extractIssueKeys(`${key} ${linkedkey} ${link} ${contentText}`);

    if (!issueKeys || issueKeys.length < 1) {
      logseq.UI.showMsg("Couldn't find any Jira issues.", 'error');
      throw new Error("Couldn't find a valid Jira issue key.");
    }

    const issues = await getIssues(issueKeys, useSecondOrg);
    if (issues === undefined || issues.length === 0) {
      return;
    }

    const settings = logseq.settings as JiraPluginSettings;
    const enableOrgMode = settings.enableOrgMode;
    const data = generateTextFromResponse(issues, enableOrgMode);
    const blockProperties = settings.addToBlockProperties ? genProperties(data[issueKeys[0]]) : {};

    if (settings.createPage) {
      await Promise.all(Object.values(data).map(async issue => {
        const page: PageEntity | undefined = await getOrCreateIssuePage(issue);

        if (typeof page?.uuid === "string") {
          const preBlock = await getPagePreBlock(page.name);

          if (preBlock){
            await updateBlockProperties(preBlock, {
              ...getIssuePageTypeProperties(issue.key),
              ...blockProperties,
            });
          }
        }
      }))
    }

    let newValue = value;
    if (settings.updateInlineText) {
      newValue = await replaceAsync(value, data, enableOrgMode);
    }

    if (settings.addToBlockProperties && !settings.createPage) {
      const properties = genProperties(data[issueKeys[0]]);
      newValue = formatTextBlock(newValue, properties);
    }

    await logseq.Editor.updateBlock(currentBlock.uuid, newValue);

    await db.issues.add({ blockid: currentBlock.uuid, name: issueKeys.toString(), useSecondOrg, timestamp: Date.now() });

  } catch (e: any) {
    console.error('logseq-jira', e.message);
  }
}

// Fetch Jira issues
async function getIssues(issueKeys: Array<string>, useSecondOrg = false): Promise<IssuesWithDomain[] | undefined> {
  try {
    if (!logseq.settings) {
      logseq.UI.showMsg('Jira Plugin failed to get LogSeq settings');
      throw new Error(`Failed to get LogSeq settings`);
    }

    const settings = logseq.settings as JiraPluginSettings;
    const connectionSettings = getJiraConnectionSettings(settings, useSecondOrg);

    if (!connectionSettings.baseURL || !connectionSettings.APIToken || !connectionSettings.username) {
      logseq.UI.showMsg('Jira credentials not set. Update in Plugin settings.')
      throw new Error('Jira base URL not set.');
    }

    const response = await makeIssueRequest(issueKeys, connectionSettings);

    const issues: IssuesWithDomain[] = response.map((issue: Issue) => {
      const jiraURL = getIssueUrl(issue, connectionSettings.baseURL)
      return { body: issue, jiraURL }
    })

    return issues;

  } catch (e: any) {
    logseq.UI.showMsg(`Failed to fetch issues: ${e.message}`, 'error');
  }
};

// Generate markdown text from response data
function generateTextFromResponse(responses: IssuesWithDomain[], enableOrgMode: boolean): Data {
  const data: Data = {};
  const settings = logseq.settings as JiraPluginSettings;

  responses.forEach((issueWithDomain: IssuesWithDomain) => {
    const { key, fields } = issueWithDomain.body;
    const {formattedText, pageTitle} = formatIssue(issueWithDomain, settings);

    data[key] = {
      link: issueWithDomain.jiraURL,
      key: key,
      text: formattedText,
      pageTitle: pageTitle, 
      summary: fields.summary ?? 'None',
      status: fields.status?.name ?? 'None',
      type: fields.issuetype?.name ?? 'None',
      priority: fields.priority?.name ?? 'None',
      creator: fields.creator?.displayName ?? 'None',
      reporter: fields.reporter?.displayName ?? 'None',
      assignee: fields.assignee?.displayName ?? 'None',
      fixVersion: fields.fixVersions?.map(v => v.name).join(', ') ?? 'None',
      resolution: fields.resolution?.name ?? null,
      customTags: settings.appendCustomTags
    };
  });
  return data;
}

// Helper to perform regex replacements asynchronously
async function replaceAsync(str: string, data: Data, enableOrgMode: boolean): Promise<string> {
  let newString = str;
  const replacedIssues = new Set<string>();
  const regexes = enableOrgMode ? getOrgModeRegexes() : getMarkdownRegexes();

  for (const regex of regexes) {
    newString = newString.replace(regex, (match, ...args) => {
      const groups = args.pop();
      const issue = groups.issue;

      if (replacedIssues.has(issue)) {
        return match;
      }

      if (data[issue]) {
        replacedIssues.add(issue);
        return data[issue].text;
      }

      return match;
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
function genProperties(properties: Data[string]): Record<string, string> {
  const { key, link, assignee, priority, fixVersion, status, reporter, summary, resolution } = properties;
  const settings = logseq.settings as JiraPluginSettings;
  const {
    showLink,
    showKey,
    showLinkedKey,
    showSummary,
    showAssignee,
    showPriority,
    showFixVersion,
    showStatus,
    showReporter,
    showResolution,
    appendCustomTags
  } = settings;

  const propertyObject: Record<string, string> = {};

  if (showLink) propertyObject.link = link;
  if (showKey) propertyObject.key = key;
  if (showLinkedKey) propertyObject.linkedkey = settings.enableOrgMode ? `[[${link}]][[${key}]]` : `[${key}](${link})`;
  if (showSummary) propertyObject.summary = summary;
  if (showAssignee) propertyObject.assignee = assignee;
  if (showPriority) propertyObject.priority = priority;
  if (showFixVersion) propertyObject['fix-version'] = fixVersion;
  if (showStatus) propertyObject.status = status;
  if (showReporter) propertyObject.reporter = reporter;
  if (showResolution && resolution) propertyObject.resolution = resolution;
  if (appendCustomTags) propertyObject.tags = appendCustomTags;

  return propertyObject;
}

logseq.ready(main).catch(console.error);