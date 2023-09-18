import '@logseq/libs';
import { settings } from './settings';

type Data = {
    [issueKey: string]: {
        text: string;
        summary: string;
        status: string;
        type: string;
        priority: string;
        creator: string;
        reporter: string;
        assignee: string;
        fixVersion: string;
        resolution: string;
    };
};

/**
 * Main Logseq-Jira Function to register the plugin.
 */

function main() {

    logseq.useSettingsSchema(settings);

    logseq.Editor.registerSlashCommand('Update Jira Issue', (_) => {
        return updateJiraIssue();
    })

    if (logseq.settings.enableSecond) {

    logseq.Editor.registerSlashCommand('Update Jira Issue for 2nd Organization', (_) => {
        return updateJiraIssue(true);
    })
    }

    logseq.App.registerCommand('refreshJira', {
        key: 'refreshJira',
        label: 'Refresh Jira',
        desc: 'Refresh Jira links in block',
        keybinding: { binding: 'mod+shift+j' }
    }, () => {
        return updateJiraIssue();
    })

    console.log("Jira Plugin loaded.")

}



// Regex declarations
// DEV-1001
// https://company.atlassian.net/browse/DEV-1000
// [Some Jira status text we could update](https://company.atlassian.net/browse/DEV-1000)
const regexList = [
    /(?<![\,\.\/\S])(?<issue>[A-Z][A-Z0-9]+-[0-9]+)(?!.?\])/gim,

    /(?<!\()(?<url>https*:\/\/.{1,25}.atlassian.net\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))(?!\))/gim,

    /\[(?<description>[^\]]*)?\]\((?<url>https?:\/\/[A-Za-z0-9 ]+\.atlassian\.net\/browse\/(?<issue>[A-Za-z0-9\-]+))\)/gim
];

// DEV-1000 https://company.atlassian.net/browse/DEV-1000 (basically everything that has an issueKey)
const issueTestRegex: RegExp = /([A-Z][A-Z0-9]+-[0-9]+)/gim



// Primary function called by slash command
async function updateJiraIssue(useSecondOrg = false) {

    try {
        
        const currentBlock = await logseq.Editor.getCurrentBlock();
        let value = currentBlock?.content;
        const uuid = currentBlock?.uuid;

        if (!value || value.length < 3) {  // TODO: Find a better logic?
            logseq.UI.showMsg("Couldn't find a valid Jira issue key.", 'error');
            throw new Error("Couldn't find a valid Jira issue key.");
        };

        const issuesList = extractIssues(value);

        if (!issuesList || issuesList.length < 1) {
            logseq.UI.showMsg("Couldn't find any Jira issues in this block.", 'error');
            return;
        };

        const issues = await getIssues(issuesList, useSecondOrg);

        const data = generateTextFromResponse(issues);

        let properties = genProperties(data[issuesList[0]]);
        //if (issuesList?.length === 1) { FIXME: When logseq fixes issue, these can be done together.
        if (logseq.settings.addToBlockProperties) {

            Object.entries(properties).map(async ([key, value]) => {
                await logseq.Editor.upsertBlockProperty(uuid, key, value)
            })
        } else {
            const newValue = await replaceAsync(value, data);
            await logseq.Editor.updateBlock(uuid, newValue, {
                properties
            });
        }

    } catch (e) {
        console.log('logseq-jira', e.message);
    }
}

// Get issues from block text.
function extractIssues(str: string): Array<string> {
    return [...new Set(str.match(issueTestRegex))];
}

// Get issues from Jira
async function getIssues(issuesList: Array<string>, useSecondOrg = false) {

    const promises = issuesList.map(async (issueKey: string) => {
        if (!issueTestRegex.test(issueKey)) {
            console.log(`logseq-jira: Badly structured issueKey ${issueKey}`);
        }

        const baseURL = useSecondOrg ? logseq.settings?.jiraBaseURL2 : logseq.settings?.jiraBaseURL;
        if (!baseURL) {
            logseq.UI.showMsg('Jira base URL not set. Update in Plugin settings.')
            throw new Error('Jira base URL not set.');
        }

        const creds = Buffer.from(`${useSecondOrg ? logseq.settings?.jiraUsername2 : logseq.settings?.jiraUsername}:${useSecondOrg ? logseq.settings?.jiraAPIToken2 : logseq.settings?.jiraAPIToken}`).toString("base64");
        const issueRest = `https://${baseURL}/rest/api/3/issue/${issueKey}`;
        const jiraURL = `https://${baseURL}/browse/${issueKey}`;

        let req = await fetch(issueRest, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${creds}`
            }
        });
        let body = await req.json();
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
            summary: `[${response.body.fields.summary}](${response.jiraURL})` || "None",
            status: response.body.fields.status?.name || "None",
            type: response.body.fields.issuetype?.name || "None",
            priority: response.body.fields.priority?.name || "None",
            creator: response.body.fields.creator?.displayName || "None",
            reporter: response.body.fields.reporter?.displayName || "None",
            assignee: response.body.fields.assignee?.displayName || "None",
            fixVersion: response.body.fields.fixVersions[0]?.name || "None",
            resolution: response.body.fields.resolution?.name || null
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

function genProperties(properties) {
    const { assignee, priority, fixVersion, status, reporter, summary, resolution } = properties;
    const { showAssignee,
        showPriority, 
        showFixVersion, 
        showStatus, 
        showReporter,
        showResolution
    } = logseq.settings;
    
    let a = {}

    a['summary'] = summary;
    if (showAssignee) a['assignee'] = assignee;
    if (showPriority) a['priority'] = priority;
    if (showFixVersion) a['fix-version'] = fixVersion;
    if (showStatus) a['status'] = status;
    if (showReporter) a['reporter'] = reporter;
    if (showResolution && resolution) a['resolution'] = resolution
    return a;
}

logseq.ready(main).catch(console.error);
