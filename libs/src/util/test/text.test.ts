import { expect, test } from "bun:test";
import { capitalise } from "../text";

test("capitalise hello", async () => {
    expect(capitalise("hello")).toBe("Hello");
})

test("capitalise empty string", async () => {
    expect(capitalise("")).toBe("");
})