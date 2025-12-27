/**
 * Temperature parsing helper for Yoto device status
 *
 * Temperature field format: colon-separated string where second value (index [1]) is temperature in Celsius
 * Examples: '0:19' → 19°C, '12:20:23' → 20°C, '0:0' → 0°C, '0:unavailable' → null
 * Plain string format: '19' → 19°C, '0' → 0°C
 */
/**
 * Parse temperature from Yoto status message
 *
 * @param {string | number | null | undefined} tempValue - Temperature value from status message
 * @returns {number | null} Temperature in Celsius, or null if unavailable/invalid
 *
 * @example
 * parseTemperature('0:19')        // 19
 * parseTemperature('12:20:23')    // 20
 * parseTemperature('0:0')         // 0
 * parseTemperature('0:unavailable') // null
 * parseTemperature('0')           // 0
 * parseTemperature('19')          // 19
 * parseTemperature(null)          // null
 */
export function parseTemperature(tempValue: string | number | null | undefined): number | null;
//# sourceMappingURL=temperature.d.ts.map