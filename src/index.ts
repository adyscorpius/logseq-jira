import '@logseq/libs';
import { settings } from './settings';

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

/**
 * Main Logseq-Jira Function to register the plugin.
 */
async function main() {
  logseq.useSettingsSchema(settings);

  logseq.Editor.registerSlashCommand('Update Jira Issue', async () => {
    await updateJiraIssue();
  });

  if (logseq.settings.enableSecond) {
    logseq.Editor.registerSlashCommand('Update Jira Issue for 2nd Organization', async () => {
      await updateJiraIssue(true);
    });
  }

  logseq.App.registerCommand(
    'refreshJira',
    {
      key: 'refreshJira',
      label: 'Refresh Jira',
      desc: 'Refresh Jira links in block',
    },
    () => {
      updateJiraIssue();
    }
  );

  console.log('Jira Plugin loaded.');
}

// Regex declarations
const regexList = [
  /(?<![\,\.\/\S])(?<issue>[A-Z][A-Z0-9]+-[0-9]+)(?!.?\])/gim,
  /(?<!\()(?<url>https*:\/\/.{1,25}.atlassian.net\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))(?!\))/gim,
  /\[(?<description>[^\]]*)?\]\((?<url>https?:\/\/[A-Za-z0-9 ]+\.atlassian\.net\/browse\/(?<issue>[A-Za-z0-9\-]+))\)/gim,
];

// Test regex for issue keys
const issueTestRegex: RegExp = /([A-Z][A-Z0-9]+-[0-9]+)/gim;

// Main function to update Jira issues
async function updateJiraIssue(useSecondOrg = false): Promise<void> {
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

    let newValue = value;
    if (logseq.settings.updateInlineText) {
      newValue = await replaceAsync(value, data);
    }

    if (logseq.settings.addToBlockProperties) {
      const properties = genProperties(data[issuesList[0]]);
      newValue = formatTextBlock(newValue, properties);
    }

    await logseq.Editor.updateBlock(uuid, newValue);
  } catch (e) {
    console.error('logseq-jira', e.message);
  }
}

// Extract issues from block text
function extractIssues(str: string): string[] {
  return [...new Set(str.match(issueTestRegex))];
}

// Fetch Jira issues
async function getIssues(issuesList: string[], useSecondOrg = false) {
  const baseURL = useSecondOrg ? logseq.settings.jiraBaseURL2 : logseq.settings.jiraBaseURL;
  if (!baseURL) {
    logseq.UI.showMsg('Jira base URL not set. Update in Plugin settings.');
    throw new Error('Jira base URL not set.');
  }

  const creds = Buffer.from(
    `${useSecondOrg ? logseq.settings.jiraUsername2 : logseq.settings.jiraUsername}:${useSecondOrg ? logseq.settings.jiraAPIToken2 : logseq.settings.jiraAPIToken}`
  ).toString('base64');

  const requests = issuesList.map(async (issueKey: string) => {
    const issueRest = `https://${baseURL}/rest/api/3/issue/${issueKey}`;
    const jiraURL = `https://${baseURL}/browse/${issueKey}`;

    const response = await fetch(issueRest, {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${creds}`,
      },
    });
    const body = await response.json();
    return { issueKey, body, jiraURL };
  });

  return await Promise.all(requests);
}

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
  const {
    showSummary,
    showAssignee,
    showPriority,
    showFixVersion,
    showStatus,
    showReporter,
    showResolution,
  } = logseq.settings;

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