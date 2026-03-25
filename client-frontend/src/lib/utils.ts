import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and intelligently merges CSS class names.
 *
 * This utility first uses `clsx` to conditionally join class values
 * (strings, arrays, objects, falsy values, etc.), then passes the result
 * through `tailwind-merge` to resolve conflicting Tailwind classes.
 *
 * Useful for building dynamic className strings in React components
 * without worrying about duplicates or override order.
 *
 * @param inputs - Any number of class values supported by `clsx`
 * (strings, arrays, objects, booleans, null/undefined).
 *
 * @returns A single merged className string with Tailwind conflicts resolved.
 *
 * @example
 * ```ts
 * cn("px-2 py-1", "px-4") // => "py-1 px-4"
 * ```
 *
 * @example
 * ```ts
 * cn("text-sm", isActive && "font-bold")
 * ```
 *
 * @example
 * ```ts
 * <div className={cn("rounded", props.className)} />
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}