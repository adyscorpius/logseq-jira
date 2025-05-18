import { BlockEntity, LSPluginUserEvents, PageEntity } from "@logseq/libs/dist/LSPlugin.user";
import React from "react";
import { Issue, IssuesWithDomain, JiraConnectionSettings } from "../jiraTypes";
import { JiraPluginSettings } from "../models";
import { Data } from "../main";

/**
 * Constants for the application
 */
export const CONSTANTS = {
  ARGUMENT_BOUNDARY: '%',
  STATUS_ICONS: {
    DEFAULT: "⚪️",
    YELLOW: "🔵",
    GREEN: "🟢"
  } as const,
  STATUS_COLORS: {
    YELLOW: "yellow",
    GREEN: "green"
  } as const,

  PAGE_TYPE_PROPERTY: ".pagetype",
  PAGE_TYPE_VALUE_JIRA_ISSUE: "jira-issue",
} as const;

/**
 * Type for status category colors
 */
export type StatusCategoryColor = typeof CONSTANTS.STATUS_COLORS[keyof typeof CONSTANTS.STATUS_COLORS];

/**
 * Current visibility state of the main UI
 */
let mainUIVisible = logseq.isMainUIVisible;

/**
 * Subscribes to a Logseq event and returns an unsubscribe function
 * @param eventName - Name of the event to subscribe to
 * @param handler - Event handler function
 * @returns Function to unsubscribe from the event
 */
function subscribeLogseqEvent<T extends LSPluginUserEvents>(
  eventName: T,
  handler: (event: { visible: boolean }) => void
): () => void {
  logseq.on(eventName, handler);
  return () => logseq.off(eventName, handler);
}

/**
 * Subscribes to UI visibility changes
 * @param onChange - Callback function when visibility changes
 * @returns Function to unsubscribe from visibility changes
 */
const subscribeToUIVisible = (onChange: () => void): (() => void) =>
  subscribeLogseqEvent("ui:visible:changed", ({ visible }: { visible: boolean }) => {
    mainUIVisible = visible;
    onChange();
  });

/**
 * Escape every symbol in `str` so that the return value is exactly expected in a Regex
 */
const escapeRegex = (str: string) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

/**
 * React hook to track main UI visibility
 * @returns Current visibility state
 */
export const useAppVisible = (): boolean => {
  return React.useSyncExternalStore(subscribeToUIVisible, () => mainUIVisible);
};

/**
 * Regular expressions for matching Jira issues in different formats
 */
export const getMarkdownRegexes = () => {
  const settings = logseq.settings as JiraPluginSettings;
  const { baseURL: org1baseURL } = getJiraConnectionSettings(settings, false);
  const { baseURL: org2baseURL } = getJiraConnectionSettings(settings, true);
  
  const regexes = [
    /\[(?<description>(?:[^\[\]]|\[(?:[^\[\]]|\[[^\[\]]*\])*\])*)\]\((?<url>https?:\/\/[^\s\/]+\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))\)/gim,
    /(?<!\()(?<url>https?:\/\/.{1,25}.atlassian.net\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))(?!\))/gim,
    /(?<![\,\.\/\S])(?<issue>[A-Z][A-Z0-9]+-[0-9]+)(?!.?\])/gim,
  ];

  if (org1baseURL) {
    regexes.push(new RegExp(`\\[([^\\]]*)\\]\\((https?:\\/\\/${escapeRegex(org1baseURL)}\\/browse\\/(?<issue>[A-Z]+-\\d+))\\)`, "gim"));
    regexes.push(new RegExp(`(https?:\\/\\/${escapeRegex(org1baseURL)}\\/browse\\/(?<issue>[A-Z]+-\\d+))`, "gim"));
  }

  if (org2baseURL && settings.enableSecond) {
    regexes.push(new RegExp(`\\[([^\\]]*)\\]\\((https?:\\/\\/${escapeRegex(org2baseURL)}\\/browse\\/(?<issue>[A-Z]+-\\d+))\\)`, "gim"));
    regexes.push(new RegExp(`(https?:\\/\\/${escapeRegex(org2baseURL)}\\/browse\\/(?<issue>[A-Z]+-\\d+))`, "gim"));
  }

  return regexes;
}

export const getOrgModeRegexes = () => {
  const settings = logseq.settings as JiraPluginSettings;
  const { baseURL: org1baseURL } = getJiraConnectionSettings(settings, false);
  const { baseURL: org2baseURL } = getJiraConnectionSettings(settings, true);
  
  const regexes = [
    /\[\[(?<url>https?:\/\/[^\s\/]+\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))\]\[(?<description>[^\]]*)\]\]/gim,
    /(?<!\[\[)(?<url>https*:\/\/.{1,25}.atlassian.net\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))(?!\]\])/gim,
    /(?<![\,\.\/\S])(?<issue>[A-Z][A-Z0-9]+-[0-9]+)(?!.?\]\])/gim,
  ];

  if (org1baseURL) {
    regexes.push(new RegExp(`\\[([^\\]]*)\\]\\((https?:\\/\\/${escapeRegex(org1baseURL)}\\/browse\\/(?<issue>[A-Z]+-\\d+))\\)`, "gim"));
    regexes.push(new RegExp(`(https?:\\/\\/${escapeRegex(org1baseURL)}\\/browse\\/(?<issue>[A-Z]+-\\d+))`, "gim"));
  }

  if (org2baseURL && settings.enableSecond) {
    regexes.push(new RegExp(`\\[(https?:\\/\\/${escapeRegex(org2baseURL)}\\/browse\\/(?<issue>[A-Z]+-\\d+))\\]\\[([^\\]]*)\\]`, "gim"));
    regexes.push(new RegExp(`(https?:\\/\\/${escapeRegex(org2baseURL)}\\/browse\\/(?<issue>[A-Z]+-\\d+))`, "gim"));
  }

  return regexes;
}

/**
 * Regular expression for matching Jira issue keys
 */
export const issueTestRegex = /([A-Z][A-Z0-9]+-[0-9]+)(?=$|\s|]]|\)\)|\}\})/gim;

/**
 * Extracts unique Jira issue keys from a string
 * @param str - String to extract issues from
 * @returns Array of unique issue keys
 */
export function extractIssues(str: string): string[] {
  const matches = str.match(issueTestRegex) ?? [];
  return [...new Set(matches)];
}

/**
 * Generates an emoji icon based on status category color
 * @param color - Status category color
 * @returns Emoji icon representing the status
 */
export function statusCategoryGenerator(color: StatusCategoryColor): string {
  switch (color) {
    case CONSTANTS.STATUS_COLORS.YELLOW:
      return CONSTANTS.STATUS_ICONS.YELLOW;
    case CONSTANTS.STATUS_COLORS.GREEN:
      return CONSTANTS.STATUS_ICONS.GREEN;
    default:
      return CONSTANTS.STATUS_ICONS.DEFAULT;
  }
}

/**
 * Gets Jira connection settings based on whether to use second organization
 * @param settings - Plugin settings
 * @param useSecondOrg - Whether to use second organization settings
 * @returns Jira connection settings
 */
export function getJiraConnectionSettings(
  settings: JiraPluginSettings, 
  useSecondOrg: boolean
): JiraConnectionSettings {
  const prefix = useSecondOrg ? '2' : '';
  
  return {
    baseURL: settings[`jiraBaseURL${prefix}`],
    username: settings[`jiraUsername${prefix}`],
    authType: settings[`jiraAuthType${prefix}`],
    APIToken: settings[`jiraAPIToken${prefix}`],
    APIVersion: settings[`jiraAPIVersion${prefix}`],
  };
}

export function getIssueLinkFormat(settings: JiraPluginSettings): string {
  return settings.enableOrgMode 
    ? settings.issueLinkTextFormatOrgMode
    : settings.issueLinkTextFormat;
}

export function formatIssueLink(jiraURL: string, text: string, settings: JiraPluginSettings): string {
  return settings.enableOrgMode 
    ? `[[${jiraURL}][${text}]]`
    : `[${text}](${jiraURL})`;
}

export function formatIssue({ jiraURL, body: issue }: IssuesWithDomain, settings: JiraPluginSettings): Record<"pageTitle" | "formattedText", string> {
  const issueLinkTextFormat = getIssueLinkFormat(settings);
  const pageTitle = formatIssueInternal(settings.pageTitleFormat, issue, { link: jiraURL});
  const formattedText = formatIssueInternal(issueLinkTextFormat, issue, { link: jiraURL, pageTitle });

  if (settings.formatExpertMode) {
    return { formattedText, pageTitle };
  }

  return {
    pageTitle,
    formattedText: formatIssueLink(jiraURL, formattedText, settings),
  };
}

/**
 * Internal function to format issue text according to a template
 * @param format - Format template string
 * @param issue - Issue data
 * @returns Formatted issue text
 */
function formatIssueInternal(format: string, issue: Issue, extraKeys: Record<string, string> = {}): string {
  const statusCategoryIcon = statusCategoryGenerator(
    issue.fields.status.statusCategory.colorName as StatusCategoryColor
  );
  const statusCategoryName = issue.fields.status.statusCategory.name;

  const formatMap = {
    key: issue.key,
    statuscategoryicon: statusCategoryIcon,
    statuscategoryname: statusCategoryName,
    summary: issue.fields.summary,
    assignee: issue.fields.assignee?.displayName ?? 'None',
    priority: issue.fields.priority?.name ?? 'None',
    fixversion: issue.fields.fixVersions?.map(v => v.name).join(', ') ?? 'None',
    status: issue.fields.status?.name ?? 'None',
    issuetype: issue.fields.issuetype?.name ?? 'None',
    creator: issue.fields.creator?.displayName ?? 'None',
    reporter: issue.fields.reporter?.displayName ?? 'None',
    resolution: issue.fields.resolution?.name ?? 'None',
    ...extraKeys,
  } as const;

  return interpolateFormat(formatMap, format);
}

export function interpolateFormat(formatMap: Record<string, string>, format: string): string {
  return Object.entries(formatMap).reduce(
    (result, [mask, value]) => replaceFunc(result, mask, value),
    format
  );
}

function replaceFunc(input: string, searchMask: string, replaceMask: string): string {
  const regEx = new RegExp(
    `${CONSTANTS.ARGUMENT_BOUNDARY}${searchMask}${CONSTANTS.ARGUMENT_BOUNDARY}`,
    "ig"
  );
  return input.replace(regEx, replaceMask);
}

const propertyLineRegex = /^\s*(.+?)::\s*(.*?)\s*?$/;

/**
 * Behavior of Logseq is that the first line matching a property pattern is a property.
 */
export function getFirstPropertyLine(lines: string[]) {
  const firstPropertyLine = lines.findIndex(line => propertyLineRegex.test(line));
  return firstPropertyLine === -1 ? lines.length : firstPropertyLine;
}

export function removeProperties(allLines: string[]): string[] {
  const firstPropertyLine = getFirstPropertyLine(allLines);
  const contentLines = allLines.slice(0, firstPropertyLine);
  return contentLines;
}

export function getIssuePageByKey(key: string) {
  return logseq.DB.datascriptQuery(`[
          :find (pull ?p [*])
          :in $ ?pt ?k
          :where
            [?p :block/name]
            [?p :block/properties ?props]
            [(get ?props :.pagetype) ?pagetype]
            [(get ?props :key) ?key]
            [(= ?pagetype ?pt)]
            [(= ?key ?k)]
          ]`, JSON.stringify(CONSTANTS.PAGE_TYPE_VALUE_JIRA_ISSUE), JSON.stringify(key));
}

export async function getIssuePage(issue: Data[string]) {
  const [[existingPage] = []] = await getIssuePageByKey(issue.key);
  const page: PageEntity | undefined = existingPage ?? await logseq.Editor.createPage(issue.pageTitle, {}, { redirect: false });

  return page;
}

export async function getPagePreBlock(pageName: PageEntity["name"]) {
  const [firstBlock] = await logseq.Editor.getPageBlocksTree(pageName);
  const preBlock = firstBlock?.["preBlock?"]
    ? firstBlock
    : await logseq.Editor.insertBlock(firstBlock ? firstBlock.uuid : pageName, "", { isPageBlock: true, before: true });

  return preBlock;
}

export async function updateBlockProperties(block: BlockEntity, blockProperties: Record<string, string>) {
  const allLines = block.content.split("\n");
  const firstPropertyLine = getFirstPropertyLine(allLines);
  const content = allLines.slice(0, firstPropertyLine).join("\n");

  await logseq.Editor.updateBlock(block?.uuid,
    content,
    {
      properties: blockProperties
    }
  );
}

export function getIssuePageTypeProperties(issueKey: string): Record<string, string> {
  return {
    [CONSTANTS.PAGE_TYPE_PROPERTY]: CONSTANTS.PAGE_TYPE_VALUE_JIRA_ISSUE,
    "key": issueKey
  };
}

