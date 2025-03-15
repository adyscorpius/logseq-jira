export type FixVersion = {
  id: number,
  self: string,
  name: string,
  archived: boolean,
  released: boolean
}

export type Priority = {
  id: number
  self: string,
  iconUrl: string,
  name: string,
}

export type User = {
  id: number,
  displayName: string
}

export type Status = {
  id: number,
  name: string,
  statusCategory: {
    name: string,
    colorName: string
  }
}

export type Resolution = {
  id: number,
  name: string,
}

export type IssueType = {
  id: number,
  self: string,
  description: string,
  iconUrl: string,
  name: string,
  subtask: boolean,
  avatarId: number,
  hierarchyLevel: number
}

export type Issue = {
  id: number,
  expand: string,
  self: string,
  key: string,
  fields: {
    assignee: User,
    creator: User,
    reporter: User,
    summary: string,
    issuetype: IssueType,
    fixVersions: FixVersion[],
    priority: Priority,
    resolution: Resolution,
    status: Status
  }
}

export type SearchResult = {
  expand: string,
  startAt: number,
  maxResults: number,
  total: number,
  issues: Issue[]
}

export type JiraConnectionSettings = {
  baseURL: string,
  username: string,
  APIToken: string,
  authType: "Basic Auth" | "PAT",
  APIVersion: "3" | "2",
}

export type IssuesWithDomain = {
  body: Issue,
  jiraURL: string
};