# Contributing to Logseq-JIRA Plugin

Thank you for your interest in contributing to the Logseq-JIRA plugin! This document provides guidelines and instructions for development.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)
- [Git](https://git-scm.com/)
- Basic knowledge of TypeScript, React, and Logseq plugin development

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/adyscorpius/logseq-jira.git
   cd logseq-jira
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Load the plugin in Logseq:
   - Open Logseq
   - Go to Settings > Advanced > Developer Mode (turn it on)
   - Click the three dots menu (⋮) > "Plugins"
   - Click "Load unpacked plugin"
   - Select the `logseq-jira` repository folder

The plugin will be loaded in development mode, with hot-reloading enabled.

## Project Structure

- `/src`: Source code
  - `main.tsx`: Main entry point and orchestration
  - `App.tsx`: React container component
  - `db.ts`: IndexedDB database using Dexie.js
  - `jiraTypes.ts`: TypeScript interfaces for JIRA data
  - `models.ts`: Plugin settings and data models
  - `settings.tsx`: Plugin settings configuration
  - `/utils`: Utility functions
    - `jiraUtils.ts`: JIRA API interaction
    - `utils.ts`: Helper functions for UI and data processing

## Build Process

- `pnpm dev`: Start development server with hot reloading
- `pnpm build`: Build production version of the plugin
- The output is saved to the `dist` directory

## Development Guidelines

### Code Style

- Follow existing code patterns and consistent formatting
- Use TypeScript for type safety
- Use React functional components with hooks

### Commits

- Follow [Conventional Commits](https://www.conventionalcommits.org/) format
- Use meaningful commit messages that describe your changes
- Examples:
  - `feat: Add support for custom JQL queries`
  - `fix: Resolve issue with API authentication`
  - `docs: Update README with new features`

### Pull Requests

- Create a feature branch for your work
- Keep PRs focused on a single feature or bug fix
- Include test steps in your PR description
- Update documentation if necessary

## Testing

When testing changes:

1. Test basic functionality:
   - Create a new block with a JIRA issue key
   - Use the slash command to fetch issue data
   - Verify the issue is formatted correctly

2. Test with various settings:
   - Try both Markdown and Org Mode
   - Test with different formatting options
   - Test with and without block properties

3. Test error cases:
   - Invalid credentials
   - Network disconnection
   - Invalid issue keys

## Release Process

The plugin uses semantic-release for automated releases:

1. Update version in package.json
2. Add all updates to master branch
3. Tag the latest commit with the new version

## Documentation

When adding new features, please update:

1. README.md with feature overview
2. SETUP_GUIDE.md with detailed instructions
3. Add appropriate inline code comments

## Getting Help

If you need help with development:

- Create an issue on GitHub for questions or bug reports
- Check the [Logseq Plugins documentation](https://docs.logseq.com/#/page/plugins)

Thank you for contributing to make this plugin better!