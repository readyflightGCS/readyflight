// get the keys of an object safely
export function objectKeys<T extends Object>(a: T): T extends any ? (keyof T)[] : never {
  return Object.keys(a) as T extends any ? (keyof T)[] : never
}
