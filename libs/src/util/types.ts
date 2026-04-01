/**
 * Returns the keys of an object in a fully type-safe way
 * 
 * @remarks
 * This is a typed wrapper around `Object.keys` that preserves the
 * literal key types of the input object, rather than widening them 
 * to `string[]`
 * 
 * @typeParam T - The object type whose keys should be returned
 * 
 * @param a - The object to extract the keys from
 * @returns An array of keys of the objectm typed as `(keyof T)[]`
 * 
 * @example
 * ```ts
 * const obj = {a:1, b:2};
 * const keys = objectKeys(obj); // type: ("a" | "b")[]
 * ```
 */
export function objectKeys<T extends Object>(a: T): T extends any ? (keyof T)[] : never {
  return Object.keys(a) as T extends any ? (keyof T)[] : never
}