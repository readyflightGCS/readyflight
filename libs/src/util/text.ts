/**
 * Captialises a string by converting its first character to uppercase.
 * If the input is an empty string, the result is an empty string.
 * 
 * @remarks
 * This function does not modify the original string
 * 
 * @example
 * ```ts
 * capitalise("hello") // "Hello"
 * capitalise("")      // ""
 * ```
 * 
 * @param str  - The string to capitalise
 * @returns The capitalised string, or the original if the value is falsy
 */
export function capitalise(str: string) {
  return str && str[0].toUpperCase() + str.slice(1);
}