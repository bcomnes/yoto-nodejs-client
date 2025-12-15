# Device TUI - Next Steps

## Known Limitations to Address

### P1 - High Priority

- [ ] **Grid doesn't resize on terminal resize**
  - `columns` is calculated once at startup
  - Should listen for `screen.on('resize')` and reflow cards
  - May need to recreate card widgets or just reposition them

- [ ] **No scroll in overview**
  - If more devices than fit on screen, they overflow/clip
  - Consider using a scrollable container or List widget for overview
  - Alternative: pagination with page indicators

### P2 - Medium Priority

- [ ] **No device hot-add/remove**
  - If devices are added/removed from account, TUI doesn't update
  - Could poll `account.refreshDevices()` periodically
  - Or add a manual refresh key (`R` to refresh device list?)

- [ ] **Fixed card dimensions**
  - Cards are hardcoded at 28x8 chars
  - May clip content on very small terminals
  - Consider adaptive sizing based on terminal dimensions

## Feature Ideas

### Device Interaction (not just monitoring)

- [ ] **Volume control**
  - `+`/`-` keys to adjust volume in detail view
  - Show visual feedback when changing

- [ ] **Playback controls**
  - Space to play/pause
  - `n`/`p` for next/previous track
  - `s` to stop playback

- [ ] **Sleep timer**
  - Set sleep timer from TUI
  - Show countdown in detail view

- [ ] **Day/Night mode toggle**
  - Quick toggle between day/night mode

### Display Enhancements

- [ ] **Progress bar for playback**
  - Visual progress bar instead of just time display
  - `[████████░░░░░░░░] 3:45 / 8:20`

- [ ] **Card content info**
  - Show card title/artwork info if available
  - Maybe fetch card metadata from API

- [ ] **Alarms display**
  - Show configured alarms in detail view
  - Ability to enable/disable alarms

- [ ] **Config editing**
  - Edit device config values from detail view
  - Form-based UI for settings

### UX Improvements

- [ ] **Loading spinner during initialization**
  - Replace console.log with proper TUI loading screen
  - Show progress as each device connects

- [ ] **Connection status in footer**
  - Show overall connection health
  - "3/3 devices online" or similar

- [ ] **Notification/toast system**
  - Brief popup notifications for events
  - "Device X went offline" toast

- [ ] **Help overlay**
  - `?` key to show all keyboard shortcuts
  - Dismissable overlay with command reference

- [ ] **Search/filter devices**
  - `/` to search by name
  - Filter by online/offline status

## Technical Improvements

- [ ] **Extract TUI components**
  - Move `createDeviceCard`, `createDetailView` to separate files
  - Create reusable component pattern

- [ ] **Add YotoAccount device event forwarding**
  - Update `YotoAccount` to forward all device events (statusUpdate, configUpdate, etc.)
  - Would simplify TUI event subscription code

- [ ] **Configuration file**
  - Support config file for TUI preferences
  - Colors, refresh intervals, default view, etc.

- [ ] **Logging to file**
  - Option to log events to file for debugging
  - `--log-file` CLI option

## Refactoring

- [ ] **Consider blessed-contrib widgets**
  - Gauge widget for battery
  - Sparkline for historical data
  - LCD-style numbers for volume

- [ ] **State management**
  - Currently state is scattered (selectedIndex, currentView, etc.)
  - Consider a simple state object with update functions

## Testing Notes

- Test with 1 device
- Test with many devices (5+) to verify grid layout
- Test device going offline/online during session
- Test token refresh during long session
- Test on different terminal sizes
- Test vim key navigation (hjkl)