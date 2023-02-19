import '@logseq/libs';
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';

/**
 * Main Logseq-Jira Function to register the plugin.
 */

function main() {

    logseq.useSettingsSchema(settings);

    logseq.Editor.registerSlashCommand('Update Jira Issue', (_) => {
        return updateJiraIssue();
    })

    logseq.App.registerCommand('refreshJira', {
        key: 'refreshJira',
        label: 'Refresh Jira',
        desc: 'Refresh Jira links in block',
        keybinding: { binding: 'mod+shift+j' }
    }, (e) => {
        return updateJiraIssue();
    })

    console.log("Jira Plugin loaded.")

}


type Data = {
    [issueKey: string]: {
      text: string;
      status: string;
      type: string;
      priority: string;
      creator: string;
      reporter: string;
      assignee: string;
      fixVersion: string;
    };
  };

// Regex declarations
// DEV-1000

const regexList = [

    // DEV-1001
    /(?<![\,\.\/\S])(?<issue>[A-Z][A-Z0-9]+-[0-9]+)(?!.?\])/gim, 

    // https://company.atlassian.net/browse/DEV-1000
    /(?<!\()(?<url>https*:\/\/.{1,25}.atlassian.net\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))(?!\))/gim,

    // [Some Jira status text we could update](https://company.atlassian.net/browse/DEV-1000)
    /\[(?<description>[^\]]*)?\]\((?<url>https?:\/\/[A-Za-z0-9 ]+\.atlassian\.net\/browse\/(?<issue>[A-Za-z0-9\-]+))\)/gim
];

// DEV-1000 https://company.atlassian.net/browse/DEV-1000 (basically everything that has an issueKey)
const issueTestRegex: RegExp = /([A-Z][A-Z0-9]+-[0-9]+)/gim



// Primary function called by slash command
async function updateJiraIssue() {
    try {

        // Get current block value
        const currentBlock = await logseq.Editor.getCurrentBlock();
        let value = currentBlock?.content;
        const uuid = currentBlock?.uuid;
        
        if (!value || value.length < 3 || !issueTestRegex.test(value)) {                                               // TODO: Find a better logic?
            logseq.UI.showMsg("Couldn't find a valid Jira issue key.", 'error');
            return;
        };

        
        const issuesList = getIssuesList(value);

        if (!issuesList || issuesList.length < 1) {
            logseq.UI.showMsg("Couldn't find any Jira issues.", 'error');
            return;
        };

        
        const issues = await getIssues(issuesList);
        
        const data = generateTextFromResponse(issues);
        
        const newValue = await replaceAsync(value, data);

        // const properties = {};      // Doesn't work cuz updateBlock won't also update properties in one click.  

        // if (issuesList?.length === 1) {
        //     let issueKey = issuesList[0];
        //     console.log("One issue found.");
        //     logseq.settings?.jiraShowAssignee ? properties["assignee"] = data[issueKey].assignee || '' : null;
        //     logseq.settings?.jiraShowPriority ? properties["priority"] = data[issueKey].priority : null;
        //     logseq.settings?.jiraShowFixVersion ? properties["fix-version"] = data[issueKey].fixVersion || '' : null;
        //     logseq.settings?.jiraShowStatus ? properties["status"] = data[issueKey].status : null;
        //     logseq.settings?.jiraShowReporter ? properties["reporter"] = data[issueKey].reporter : null;
        //     console.log(properties);
        // }

        await logseq.Editor.updateBlock(currentBlock.uuid, newValue);

        if (issuesList?.length === 1) {
            let issueKey = issuesList[0];
            console.log("One issue found.");
            logseq.settings?.jiraShowAssignee && await logseq.Editor.upsertBlockProperty(uuid, "assignee", data[issueKey].assignee);
            logseq.settings?.jiraShowPriority && await logseq.Editor.upsertBlockProperty(uuid, "priority", data[issueKey].priority);
            logseq.settings?.jiraShowFixVersion && await logseq.Editor.upsertBlockProperty(uuid, "fix-version", data[issueKey].fixVersion);
            logseq.settings?.jiraShowStatus && await logseq.Editor.upsertBlockProperty(uuid, "status", data[issueKey].status);
            logseq.settings?.jiraShowReporter && await logseq.Editor.upsertBlockProperty(uuid, "reporter", data[issueKey].reporter);
        }
        
        
        //await logseq.Editor.updateBlock(currentBlock.uuid, newValue, { properties: properties });

        logseq.UI.showMsg('Updated all JIRA links found.')
    } catch (e) {
        console.log('logseq-jira', e.message);
    }
}

// Get issues from block text.
function getIssuesList(str: string): Array<string> {
    return [...new Set(str.match(issueTestRegex))];
}

// Get issues from Jira
async function getIssues(issuesList: Array<string>) {

    const promises = issuesList.map(async (issueKey: string) => {
            if (!issueTestRegex.test(issueKey)) {
                console.log(`logseq-jira: Badly structured issueKey ${issueKey}`);
            }
    
            const baseURL = logseq.settings?.jiraBaseURL;
            if (!baseURL) {
                logseq.UI.showMsg('Jira base URL not set. Update in Plugin settings.')
                throw new Error('Jira base URL not set.');
            }
    
            const creds = Buffer.from(`${logseq.settings?.jiraUsername}:${logseq.settings?.jiraAPIToken}`).toString("base64");
            const issueRest = `https://${baseURL}/rest/api/3/issue/${issueKey}`;
            const jiraURL = `https://${baseURL}/browse/${issueKey}`;
            let req = await fetch(issueRest, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Basic ${creds}`
                }
            });
            let body = await req.json();
            console.log(body);
            return { issueKey, body, jiraURL }
            }
    );
    return await Promise.all(promises);
};

//Generate markdown text from results
function generateTextFromResponse(responses: any[]): Data {
    let data: Data = {};
    responses.forEach(response => {
        data[response.issueKey] = {
            text: `[${response.body.key}|${response.body.fields.summary}](${response.jiraURL})`,
            status: response.body.fields.status.name || "None",
            type: response.body.fields.issuetype.name || "None",
            priority: response.body.fields.priority.name || "None",
            creator: response.body.fields.creator.displayName || "None",
            reporter: response.body.fields.reporter.displayName || "None",
            assignee: response.body.fields.assignee?.displayName || "None",
            fixVersion: response.body.fields.fixVersions[0]?.name || "None"
        };
    });
    return data; 
}

// Helper function run regex replacements asynchronously and as soon as possible.
async function replaceAsync(str: string, data: Data) {
    let newString = str;
    for (const regex of regexList) {
            newString = newString.replace(regex, (match, ...args: any[]) => {
                const { issue } = args.pop();
                return data[issue].text;
            });
    }
    return newString;
}

const settings: SettingSchemaDesc[] = [
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


logseq.ready(main).catch(console.error);
