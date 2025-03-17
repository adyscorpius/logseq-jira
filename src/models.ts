export type AuthTypes = "Basic Auth" | "PAT";
export type APIVersions = "3" | "2";

export type JiraPluginSettings = {
  disabled: boolean,

  jiraBaseURL: string,
  jiraUsername: string,
  jiraAPIToken: string,
  jiraAuthType: AuthTypes,
  jiraAPIVersion: APIVersions,

  issueLinkTextFormat: string,
  issueLinkTextFormatOrgMode: string,
  updateOnPaste: "Yes" | "No",
  updateInlineText: boolean,
  autoRefresh: "Yes" | "No",
  enableOrgMode: boolean,
  addToBlockProperties: boolean,
  showSummary: boolean,
  showAssignee: boolean,
  showPriority: boolean,
  showFixVersion: boolean,
  showStatus: boolean,
  showReporter: boolean,
  showResolution: boolean,
  appendCustomTags: string,

  enableSecond: boolean,
  // Second Account settings
  jiraBaseURL2: string,
  jiraUsername2: string,
  jiraAPIToken2: string,
  jiraAuthType2: AuthTypes,
  jiraAPIVersion2: APIVersions,

  jqlQueryTitle: string,
  jqlQuery: string
} & Record<string, unknown>