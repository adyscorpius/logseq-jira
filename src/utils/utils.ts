import { LSPluginUserEvents } from "@logseq/libs/dist/LSPlugin.user";
import React from "react";
import { Issue, IssuesWithDomain, JiraConnectionSettings } from "../jiraTypes";
import { JiraPluginSettings } from "../models";

let _visible = logseq.isMainUIVisible;

function subscribeLogseqEvent<T extends LSPluginUserEvents>(
  eventName: T,
  handler: (...args: any) => void
) {
  logseq.on(eventName, handler);
  return () => {
    logseq.off(eventName, handler);
  };
}

const subscribeToUIVisible = (onChange: () => void) =>
  subscribeLogseqEvent("ui:visible:changed", ({ visible }) => {
    _visible = visible;
    onChange();
  });

export const useAppVisible = () => {
  return React.useSyncExternalStore(subscribeToUIVisible, () => _visible);
};

// Regex declarations
export const markdownRegexes = [
  /\[(?<description>(?:[^\[\]]|\[(?:[^\[\]]|\[[^\[\]]*\])*\])*)\]\((?<url>https?:\/\/[^\s\/]+\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))\)/gim,
  /(?<!\()(?<url>https*:\/\/.{1,25}.atlassian.net\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))(?!\))/gim,
  /(?<![\,\.\/\S])(?<issue>[A-Z][A-Z0-9]+-[0-9]+)(?!.?\])/gim,
];

export const orgModeRegexes = [
  /\[\[(?<url>https?:\/\/[^\s\/]+\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))\]\[(?<description>[^\]]*)\]\]/gim,
  /(?<!\[\[)(?<url>https*:\/\/.{1,25}.atlassian.net\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))(?!\]\])/gim,
  /(?<![\,\.\/\S])(?<issue>[A-Z][A-Z0-9]+-[0-9]+)(?!.?\]\])/gim,
];

// Test regex for issue keys
export const issueTestRegex: RegExp = /([A-Z][A-Z0-9]+-[0-9]+)/gim;

// Extract issues from block text
export function extractIssues(str: string): string[] {
  return [...new Set(str.match(issueTestRegex))];
}

export function statusCategoryGenerator(content: string) {
  let icon = "⚪️";

  switch (content) {
    case "yellow":
      icon = "🔵";
      break;
    case "green":
      icon = "🟢";
      break;
    default:
      break;
  }

  return icon;
}

export function getJiraConnectionSettings(settings: JiraPluginSettings, useSecondOrg: boolean): JiraConnectionSettings {

  if (!useSecondOrg) {
    return {
      baseURL: settings.jiraBaseURL,
      username: settings.jiraUsername,
      authType: settings.jiraAuthType,
      APIToken: settings.jiraAPIToken,
      APIVersion: settings.jiraAPIVersion,
    }
  }

  return {
    baseURL: settings.jiraBaseURL2,
    username: settings.jiraUsername2,
    authType: settings.jiraAuthType2,
    APIToken: settings.jiraAPIToken2,
    APIVersion: settings.jiraAPIVersion2,
  }
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
  const findBracketedLinks = /(?<!\\)(?:\\{2})?(\[([^\\\]]*(?:\\.[^\\\]]*)*)\])/g;
  const findEscapedSymbols = /\\(.)/g;
  const { formatLink, issueLinkTextFormat } = getIssueLinkFormatConfig(settings);
  const formattedText = formatIssueInternal(issueLinkTextFormat, issue);

  if (!findBracketedLinks.test(formattedText)) {
    return formatLink(jiraURL, formattedText);
  }

  return markLinkInFormattedText(formattedText, findBracketedLinks)
    .map(str => str.type === "link"
        ? str.value.replaceAll(findBracketedLinks, (...args) => args[0].replace(args[1], formatLink(jiraURL, args[2])))
        : str.value.replaceAll(findEscapedSymbols, "$1")
    )
    .join("");
}

export function markLinkInFormattedText(str: string, regex: RegExp) {
  const result = [];
  let lastIndex = 0;
  let match;
  
  regex.lastIndex = 0;
  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', value: str.slice(lastIndex, match.index) });
    }

    if (match[0] !== match[1]) {
      const splitIndex = (match[0] as string).indexOf(match[1]);
      result.push({ type: 'text', value: match[0].substring(0, splitIndex) });
      result.push({ type: 'link', value: match[0].substring(splitIndex) });
    } else {
      result.push({ type: 'link', value: match[0] });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    result.push({ type: 'text', value: str.slice(lastIndex) });
  }

  return result;
}

const argumentBoundryChar = '%';
function formatIssueInternal(format: string, issue: Issue): string {
  const statusCategoryIcon = statusCategoryGenerator(issue.fields.status.statusCategory.colorName);
  const statusCategoryName = issue.fields.status.statusCategory.name;

  const replaceFunc = (input: string, searchMask: string, replaceMask: string): string => {
    const regEx = new RegExp(argumentBoundryChar + searchMask + argumentBoundryChar, "ig");
    return input.replace(regEx, replaceMask);
  };

  const formatMap = {
    "key": issue.key,
    "statuscategoryicon": statusCategoryIcon,
    "statuscategoryname": statusCategoryName,
    "summary": issue.fields.summary,
    "assignee": issue.fields.assignee?.displayName ?? 'None',
    "priority": issue.fields.priority?.name ?? 'None',
    "fixversion": issue.fields.fixVersions?.map(v => v.name).join(', '),
    "status": issue.fields.status?.name ?? 'None',
    "issuetype": issue.fields.issuetype?.name ?? 'None',
    "creator": issue.fields.creator?.displayName ?? 'None',
    "reporter": issue.fields.reporter?.displayName ?? 'None',
    "resolution": issue.fields.resolution?.name ?? 'None',
  }

  for (const [mask, value] of Object.entries(formatMap)) {
    format = replaceFunc(format, mask, value);
  }

  return format;
}