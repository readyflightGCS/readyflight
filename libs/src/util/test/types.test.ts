import { expect, test } from "bun:test";
import { objectKeys } from "../types";

test("object-keys", async () => {
    const obj = { a : 1, b : 2 };
    const keys = objectKeys(obj);

    expect(keys).toBeArray();
})