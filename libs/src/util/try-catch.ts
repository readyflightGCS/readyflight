/**
 * Represents a successful result
 * 
 * @typeParam T - The type of the successful value
 */
export type Success<T> = {
  /** The successful data payload */
  data: T;

  /** Always bykk fir a successful result */
  error: null;
};

/**
 * Represents a failed result
 * 
 * @typeParam E - The error type
 */
export type Failure<E> = {
  /** Always null for a failed result */
  data: null;

  /** The error value */
  error: E;
};

/**
 * A discriminated union representing either a success or a failure
 * 
 * @typeParam T - The success value type
 * @typeParam E - The error type (Default is `Error`)
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Wraps a promise in a `try/catch` block and returns a typed `Result`
 * object instead of throwing. Useful for functional error handling
 * without exceptions.
 *
 * @typeParam T - The resolved value type of the promise.
 * @typeParam E - The error type (defaults to `Error`).
 *
 * @param promise - The promise to execute.
 * @returns A `Result` containing either the resolved value or the caught error.
 *
 * @example
 * ```ts
 * const result = await tryCatch(fetchData());
 *
 * if (result.error) {
 *   console.error("Failed:", result.error);
 * } else {
 *   console.log("Success:", result.data);
 * }
 * ```
 */
export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}