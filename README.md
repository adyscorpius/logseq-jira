## Logseq Jira Sync Plugin

This is an early attempt to bring Jira issue status inside Logseq.

### Known Issues / Enhancements

1. Sometimes block doesn't update fast enough for the plugin to receive block current contents.
2. Doesn't work correctly with multiple issues in a single block.
3. Running this on a link causes text to break.
4. Doesn't auto refresh to keep status updated.


### Testing the plugin

- `npm install && npm run build` in terminal to install dependencies.
- `Load unpacked plugin` in Logseq Desktop client.
