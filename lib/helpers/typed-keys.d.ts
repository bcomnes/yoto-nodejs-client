/**
 * @template {Record<PropertyKey, unknown>} T
 * @param {T} obj
 * @returns {(keyof T)[]}
 */
export function typedKeys<T extends Record<PropertyKey, unknown>>(obj: T): (keyof T)[];
//# sourceMappingURL=typed-keys.d.ts.map