import { LSPluginUserEvents } from "@logseq/libs/dist/LSPlugin.user";
import React from "react";

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
export const regexes = [
  /(?<![\,\.\/\S])(?<issue>[A-Z][A-Z0-9]+-[0-9]+)(?!.?\])/gim,
  /(?<!\()(?<url>https*:\/\/.{1,25}.atlassian.net\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))(?!\))/gim,
  /\[(?<description>[^\]]*)?\]\((?<url>https?:\/\/[A-Za-z0-9 ]+\.atlassian\.net\/browse\/(?<issue>[A-Za-z0-9\-]+))\)/gim,
];
// Test regex for issue keys
export const issueTestRegex: RegExp = /([A-Z][A-Z0-9]+-[0-9]+)/gim;

// Helper function for getAuthType
export function getAuthHeader(secondOrg: boolean, token: any, user: any, creds: string): string {
  const authType = secondOrg ? logseq.settings?.getAuthType2 : logseq.settings?.getAuthType;
  let authHeader;
  if (authType === "PAT")  // For PAT https://developer.atlassian.com/server/jira/platform/personal-access-token/#personal-access-token
    authHeader = `Bearer ${token}`;
  else // Essential Basic Authentication https://developer.atlassian.com/server/jira/platform/basic-authentication/#basic-authentication
    authHeader = `Basic ${creds}`;
  return authHeader;
}// Extract issues from block text
export function extractIssues(str: string): string[] {
  return [...new Set(str.match(issueTestRegex))];
}

