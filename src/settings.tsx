import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';

/**
 * Constants for default values
 */
const DEFAULTS = {
  API_VERSION: "3",
  AUTH_TYPE: "Basic Auth",
  UPDATE_ON_PASTE: "No",
  AUTO_REFRESH: "No",
  JQL_QUERY: "assignee = currentUser() AND statusCategory != Done and Updated >= -30d",
  MAX_ISSUES: 50,
} as const;

/**
 * Helper function to create a heading setting
 */
const createHeading = (title: string, description: string): SettingSchemaDesc => ({
  key: title.toLowerCase().replace(/\s+/g, ''),
  title,
  description,
  type: "heading",
  default: null
});

/**
 * Helper function to create a boolean setting
 */
const createBooleanSetting = (
  key: string,
  title: string,
  description: string,
  defaultValue = false
): SettingSchemaDesc => ({
  key,
  title,
  description,
  type: "boolean",
  default: defaultValue
});

/**
 * Helper function to create an enum setting
 */
const createEnumSetting = (
  key: string,
  title: string,
  description: string,
  choices: string[],
  defaultValue: string,
  picker: "radio" | "select" = "radio"
): SettingSchemaDesc => ({
  key,
  title,
  description,
  type: "enum",
  enumPicker: picker,
  enumChoices: choices,
  default: defaultValue
});

/**
 * Helper function to create a string setting
 */
const createStringSetting = (
  key: string,
  title: string,
  description: string,
  defaultValue = ""
): SettingSchemaDesc => ({
  key,
  title,
  description,
  type: "string",
  default: defaultValue
});

export const settings: SettingSchemaDesc[] = [
  // Primary Account Settings
  createHeading("Primary JIRA Account Settings", "Set up your main JIRA account here."),
  createStringSetting(
    "jiraBaseURL",
    "JIRA Base URL",
    "Enter your JIRA instance's base URL (e.g., xyz.atlassian.net). Do not include 'https://' or a trailing '/'.",
    "orgname.atlassian.net"
  ),
  createStringSetting(
    "jiraUsername",
    "JIRA Username",
    "Enter your JIRA username (usually your email address)."
  ),
  createStringSetting(
    "jiraAPIToken",
    "JIRA API Token",
    "Enter your JIRA API token. You can generate one at https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/"
  ),
  createEnumSetting(
    "jiraAuthType",
    "JIRA Authentication Method",
    "Choose your authentication method: Basic Auth or Personal Access Tokens.",
    ["Basic Auth", "PAT"],
    DEFAULTS.AUTH_TYPE
  ),
  createEnumSetting(
    "jiraAPIVersion",
    "JIRA API Version",
    "Select the API version your organization uses. Change this only if you use an older on-premise version.",
    ["3", "2"],
    DEFAULTS.API_VERSION,
    "select"
  ),

  // Display Settings
  createHeading("Display Options for JIRA Data", "Customize how JIRA issue details are shown in your notes."),
  createStringSetting(
    "issueLinkTextFormat",
    "Issue Format",
    "Issue link text customization. Available variables: %key%, %summary%, %status%, %priority%, %assignee%, %reporter%, %statuscategoryicon%, %statuscategoryname%",
    "%statuscategoryicon% %statuscategoryname% - %key%|%summary%"
  ),
  createStringSetting(
    "issueLinkTextFormatOrgMode",
    "Issue Format For Org Mode",
    "Issue link text customization for Org Mode. Same variables as above.",
    "%statuscategoryicon% %statuscategoryname% - %key%|%summary%"
  ),
  createBooleanSetting(
    "enableOrgMode",
    "Support Org Mode",
    "Enable this flag if you use Org Mode instead of Markdown"
  ),

  // Auto-update Settings
  createHeading("Auto-update Settings", "Configure automatic updates and synchronization."),
  createEnumSetting(
    "updateOnPaste",
    "Update Issue when you Paste it",
    "Automatically update Issue when you Paste it in LogSeq.",
    ["Yes", "No"],
    DEFAULTS.UPDATE_ON_PASTE
  ),
  createBooleanSetting(
    "updateInlineText",
    "Hyperlink JIRA Issue Keys",
    "Automatically hyperlink JIRA issue keys with their summaries.",
    true
  ),
  createEnumSetting(
    "autoRefresh",
    "Auto refresh on start",
    "Automatically refreshes all links on start of Logseq.",
    ["Yes", "No"],
    DEFAULTS.AUTO_REFRESH
  ),

  // Block Properties Settings
  createHeading("Block Properties Settings", "Configure how JIRA data is stored in block properties."),
  createBooleanSetting(
    "addToBlockProperties",
    "Add JIRA Fields as Block Properties",
    "Include additional JIRA fields as properties in your text blocks."
  ),
  createBooleanSetting(
    "showSummary",
    "Show Summary",
    "Display the issue summary."
  ),
  createBooleanSetting(
    "showAssignee",
    "Show Assignee",
    "Display the issue assignee."
  ),
  createBooleanSetting(
    "showPriority",
    "Show Priority",
    "Display the issue priority."
  ),
  createBooleanSetting(
    "showFixVersion",
    "Show Fix Version",
    "Display the fix version."
  ),
  createBooleanSetting(
    "showStatus",
    "Show Status",
    "Display the issue status."
  ),
  createBooleanSetting(
    "showReporter",
    "Show Reporter",
    "Display the issue reporter."
  ),
  createBooleanSetting(
    "showResolution",
    "Show Resolution",
    "Display the issue resolution."
  ),
  createStringSetting(
    "appendCustomTags",
    "Append your custom tags",
    "Add custom tags to your JIRA blocks (comma-separated)."
  ),

  // Second Account Settings
  createHeading("Settings for a Second JIRA Account (Optional)", "Configure this if you use a second JIRA account."),
  createBooleanSetting(
    "enableSecond",
    "Enable Second JIRA Account",
    "Enable or disable settings for a second JIRA account. Reload the plugin or restart Logseq after changing this setting."
  ),
  createStringSetting(
    "jiraBaseURL2",
    "JIRA Base URL for Second Account",
    "Enter the base URL for your second JIRA instance (e.g., xyz.atlassian.net). Do not include 'https://' or a trailing '/'.",
    "orgname.atlassian.net"
  ),
  createStringSetting(
    "jiraUsername2",
    "JIRA Username for Second Account",
    "Enter the username for your second JIRA account (usually an email address)."
  ),
  createStringSetting(
    "jiraAPIToken2",
    "JIRA API Token for Second Account",
    "Enter the API token for your second JIRA account. You can generate one at https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/"
  ),
  createEnumSetting(
    "jiraAuthType2",
    "JIRA Authentication Method for Second Account",
    "Choose the authentication method for your second account: Basic Auth or Personal Access Tokens.",
    ["Basic Auth", "PAT"],
    DEFAULTS.AUTH_TYPE
  ),
  createEnumSetting(
    "jiraAPIVersion2",
    "JIRA API Version for Second Account",
    "Select the API version used by your second JIRA instance. Change this only if you use an older on-premise version.",
    ["3", "2"],
    DEFAULTS.API_VERSION,
    "select"
  ),

  // JQL Query Settings
  createHeading("JQL Query Settings", "Configure custom JQL queries to fetch issues."),
  createStringSetting(
    "jqlQueryTitle",
    "Query Title",
    "Title for JQL query. Leave empty to disable. The tickets will be appended as children to this block."
  ),
  createStringSetting(
    "jqlQuery",
    "JQL Query",
    `Enter a custom JQL query to run. Defaults to open tickets assigned to me. Maximum ${DEFAULTS.MAX_ISSUES} issues.`,
    DEFAULTS.JQL_QUERY
  ),
];