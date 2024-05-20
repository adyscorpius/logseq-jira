import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';

export const settings: SettingSchemaDesc[] = [
    {
        key: "primarySettings",
        title: "Primary Settings",
        description: "Configure the primary Jira account.",
        type: "heading",
        default: null
    },
    {
        key: "jiraBaseURL",
        title: "Base URL for your organization's JIRA instance",
        description: "Base URL for your Jira instance in the format xyz.atlassian.net (Exclude initial https:// and trailing /)",
        type: "string",
        default: "orgname.atlassian.net",
    },
    {
        key: "jiraUsername",
        title: "JIRA Username",
        description: "Your JIRA Username (An email address)",
        type: "string",
        default: "",
    },
    {
        key: "jiraAPIToken",
        title: "API Token/Key",
        description: "Your JIRA API Token generated as per https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/",
        type: "string",
        default: "",
    },
    {
        key: "jiraAuthType",
        title: "JIRA Authentication Type",
        description: "Use Basic Auth or Personal Access Tokens",
        type: 'enum',
        enumPicker: "radio",
        enumChoices: ["Basic Auth", "PAT"],
        default: "Basic Auth"
    },
    {
        key: "jiraAPIVersion",
        title: "JIRA API version for your organization",
        description: "Don't change this unless you use an older on-premise versions.",
        type: "enum",
        enumPicker: "select",
        enumChoices: ["3","2"],
        default: "3",
    },
    {
        key: "enableBlockPropertiesHeading",
        title: "Styling the results",
        description: "Configure the block properties to show for the text block. Works well if each issue is in it's own block.",
        type: "heading",
        default: null
    },
    {
        key: "updateInlineText",
        description: "Update Jira ticket details inline",
        type: "boolean",
        default: true,
        title: "Update detected issue keys with hyperlinked summary. This is the default behaviour.",
    },
    {
        key: "addToBlockProperties",
        title: "Add JIRA fields as block properties",
        description: "",
        type: "boolean",
        default: false,
    },
    {
        key: "showSummary",
        description: "Block Property: Show Summary",
        type: "boolean",
        default: false,
        title: "",
    },
    {
        key: "showAssignee",
        description: "Block Property: Show Assignee",
        type: "boolean",
        default: false,
        title: "",
    },
    {
        key: "showPriority",
        description: "Block Property: Show Priority",
        type: "boolean",
        default: false,
        title: "",
    },
    {
        key: "showFixVersion",
        description: "Block Property: Show Fix Version",
        type: "boolean",
        default: false,
        title: "",
    },
    {
        key: "showStatus",
        description: "Block Property: Show Ticket Status",
        type: "boolean",
        default: false,
        title: "",
    },
    {
        key: "showReporter",
        description: "Block Property: Show Reporter",
        type: "boolean",
        default: false,
        title: "",
    },
    {
        key: "showResolution",
        description: "Block Property: Show Resolution",
        type: "boolean",
        default: false,
        title: "",
    },

// 2nd Account settings

    {
        key: "secondOrgHeading",
        title: "Optional: Second organization",
        description: "Use this section if you have more than one organization.",
        type: "heading",
        default: null
    },
    {
        key: "enableSecond",
        description: "Enable second organization",
        type: "boolean",
        default: false,
        title: "Reload the plugin or restart Logseq after changing the value.",
    },
    {
        key: "jiraBaseURL2",
        title: "Base URL for your organization's JIRA instance",
        description: "Base URL for your Jira instance in the format xyz.atlassian.net (Exclude initial https:// and trailing /)",
        type: "string",
        default: "orgname.atlassian.net",
    },
    {
        key: "jiraUsername2",
        title: "JIRA Username",
        description: "Your JIRA Username (An email address)",
        type: "string",
        default: "",
    },
    {
        key: "jiraAPIToken2",
        title: "API Token/Key",
        description: "Your JIRA API Token generated as per https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/",
        type: "string",
        default: "",
    },
    {
        key: "jiraAuthType2",
        title: "JIRA Authentication Type",
        description: "Use Basic Auth or Personal Access Tokens",
        type: 'enum',
        enumPicker: "radio",
        enumChoices: ["Basic Auth", "PAT"],
        default: "Basic Auth"
    },
    {
        key: "jiraAPIVersion2",
        title: "JIRA API version for your organization",
        description: "Don't change this unless you use an older on-premise versions.",
        type: "enum",
        enumPicker: "select",
        enumChoices: ["3","2"],
        default: "3",
    },
];
