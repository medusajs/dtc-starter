const assert = require("node:assert/strict")
const { test } = require("node:test")
const { readFileSync } = require("node:fs")
const { resolve } = require("node:path")
const { runInNewContext } = require("node:vm")
const ts = require("typescript")

function load(file, imports = {}) {
  const exports = {}
  const { outputText } = ts.transpileModule(
    readFileSync(resolve(__dirname, "../src", file), "utf8"),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }
  )
  runInNewContext(outputText, {
    exports,
    require: (name) => imports[name] ?? {},
    Buffer,
    Date,
    process: { env: { NODE_ENV: "test" } },
  })
  return exports
}

const expiry = load("lib/util/token-expiry.ts")
const token = (payload) =>
  `header.${Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  )}.signature`

test("auth cookie never outlives JWT or extends the existing seven-day limit", async () => {
  const written = []
  const cookies = load("lib/data/cookies.ts", {
    "next/headers": {
      cookies: async () => ({ set: (...args) => written.push(args) }),
    },
    "@lib/util/token-expiry": expiry,
  })
  for (const seconds of [3600, 86400, 30 * 86400, -60]) {
    await cookies.setAuthToken(
      token({ exp: Math.floor(Date.now() / 1000) + seconds })
    )
    const options = written.at(-1)[2]
    assert.ok(options.maxAge >= 0)
    assert.ok(options.maxAge <= Math.min(7 * 86400, Math.max(0, seconds)))
    assert.ok(options.maxAge >= Math.min(7 * 86400, Math.max(0, seconds)) - 1)
    assert.equal(options.httpOnly, true)
    assert.equal(options.sameSite, "lax")
  }
})

test("missing or malformed expiry retains previous bounded cookie lifetime", () => {
  for (const value of ["malformed", token({}), token({ exp: "tomorrow" })]) {
    assert.equal(expiry.tokenExpiry(value), null)
  }
})

test("customer identity is checked without cached authenticated responses", async () => {
  const calls = []
  const { retrieveCustomer } = load("lib/data/customer.ts", {
    "@lib/config": {
      sdk: {
        client: {
          fetch: async (path, init) => {
            calls.push({ path, init })
            if (calls.length === 2)
              throw Object.assign(new Error("Unauthorized"), { status: 401 })
            return { customer: { id: "cus_test" } }
          },
        },
      },
    },
    "./cookies": {
      getAuthHeaders: async () => ({ authorization: "Bearer test" }),
      getCacheOptions: async () => ({ tags: ["customers-test"] }),
    },
  })
  assert.equal((await retrieveCustomer()).id, "cus_test")
  assert.equal(await retrieveCustomer(), null)
  assert.equal(calls.length, 2)
  assert.equal(calls[0].path, "/store/customers/me")
  assert.equal(calls[0].init.cache, "no-store")
  assert.equal(calls[0].init.next, undefined)
})

test("guest identity does not query a protected customer endpoint", async () => {
  let calls = 0
  const { retrieveCustomer } = load("lib/data/customer.ts", {
    "@lib/config": {
      sdk: {
        client: {
          fetch: async () => {
            calls++
            throw new Error("Unexpected request")
          },
        },
      },
    },
    "./cookies": {
      getAuthHeaders: async () => ({}),
      getCacheOptions: async () => ({}),
    },
  })
  assert.equal(await retrieveCustomer(), null)
  assert.equal(calls, 0)
})
