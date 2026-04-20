# Testing Guide for Logseq JIRA Plugin Migration

This guide outlines the testing strategy for the Logseq API migration from legacy to database-backed architecture.

## Testing Phases

### Phase 1: Legacy API Testing (Current)
Test the plugin with the current Logseq version using the legacy adapter.

#### Test Cases
1. **Basic Functionality**
   - [ ] Plugin loads successfully
   - [ ] Settings are accessible and configurable
   - [ ] Slash commands are registered correctly

2. **JIRA Integration**
   - [ ] Single issue update works
   - [ ] Batch issue updates work
   - [ ] JQL queries return results
   - [ ] Error handling for invalid credentials
   - [ ] Error handling for network issues

3. **Block Operations**
   - [ ] Current block detection
   - [ ] Block content retrieval
   - [ ] Block content updates
   - [ ] Batch block insertion

4. **UI Integration**
   - [ ] Main UI visibility tracking
   - [ ] Message notifications
   - [ ] Settings UI functionality

### Phase 2: Adapter Layer Testing
Test the abstraction layer functionality.

#### Test Cases
1. **Adapter Selection**
   - [ ] Legacy adapter selected on current Logseq
   - [ ] DB adapter selected on future Logseq (when available)
   - [ ] Fallback behavior works correctly

2. **API Compatibility**
   - [ ] All adapter methods work identically
   - [ ] Error handling is consistent
   - [ ] Resource cleanup works properly

3. **Environment Detection**
   - [ ] Version detection works correctly
   - [ ] Capability detection is accurate
   - [ ] Environment info is complete

### Phase 3: DB API Testing (Future)
Test with the new database-backed Logseq when available.

#### Test Cases
1. **DB Adapter Functionality**
   - [ ] All methods work with new API
   - [ ] Performance is acceptable
   - [ ] Data consistency is maintained

2. **Migration Scenarios**
   - [ ] Existing data migrates correctly
   - [ ] Block references are updated
   - [ ] No data loss occurs

## Manual Testing Checklist

### Setup
1. Install plugin in Logseq
2. Configure JIRA credentials
3. Create test blocks with JIRA issue keys

### Basic Workflow
1. **Issue Update**
   - Type `PROJ-123` in a block
   - Run `/Jira` → "Update Issue"
   - Verify issue details are fetched and formatted

2. **JQL Query**
   - Configure JQL query in settings
   - Run `/Jira` → "Pull JQL results"
   - Verify multiple issues are inserted as child blocks

3. **Auto-refresh**
   - Enable auto-refresh in settings
   - Restart Logseq
   - Verify existing issues are updated

4. **Dual Account**
   - Enable second JIRA account
   - Test both account commands work

### Error Scenarios
1. **Invalid Credentials**
   - Use wrong API token
   - Verify error message is shown

2. **Network Issues**
   - Disconnect internet
   - Verify graceful error handling

3. **Invalid Issue Keys**
   - Use non-existent issue key
   - Verify appropriate error message

## Automated Testing

### Unit Tests
```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

### Integration Tests
```bash
# Test with mock Logseq environment
npm run test:integration
```

## Performance Testing

### Metrics to Track
1. **Plugin Load Time** - Should be < 2 seconds
2. **Issue Fetch Time** - Should be < 5 seconds for 10 issues
3. **Block Update Time** - Should be < 1 second
4. **Memory Usage** - Should not exceed 50MB

### Load Testing
1. Test with 100+ JIRA issues
2. Test with large JQL result sets
3. Test auto-refresh with many cached issues

## Compatibility Testing

### Logseq Versions
- [ ] Test with Logseq 0.8.x (if supported)
- [ ] Test with Logseq 0.9.x (current)
- [ ] Test with Logseq 0.10.x (future DB version)

### Operating Systems
- [ ] macOS (primary development platform)
- [ ] Windows
- [ ] Linux

### JIRA Versions
- [ ] JIRA Cloud (Atlassian)
- [ ] JIRA Server/Data Center
- [ ] API v2 and v3

## Regression Testing

After each change, verify:
1. All existing functionality still works
2. No new errors in console
3. Performance hasn't degraded
4. Settings are preserved

## Bug Reporting

When reporting issues, include:
1. Logseq version
2. Plugin version
3. Operating system
4. JIRA instance type
5. Steps to reproduce
6. Expected vs actual behavior
7. Console errors (if any)

## Test Data

### Sample JIRA Issues
Create test issues with various states:
- Open/In Progress/Done
- Different priorities
- With/without assignees
- With/without fix versions

### Sample JQL Queries
```jql
# Basic query
assignee = currentUser()

# Complex query
project = TEST AND status != Done AND updated >= -7d

# Large result set
project in (PROJ1, PROJ2, PROJ3)
```

## Success Criteria

The migration is successful when:
1. All existing functionality works on current Logseq
2. Plugin is ready for future DB version
3. No performance regression
4. Clean, maintainable code architecture
5. Comprehensive test coverage
6. Clear documentation for users and developers