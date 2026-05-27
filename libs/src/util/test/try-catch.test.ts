import { expect, test } from 'bun:test'
import { tryCatch } from '../try-catch'

test('trycatch success', async () => {
  const res = await tryCatch(new Promise((resolve) => resolve(1 + 2)))
  expect(res.error).toBeNull()
  expect(res.data).toBe(3)
})

test('trycatch error', async () => {
  const res = await tryCatch(
    new Promise(() => {
      throw new Error('hello')
    })
  )
  expect(res.data).toBeNull()
  expect(res.error).not.toBeNull()
})
