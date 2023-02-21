import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';

export const settings: SettingSchemaDesc[] = [
    {
        key: "jiraUsername",
        description: "Your JIRA Username (Normally an email ID)",
        type: "string",
        default: "",
        title: "JIRA Username",
    },
    {
        key: "jiraAPIToken",
        description: "Your JIRA API Token generated as per https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/",
        type: "string",
        default: "",
        title: "JIRA API Token",
    },
    {
        key: "jiraBaseURL",
        description: "Base URL for your Jira instance in the format <orgname>.atlassian.net (Don't include the initial https:// and trailing /",
        type: "string",
        default: "orgname.atlassian.net",
        title: "Base URL for your organization",
    },
    {
        key: "jiraShowAssignee",
        description: "Enable this to add Assignee to block properties.",
        type: "boolean",
        default: "false",
        title: "Show Assignee",
    },
    {
        key: "jiraShowPriority",
        description: "Enable this to add Assignee to block properties.",
        type: "boolean",
        default: "false",
        title: "Show Priority",
    },
    {
        key: "jiraShowFixVersion",
        description: "Enable this to add *Fix Version* to block properties.",
        type: "boolean",
        default: "false",
        title: "Show Fix Version",
    },
    {
        key: "jiraShowStatus",
        description: "Enable this to add issue *Status* to block properties.",
        type: "boolean",
        default: "false",
        title: "Show Ticket Status",
    },
    {
        key: "jiraShowReporter",
        description: "Enable this to add *Reporter* to block properties.",
        type: "boolean",
        default: "false",
        title: "Show Reporter",
    },
];
