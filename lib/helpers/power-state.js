/**
 * Power state detection helper for Yoto device status
 *
 * Analyzes shutdown field and uptime to determine device power state changes
 */

/**
 * Power state detection result
 * @typedef {Object} PowerStateResult
 * @property {'running' | 'shutdown' | 'startup'} state - Device power state
 * @property {string | null} shutDownReason - Shutdown reason if state is 'shutdown'
 * @property {number | null} upTime - Device uptime in seconds if state is 'startup'
 */

/**
 * Detect device power state from legacy status
 *
 * @param {string | null | undefined} shutDown - shutDown field from legacy status
 * @param {number | null | undefined} upTime - upTime field from legacy status in seconds
 * @returns {PowerStateResult}
 *
 * @example
 * // Device running normally
 * detectPowerState('nA', 3600)
 * // { state: 'running', shutDownReason: null, upTime: null }
 *
 * @example
 * // Device just started (low uptime)
 * detectPowerState('nA', 45)
 * // { state: 'startup', shutDownReason: null, upTime: 45 }
 *
 * @example
 * // Device shutting down
 * detectPowerState('userShutdown', 3600)
 * // { state: 'shutdown', shutDownReason: 'userShutdown', upTime: null }
 */
export function detectPowerState (shutDown, upTime) {
  // No shutdown field - assume running
  if (shutDown == null) {
    return {
      state: 'running',
      shutDownReason: null,
      upTime: null
    }
  }

  // shutDown: 'nA' means "not applicable" - device is running
  if (shutDown === 'nA') {
    // Low uptime indicates recent startup (< 2 minutes)
    if (upTime != null && upTime < 120) {
      return {
        state: 'startup',
        shutDownReason: null,
        upTime
      }
    }

    // Normal running state
    return {
      state: 'running',
      shutDownReason: null,
      upTime: null
    }
  }

  // Any other value means device is shutting down or has shut down
  // Examples: 'userShutdown', 'lowBattery', 'timeout', etc.
  return {
    state: 'shutdown',
    shutDownReason: shutDown,
    upTime: null
  }
}
