import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';

export const settings: SettingSchemaDesc[] = [
    {
        key: "primarySettings",
        title: "Primary JIRA Account Settings",
        description: "Set up your main JIRA account here.",
        type: "heading",
        default: null
    },
    {
        key: "jiraBaseURL",
        title: "JIRA Base URL",
        description: "Enter your JIRA instance's base URL (e.g., xyz.atlassian.net). Do not include 'https://' or a trailing '/'.",
        type: "string",
        default: "orgname.atlassian.net",
    },
    {
        key: "jiraUsername",
        title: "JIRA Username",
        description: "Enter your JIRA username (usually your email address).",
        type: "string",
        default: "",
    },
    {
        key: "jiraAPIToken",
        title: "JIRA API Token",
        description: "Enter your JIRA API token. You can generate one at https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/",
        type: "string",
        default: "",
    },
    {
        key: "jiraAuthType",
        title: "JIRA Authentication Method",
        description: "Choose your authentication method: Basic Auth or Personal Access Tokens.",
        type: 'enum',
        enumPicker: "radio",
        enumChoices: ["Basic Auth", "PAT"],
        default: "Basic Auth"
    },
    {
        key: "jiraAPIVersion",
        title: "JIRA API Version",
        description: "Select the API version your organization uses. Change this only if you use an older on-premise version.",
        type: "enum",
        enumPicker: "select",
        enumChoices: ["3","2"],
        default: "3",
    },
    {
        key: "enableBlockPropertiesHeading",
        title: "Display Options for JIRA Data",
        description: "Customize how JIRA issue details are shown in your notes.",
        type: "heading",
        default: null
    },
    {
        key: "updateInlineText",
        description: "Automatically hyperlink JIRA issue keys with their summaries.",
        type: "boolean",
        default: true,
        title: "Hyperlink JIRA Issue Keys",
    },
    {
        key: "addToBlockProperties",
        title: "Add JIRA Fields as Block Properties",
        description: "Include additional JIRA fields as properties in your text blocks.",
        type: "boolean",
        default: false,
    },
    {
        key: "showSummary",
        description: "Display the issue summary.",
        type: "boolean",
        default: false,
        title: "Show Summary",
    },
    {
        key: "showAssignee",
        description: "Display the issue assignee.",
        type: "boolean",
        default: false,
        title: "Show Assignee",
    },
    {
        key: "showPriority",
        description: "Display the issue priority.",
        type: "boolean",
        default: false,
        title: "Show Priority",
    },
    {
        key: "showFixVersion",
        description: "Display the fix version.",
        type: "boolean",
        default: false,
        title: "Show Fix Version",
    },
    {
        key: "showStatus",
        description: "Display the issue status.",
        type: "boolean",
        default: false,
        title: "Show Status",
    },
    {
        key: "showReporter",
        description: "Display the issue reporter.",
        type: "boolean",
        default: false,
        title: "Show Reporter",
    },
    {
        key: "showResolution",
        description: "Display the issue resolution.",
        type: "boolean",
        default: false,
        title: "Show Resolution",
    },

// Second Account settings

    {
        key: "secondOrgHeading",
        title: "Settings for a Second JIRA Account (Optional)",
        description: "Configure this if you use a second JIRA account.",
        type: "heading",
        default: null
    },
    {
        key: "enableSecond",
        description: "Enable or disable settings for a second JIRA account. Reload the plugin or restart Logseq after changing this setting.",
        type: "boolean",
        default: false,
        title: "Enable Second JIRA Account",
    },
    {
        key: "jiraBaseURL2",
        title: "JIRA Base URL for Second Account",
        description: "Enter the base URL for your second JIRA instance (e.g., xyz.atlassian.net). Do not include 'https://' or a trailing '/'.",
        type: "string",
        default: "orgname.atlassian.net",
    },
    {
        key: "jiraUsername2",
        title: "JIRA Username for Second Account",
        description: "Enter the username for your second JIRA account (usually an email address).",
        type: "string",
        default: "",
    },
    {
        key: "jiraAPIToken2",
        title: "JIRA API Token for Second Account",
        description: "Enter the API token for your second JIRA account. You can generate one at https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/",
        type: "string",
        default: "",
    },
    {
        key: "jiraAuthType2",
        title: "JIRA Authentication Method for Second Account",
        description: "Choose the authentication method for your second account: Basic Auth or Personal Access Tokens.",
        type: 'enum',
        enumPicker: "radio",
        enumChoices: ["Basic Auth", "PAT"],
        default: "Basic Auth"
    },
    {
        key: "jiraAPIVersion2",
        title: "JIRA API Version for Second Account",
        description: "Select the API version used by your second JIRA instance. Change this only if you use an older on-premise version.",
        type: "enum",
        enumPicker: "select",
        enumChoices: ["3","2"],
        default: "3",
    },
];