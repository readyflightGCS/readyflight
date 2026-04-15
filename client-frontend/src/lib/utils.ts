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

/**
 * Downloads text content as a file to the user's device
 * @param filename Name of the file to download
 * @param text Text content to download
 */
export function downloadBlobAsFile(filename: string, data: Blob): void {
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(data);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href); // Clean up memory
}

