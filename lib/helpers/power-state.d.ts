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
export function detectPowerState(shutDown: string | null | undefined, upTime: number | null | undefined): PowerStateResult;
/**
 * Power state detection result
 */
export type PowerStateResult = {
    /**
     * - Device power state
     */
    state: "running" | "shutdown" | "startup";
    /**
     * - Shutdown reason if state is 'shutdown'
     */
    shutDownReason: string | null;
    /**
     * - Device uptime in seconds if state is 'startup'
     */
    upTime: number | null;
};
//# sourceMappingURL=power-state.d.ts.map