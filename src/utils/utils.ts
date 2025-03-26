import { LSPluginUserEvents } from "@logseq/libs/dist/LSPlugin.user";
import React from "react";
import { Issue, IssuesWithDomain, JiraConnectionSettings } from "../jiraTypes";
import { JiraPluginSettings } from "../models";

/**
 * Constants for the application
 */
const CONSTANTS = {
  ARGUMENT_BOUNDARY: '%',
  STATUS_ICONS: {
    DEFAULT: "⚪️",
    YELLOW: "🔵",
    GREEN: "🟢"
  } as const,
  STATUS_COLORS: {
    YELLOW: "yellow",
    GREEN: "green"
  } as const
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
 * React hook to track main UI visibility
 * @returns Current visibility state
 */
export const useAppVisible = (): boolean => {
  return React.useSyncExternalStore(subscribeToUIVisible, () => mainUIVisible);
};

/**
 * Regular expressions for matching Jira issues in different formats
 */
export const markdownRegexes = [
  /\[(?<description>(?:[^\[\]]|\[(?:[^\[\]]|\[[^\[\]]*\])*\])*)\]\((?<url>https?:\/\/[^\s\/]+\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))\)/gim,
  /(?<!\()(?<url>https*:\/\/.{1,25}.atlassian.net\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))(?!\))/gim,
  /(?<![\,\.\/\S])(?<issue>[A-Z][A-Z0-9]+-[0-9]+)(?!.?\])/gim,
] as const;

export const orgModeRegexes = [
  /\[\[(?<url>https?:\/\/[^\s\/]+\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))\]\[(?<description>[^\]]*)\]\]/gim,
  /(?<!\[\[)(?<url>https*:\/\/.{1,25}.atlassian.net\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))(?!\]\])/gim,
  /(?<![\,\.\/\S])(?<issue>[A-Z][A-Z0-9]+-[0-9]+)(?!.?\]\])/gim,
] as const;

/**
 * Regular expression for matching Jira issue keys
 */
export const issueTestRegex = /([A-Z][A-Z0-9]+-[0-9]+)/gim;

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

export function getIssueLinkFormatConfig(settings: JiraPluginSettings): { formatLink: (jiraURL: string, text: string) => string, issueLinkTextFormat: string } {
  if (settings.enableOrgMode) {
    return {
      formatLink: (jiraURL, text) => `[[${jiraURL}][${text}]]`,
      issueLinkTextFormat: settings.issueLinkTextFormatOrgMode,
    };
  }
  
  return {
    formatLink: (jiraURL, text) => `[${text}](${jiraURL})`,
    issueLinkTextFormat: settings.issueLinkTextFormat,
  };
}

export function formatIssue({ jiraURL, body: issue }: IssuesWithDomain, settings: JiraPluginSettings): string {
  const { formatLink, issueLinkTextFormat } = getIssueLinkFormatConfig(settings);
  const formattedText = formatIssueInternal(issueLinkTextFormat, issue, jiraURL);

  if (settings.formatExpertMode) {
    return formattedText;
  }

  return formatLink(jiraURL, formattedText);
}

/**
 * Internal function to format issue text according to a template
 * @param format - Format template string
 * @param issue - Issue data
 * @returns Formatted issue text
 */
function formatIssueInternal(format: string, issue: Issue, jiraLink: string): string {
  const statusCategoryIcon = statusCategoryGenerator(
    issue.fields.status.statusCategory.colorName as StatusCategoryColor
  );
  const statusCategoryName = issue.fields.status.statusCategory.name;

  const replaceFunc = (input: string, searchMask: string, replaceMask: string): string => {
    const regEx = new RegExp(
      `${CONSTANTS.ARGUMENT_BOUNDARY}${searchMask}${CONSTANTS.ARGUMENT_BOUNDARY}`,
      "ig"
    );
    return input.replace(regEx, replaceMask);
  };

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
    link: jiraLink,
  } as const;

  return Object.entries(formatMap).reduce(
    (result, [mask, value]) => replaceFunc(result, mask, value),
    format
  );
}



const propertyLineRegex = /^\s*([\w]+)::\s+(.*?)\s*?$/;

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
