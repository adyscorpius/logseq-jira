import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';

export const settings: SettingSchemaDesc[] = [
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
        key: "enableBlockPropertiesHeading",
        title: "Block properties",
        description: "Configure block properties to enable",
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
