import axios, { AxiosError, AxiosResponse } from "axios";
import { Issue, JiraConnectionSettings, SearchResult } from "../jiraTypes";

/**
 * HTTP headers used in Jira API requests
 */
const API_HEADERS = {
  'Accept': 'application/json',
} as const;

/**
 * Authentication types supported by Jira
 */
type AuthType = 'PAT' | 'BASIC';

/**
 * Creates the appropriate authorization header for Jira API requests
 * @param user - Username for basic auth or client ID for PAT
 * @param token - Password for basic auth or PAT token
 * @param authType - Type of authentication to use
 * @returns Formatted authorization header string
 */
function createAuthHeader(user: string, token: string, authType: AuthType): string {
  if (authType === 'PAT') {
    return `Bearer ${token}`;
  }
  return `Basic ${btoa(`${user}:${token}`)}`;
}

/**
 * Constructs the base URL for Jira REST API endpoints
 * @param domain - Jira domain (e.g., 'your-domain.atlassian.net')
 * @param apiVersion - Jira API version (e.g., '3')
 * @returns Complete REST API base URL
 */
const constructRestApiUrl = (domain: string, apiVersion: string): string => 
  `https://${domain}/rest/api/${apiVersion}`;

/**
 * Generates the URL for viewing a Jira issue in the browser
 * @param issue - Jira issue object
 * @param domain - Jira domain
 * @returns Complete issue URL
 */
export const getIssueUrl = (issue: Issue, domain: string): string => 
  `https://${domain}/browse/${issue.key}`;

/**
 * Makes a JQL search request to the Jira API
 * @param jqlQuery - JQL query string
 * @param connectionSettings - Jira connection settings
 * @returns Promise resolving to search results
 * @throws {AxiosError} If the API request fails
 */
export async function makeSearchRequest(
  jqlQuery: string, 
  connectionSettings: JiraConnectionSettings
): Promise<SearchResult> {
  try {
    const jqlQueryUrl = `${constructRestApiUrl(connectionSettings.baseURL, connectionSettings.APIVersion)}/search?jql=${encodeURIComponent(jqlQuery)}`;
    
    const response = await axios.get<SearchResult>(jqlQueryUrl, {
      headers: {
        ...API_HEADERS,
        'Authorization': createAuthHeader(
          connectionSettings.username,
          connectionSettings.APIToken,
          connectionSettings.authType as AuthType
        )
      }
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Jira API Error:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }
    throw error;
  }
}

/**
 * Fetches multiple Jira issues by their keys
 * @param issueKeys - Array of Jira issue keys
 * @param connectionSettings - Jira connection settings
 * @returns Promise resolving to array of issues
 * @throws {AxiosError} If any API request fails
 */
export async function makeIssueRequest(
  issueKeys: string[], 
  connectionSettings: JiraConnectionSettings
): Promise<Issue[]> {
  try {
    const authHeader = createAuthHeader(
      connectionSettings.username,
      connectionSettings.APIToken,
      connectionSettings.authType as AuthType
    );

    const requests = issueKeys.map(async (issueKey) => {
      const issueUrl = `${constructRestApiUrl(connectionSettings.baseURL, connectionSettings.APIVersion)}/issue/${issueKey}`;
      
      try {
        const response = await axios.get<Issue>(issueUrl, {
          headers: {
            ...API_HEADERS,
            'Authorization': authHeader
          }
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.status == 404) {
            logseq.UI.showMsg(`Could not find issue ${issueKey}.`, 'warning', { timeout: 3000 });

          } else {
            logseq.UI.showMsg(`Failed to fetch ${issueKey}: ${error.message}`, 'error');
          }
        }
        return null;
      }
    });

    const results = await Promise.all(requests);
    return results.filter((issue): issue is Issue => issue !== null);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Jira API Error:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }
    throw error;
  }
}