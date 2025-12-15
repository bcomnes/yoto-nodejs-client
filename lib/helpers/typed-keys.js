/**
 * @template {Record<PropertyKey, unknown>} T
 * @param {T} obj
 * @returns {(keyof T)[]}
 */
export function typedKeys (obj) {
  return Object.keys(obj)
}
