import assert from "node:assert/strict";
import { mock } from "node:test";
import mongoose from "mongoose";
import { AppError } from "../src/errors/AppError";

/** Random valid ObjectId string. */
export const oid = (): string => new mongoose.Types.ObjectId().toString();

/** Fake mongoose Query: chainable and awaitable, resolving to `result`. */
export function query<T>(result: T) {
  const q: any = {
    populate: () => q,
    sort: () => q,
    select: () => q,
    lean: () => q,
    session: () => q,
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return q;
}

/** Plain object that behaves like a hydrated mongoose document (has save()). */
export function doc<T extends Record<string, any>>(fields: T): T & { save: any } {
  const d: any = { ...fields };
  d.save = mock.fn(async () => d);
  return d;
}

/** Asserts a promise rejects with an AppError of the given status (and code). */
export async function expectAppError(promise: Promise<unknown>, status: number, code?: string): Promise<void> {
  await assert.rejects(promise, (err: any) => {
    assert.ok(err instanceof AppError, `expected AppError, got: ${err}`);
    assert.equal(err.statusCode, status, `status was ${err.statusCode}: ${err.message}`);
    if (code) assert.equal(err.code, code);
    return true;
  });
}
