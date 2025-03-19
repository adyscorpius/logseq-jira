import axios, { AxiosResponse } from "axios";
import { Issue, JiraConnectionSettings, SearchResult } from "../jiraTypes";

function getAuthHeader(user: string, token: string, authType: string): string {
  let authHeader;
  if (authType === "PAT") { // For PAT https://developer.atlassian.com/server/jira/platform/personal-access-token/#personal-access-token
    return authHeader = `Bearer ${token}`;
  }
  
  // Essential Basic Authentication https://developer.atlassian.com/server/jira/platform/basic-authentication/#basic-authentication
  return `Basic ${btoa(`${user}:${token}`)}`;
}

const ConstructRestApiUrl = (domain: string, apiVersion: string) => `https://${domain}/rest/api/${apiVersion}`;

export const GetIssueUrl = (issue: Issue, domain: string) => `https://${domain}/browse/${issue.key}`;

export async function MakeSearchRequest(jqlQuery: string, connectionSettings: JiraConnectionSettings): Promise<SearchResult> {
  try {
    const jqlQueryUrl = `${ConstructRestApiUrl(connectionSettings.baseURL, connectionSettings.APIVersion)}/search?jql=${encodeURIComponent(jqlQuery)}`;

    const response = await axios.get<SearchResult>(jqlQueryUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': getAuthHeader(
          connectionSettings.username,
          connectionSettings.APIToken,
          connectionSettings.authType
        )
      }
    });

    console.log(`Response: ${response.status} ${response.statusText}`);

    const result = response.data;
    return Promise.resolve(result);

  }
  catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
}

export async function MakeIssueRequest(issueKeys: string[], connectionSettings: JiraConnectionSettings): Promise<Issue[]> {
  try {

    const authHeader = getAuthHeader(
      connectionSettings.username,
      connectionSettings.APIToken,
      connectionSettings.authType
    );

    const requests: Promise<AxiosResponse<Issue, any> | undefined>[] = [];

    for (const issueKey of issueKeys) {
      const issueRest = `${ConstructRestApiUrl(connectionSettings.baseURL, connectionSettings.APIVersion)}/issue/${issueKey}`;

      const getFunc = async () => {
        try {
          return await axios.get<Issue>(issueRest, {
            headers: {
              'Accept': 'application/json',
              'Authorization': authHeader
            }
          });
        }
        catch (e: any) {
          logseq.UI.showMsg(`Failed to fetch ${issueKey}: ${e.message}`, 'error');
          return undefined;
        }
      };
      requests.push(getFunc());
    }

    const resolvedRequests = await Promise.all(requests);

    return Promise.resolve(resolvedRequests.filter(r => r !== undefined).map(r => r!.data));

  }
  catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
}