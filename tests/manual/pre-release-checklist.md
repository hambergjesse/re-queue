# RE:Q Pre-Release Testing Checklist

This document provides a comprehensive checklist for manual testing of the RE:Q extension before releasing a new version. All tests should be performed on each supported browser (Chrome, Firefox, Edge, and Opera).

## Installation Tests

- [ ] Extension can be installed from a ZIP file in Chrome
- [ ] Extension can be installed from an XPI file in Firefox
- [ ] Extension can be installed from a ZIP file in Edge
- [ ] Extension can be installed from a ZIP file in Opera
- [ ] Extension icon appears in the browser toolbar after installation
- [ ] Extension doesn't show any errors in the browser console on installation

## Basic Functionality Tests

- [ ] Extension popup opens when clicking the icon
- [ ] Popup displays the correct enabled/disabled status
- [ ] Popup displays the correct browser information
- [ ] Toggle switches in popup respond to clicks
- [ ] Enabled/disabled state persists after closing and reopening the popup
- [ ] Enabled/disabled state persists after browser restart

## Domain Detection Tests

- [ ] Popup correctly identifies when Renown.gg tabs are open
- [ ] Popup correctly updates when opening a new Renown.gg tab
- [ ] Popup correctly updates when closing all Renown.gg tabs
- [ ] Domain status indicator shows green when Renown.gg tabs are detected
- [ ] Domain status indicator shows red when no Renown.gg tabs are detected

## Queue Detection Tests

- [ ] Extension detects when a queue is active on Renown.gg
- [ ] Extension increases polling frequency when in queue (verify in logs with Debug Mode)
- [ ] Extension returns to normal polling when queue ends (verify in logs with Debug Mode)

## Button Detection and Clicking Tests

- [ ] Extension correctly identifies the "Accept" button when it appears
- [ ] Extension successfully clicks the "Accept" button
- [ ] Extension can click the button even when the tab is not in focus
- [ ] Extension can click the button even when the tab is in a background window
- [ ] Extension can click the button even when the user is on a different tab

## Cross-Browser Compatibility Tests

### Chrome-Specific Tests
- [ ] Extension works with Chrome energy-saving features enabled
- [ ] Extension works with multiple Chrome windows open
- [ ] Extension works when Chrome is restarted

### Firefox-Specific Tests
- [ ] Extension properly requests and uses host permissions
- [ ] Firefox-specific button clicking method works correctly
- [ ] Extension works after Firefox is restarted (with permanent installation)

### Edge-Specific Tests
- [ ] Extension works with Edge's tracking prevention features enabled
- [ ] Extension works with multiple Edge windows open

### Opera-Specific Tests
- [ ] Extension works with Opera's battery saver mode
- [ ] Extension works with multiple Opera windows open

## Performance Tests

- [ ] Extension doesn't cause noticeable CPU usage when idle
- [ ] Extension doesn't cause noticeable memory leaks over time
- [ ] Extension responds quickly when "Accept" button appears
- [ ] Extension doesn't slow down browser performance

## Debug Mode Tests

- [ ] Debug mode can be toggled on/off in the popup
- [ ] Debug mode logs appropriate information to the console
- [ ] Debug mode setting persists after browser restart
- [ ] Debug logs provide useful diagnostic information

## Error Handling Tests

- [ ] Extension gracefully handles network errors
- [ ] Extension recovers properly if Renown.gg is temporarily unavailable
- [ ] Extension doesn't crash if the DOM structure changes
- [ ] Extension logs helpful error messages in debug mode

## Security Tests

- [ ] Extension only runs on Renown.gg domains
- [ ] Extension doesn't expose sensitive information in console logs
- [ ] Extension doesn't make any unexpected network requests
- [ ] Extension doesn't interfere with other browser extensions

## Miscellaneous Tests

- [ ] Extension works with browser's dark mode / light mode
- [ ] Extension popup is responsive and looks correct on all browser zoom levels
- [ ] Extension uninstalls cleanly without leaving residual data
- [ ] Extension works on different operating systems (Windows, macOS, Linux)

## Final Release Checks

- [ ] All automated tests pass
- [ ] Version number is correct in manifest.json
- [ ] Release notes are prepared and accurate
- [ ] All browser-specific packages build correctly
- [ ] Documentation is up-to-date
- [ ] Git tags are created for the release

## Post-Release Monitoring

- [ ] Monitor for unexpected errors in production
- [ ] Check for user feedback and issues
- [ ] Verify the extension works on the latest browser versions
- [ ] Check compatibility with any Renown.gg updates

---

**Test Results Summary**

| Browser | Installation | Basic Functionality | Domain Detection | Queue Detection | Button Detection | Performance | Overall |
|---------|--------------|---------------------|------------------|-----------------|------------------|-------------|---------|
| Chrome  | ✅/❌         | ✅/❌                | ✅/❌             | ✅/❌             | ✅/❌             | ✅/❌        | ✅/❌    |
| Firefox | ✅/❌         | ✅/❌                | ✅/❌             | ✅/❌             | ✅/❌             | ✅/❌        | ✅/❌    |
| Edge    | ✅/❌         | ✅/❌                | ✅/❌             | ✅/❌             | ✅/❌             | ✅/❌        | ✅/❌    |
| Opera   | ✅/❌         | ✅/❌                | ✅/❌             | ✅/❌             | ✅/❌             | ✅/❌        | ✅/❌    |

**Tester:** _______________________

**Test Date:** _______________________

**Version Tested:** _______________________

**Notes:** 