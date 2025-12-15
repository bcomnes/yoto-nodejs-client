# Agent Development Notes

This document contains patterns, conventions, and guidelines for developing the homebridge-yoto plugin.

## No builds

Do not build the project. It's all js files and types stripped ts files. 

## JSDoc Typing Patterns

### Use TypeScript-in-JavaScript (ts-in-js)

All source files use `.js` extensions with JSDoc comments for type safety. This provides type checking without TypeScript compilation overhead.

### Avoid `any` types

Always provide specific types. Use `unknown` when the type is truly unknown, then narrow it with type guards.

**Bad:**
```javascript
/**
 * @param {any} data
 */
function processData(data) {
  return data.value;
}
```

**Good:**
```javascript
/**
 * @param {YotoDeviceStatus} status
 * @returns {number}
 */
function getBatteryLevel(status) {
  return status.batteryLevelPercentage;
}
```

### Use @ts-expect-error over @ts-ignore

When you must suppress a TypeScript error, use `@ts-expect-error` with a comment explaining why. This will error if the issue is fixed, prompting cleanup.

**Bad:**
```javascript
// @ts-ignore
const value = accessory.context.device.unknownProperty;
```

**Good:**
```javascript
// @ts-expect-error - API may return undefined for offline devices
const lastSeen = accessory.context.device.lastSeenAt;
```

### Use newer @import syntax in jsdoc/ts-in-js for types only

Import types using the `@import` JSDoc tag to avoid runtime imports of type-only dependencies.

```javascript
/** @import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge' */
/** @import { YotoDevice, YotoDeviceStatus, YotoDeviceConfig } from './types.js' */

/**
 * @param {Logger} log
 * @param {PlatformConfig} config
 * @param {API} api
 */
export function YotoPlatform(log, config, api) {
  this.log = log;
  this.config = config;
  this.api = api;
}
```

### Import Consolidation

Keep regular imports and type imports separate. Use single-line imports for types when possible.

```javascript
import { EventEmitter } from 'events';

/** @import { YotoDevice } from './types.js' */
/** @import { API, PlatformAccessory } from 'homebridge' */
```

## Changelog Management

**NEVER manually edit CHANGELOG.md**
