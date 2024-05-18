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
        key: "jiraUsername",
        title: "JIRA Username",
        description: "Your JIRA Username (Normally an email address)",
        type: "string",
        default: "",
    },
    {
        key: "jiraAPIToken",
        title: "JIRA API Token",
        description: "Your JIRA API Token generated as per https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/",
        type: "string",
        default: "",
    },
    {
        key: "jiraBaseURL",
        title: "Base URL for your organization",
        description: "Base URL for your Jira instance in the format <orgname>.atlassian.net (Don't include the initial https:// and trailing /",
        type: "string",
        default: "orgname.atlassian.net",
    },
    {
        key: "jiraAPIVersion",
        title: "JIRA API version for your organization",
        description: "The JIRA REST API version to use. 3 for JIRA Cloud, often 2 for on-premise instances.",
        type: "string",
        default: "3",
    },
    {
        key: "updateInlineText",
        description: "Update Jira ticket details inline",
        type: "boolean",
        default: true,
        title: "Update tickets found with hyperlinked summary. This is the default behaviour of Logseq-jira.",
    },
    {
        key: "enableBlockPropertiesHeading",
        title: "Block properties",
        description: "Configure the block properties to show for the text block. Works well if each issue is in it's own block.",
        type: "heading",
        default: null
    },
    {
        key: "addToBlockProperties",
        title: "Add JIRA details as block properties",
        description: "Enable this to add details to block properties, disable to update Key & Summary inline.",
        type: "boolean",
        default: false,
    },
    
    {
        key: "showSummary",
        description: "Block Properties: Show Summary",
        type: "boolean",
        default: false,
        title: "",
    },
    {
        key: "showAssignee",
        description: "Block Properties: Show Assignee",
        type: "boolean",
        default: false,
        title: "",
    },
    {
        key: "showPriority",
        description: "Block Properties: Show Priority",
        type: "boolean",
        default: false,
        title: "",
    },
    {
        key: "showFixVersion",
        description: "Block Properties: Show Fix Version",
        type: "boolean",
        default: false,
        title: "",
    },
    {
        key: "showStatus",
        description: "Block Properties: Show Ticket Status",
        type: "boolean",
        default: false,
        title: "",
    },
    {
        key: "showReporter",
        description: "Block Properties: Show Reporter",
        type: "boolean",
        default: false,
        title: "",
    },
    {
        key: "showResolution",
        description: "Block Properties: Show Resolution",
        type: "boolean",
        default: false,
        title: "",
    },
    {
        key: "secondOrgHeading",
        title: "Optional: Second organization",
        description: "Settings for 2nd Jira organization.",
        type: "heading",
        default: null
    },
    {
        key: "enableSecond",
        description: "Enable support for second organization",
        type: "boolean",
        default: false,
        title: "Reload the plugin or restart Logseq after changing the value.",
    },
    {
        key: "jiraUsername2",
        title: "JIRA Username for 2nd Organization",
        description: "Your JIRA Username for the 2nd organization (Normally an email address)",
        type: "string",
        default: "",
    },
    {
        key: "jiraAPIToken2",
        title: "JIRA API Token for 2nd Organization",
        description: "Your JIRA API Token for the 2nd organization generated as per https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/",
        type: "string",
        default: "",
    },
    {
        key: "jiraBaseURL2",
        title: "Base URL for your 2nd organization",
        description: "Base URL for your 2nd Jira instance in the format <orgname>.atlassian.net (Don't include the initial https:// and trailing /",
        type: "string",
        default: "orgname2.atlassian.net",
    }
];
