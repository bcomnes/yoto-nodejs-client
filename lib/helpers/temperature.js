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
export function parseTemperature (tempValue) {
  // Handle null/undefined
  if (tempValue == null) {
    return null
  }

  // Convert to string
  const tempStr = String(tempValue)

  // Empty string
  if (!tempStr) {
    return null
  }

  // Colon-separated format (e.g., '0:19', '12:20:23', '0:unavailable')
  if (tempStr.includes(':')) {
    const parts = tempStr.split(':')
    const secondValue = parts[1] ?? ''

    // Parse second value as number
    const parsed = parseFloat(secondValue)

    // Return null if not a valid number (e.g., 'unavailable', 'notSupported')
    if (isNaN(parsed)) {
      return null
    }

    return parsed
  }

  // Fallback: try to parse as plain number (e.g., '19' or '0')
  const parsed = parseFloat(tempStr)
  if (isNaN(parsed)) {
    return null
  }

  return parsed
}
