import "server-only"
import {
  cancelCart,
  cancelCheckout,
  completeCheckout,
  createCart,
  createCheckout,
  getCart,
  getCheckout,
  lookupCatalog,
  searchCatalog,
  updateCart,
  updateCheckout,
} from "./operations"
import { STORE_NAME } from "@lib/util/site"
import { UcpResult } from "./ucp"

const SUPPORTED_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26"]

type Args = Record<string, unknown>
type JsonRpcId = string | number | null

const object = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
})

const meta = object({
  "ucp-agent": object({ profile: { type: "string" } }),
  "idempotency-key": { type: "string" },
})
const id = { type: "string", description: "Cart or checkout session ID" }
const context = object({
  address_country: { type: "string", description: "ISO 3166-1 alpha-2 country code" },
})
const lineItems = {
  type: "array",
  items: object(
    {
      item: object({ id: { type: "string", description: "Variant ID" } }, ["id"]),
      quantity: { type: "integer", minimum: 1, maximum: 100 },
    },
    ["item", "quantity"]
  ),
}
const checkoutInput = object({
  cart_id: { type: "string" },
  line_items: lineItems,
  buyer: object({
    email: { type: "string" },
    first_name: { type: "string" },
    last_name: { type: "string" },
  }),
  fulfillment: object({
    methods: {
      type: "array",
      items: object({
        type: { type: "string", enum: ["shipping"] },
        destinations: {
          type: "array",
          items: object({
            first_name: { type: "string" },
            last_name: { type: "string" },
            street_address: { type: "string" },
            extended_address: { type: "string" },
            address_locality: { type: "string" },
            address_region: { type: "string" },
            postal_code: { type: "string" },
            address_country: { type: "string" },
          }),
        },
      }),
    },
  }),
  context,
})

const idempotencyKey = (args: Args) => {
  const key = (args.meta as Args | undefined)?.["idempotency-key"]
  return typeof key === "string" ? key : null
}
const nested = (args: Args, key: string) => (args[key] ?? {}) as Args
const idArg = (args: Args) => (typeof args.id === "string" ? args.id : "")

type Tool = {
  description: string
  inputSchema: Record<string, unknown>
  run: (request: Request, args: Args) => Promise<UcpResult>
}

const TOOLS: Record<string, Tool> = {
  search_catalog: {
    description: "Search the store's products by keyword. Returns products with variants, prices in minor units and availability.",
    inputSchema: object({
      meta,
      catalog: object({
        query: { type: "string" },
        pagination: object({ limit: { type: "integer" }, cursor: { type: "string" } }),
        context,
      }),
    }),
    run: (request, args) => searchCatalog(request, nested(args, "catalog")),
  },
  lookup_catalog: {
    description: "Look up products by product ID, variant ID or product handle.",
    inputSchema: object(
      { meta, catalog: object({ ids: { type: "array", items: { type: "string" } }, context }, ["ids"]) },
      ["catalog"]
    ),
    run: (request, args) => lookupCatalog(request, nested(args, "catalog")),
  },
  get_product: {
    description: "Get one product by product ID, variant ID or handle.",
    inputSchema: object({ meta, catalog: object({ id: { type: "string" }, context }, ["id"]) }, ["catalog"]),
    run: (request, args) => {
      const catalog = nested(args, "catalog")
      return lookupCatalog(request, { ...catalog, ids: [catalog.id] })
    },
  },
  create_cart: {
    description: "Create a cart with line items (variant IDs and quantities).",
    inputSchema: object({ meta, cart: object({ line_items: lineItems, context }, ["line_items"]) }, ["cart"]),
    run: (request, args) => createCart(request, nested(args, "cart"), idempotencyKey(args)),
  },
  get_cart: {
    description: "Get a cart by ID.",
    inputSchema: object({ meta, id }, ["id"]),
    run: (request, args) => getCart(request, idArg(args)),
  },
  update_cart: {
    description: "Replace a cart's line items.",
    inputSchema: object({ meta, id, cart: object({ line_items: lineItems }, ["line_items"]) }, ["id", "cart"]),
    run: (request, args) => updateCart(request, idArg(args), nested(args, "cart")),
  },
  cancel_cart: {
    description: "Cancel a cart.",
    inputSchema: object({ meta, id }, ["id"]),
    run: (request, args) => cancelCart(request, idArg(args)),
  },
  create_checkout: {
    description:
      "Start a checkout from line items or an existing cart_id, with buyer email and shipping address. Payment is completed by the buyer at the returned continue_url.",
    inputSchema: object({ meta, checkout: checkoutInput }, ["checkout"]),
    run: (request, args) => createCheckout(request, nested(args, "checkout"), idempotencyKey(args)),
  },
  get_checkout: {
    description: "Get a checkout session by ID, including the order once the buyer has paid.",
    inputSchema: object({ meta, id }, ["id"]),
    run: (request, args) => getCheckout(request, idArg(args)),
  },
  update_checkout: {
    description: "Update a checkout session's line items, buyer or shipping address.",
    inputSchema: object({ meta, id, checkout: checkoutInput }, ["id", "checkout"]),
    run: (request, args) => updateCheckout(request, idArg(args), nested(args, "checkout")),
  },
  complete_checkout: {
    description:
      "Request completion. This store requires the buyer to pay at continue_url, so open sessions return requires_escalation.",
    inputSchema: object({ meta, id, checkout: { type: "object" } }, ["id"]),
    run: (request, args) => completeCheckout(request, idArg(args)),
  },
  cancel_checkout: {
    description: "Cancel a checkout session.",
    inputSchema: object({ meta, id }, ["id"]),
    run: (request, args) => cancelCheckout(request, idArg(args)),
  },
}

const rpcResult = (id: JsonRpcId, result: unknown) =>
  Response.json({ jsonrpc: "2.0", id, result }, { headers: { "Cache-Control": "no-store" } })

const rpcError = (id: JsonRpcId, code: number, message: string, status = 200) =>
  Response.json(
    { jsonrpc: "2.0", id, error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } }
  )

/** Handles a stateless MCP Streamable HTTP POST with JSON (not SSE) responses. */
export const handleMcpRequest = async (request: Request): Promise<Response> => {
  let message: Record<string, unknown>
  try {
    message = await request.json()
  } catch {
    return rpcError(null, -32700, "Parse error", 400)
  }
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return rpcError(null, -32600, "Invalid request: send a single JSON-RPC message", 400)
  }

  const rpcId = (message.id ?? null) as JsonRpcId
  if (message.id === undefined) {
    return new Response(null, { status: 202 })
  }

  const params = (message.params ?? {}) as Args

  switch (message.method) {
    case "initialize": {
      const requested = params.protocolVersion
      return rpcResult(rpcId, {
        protocolVersion:
          typeof requested === "string" && SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
            ? requested
            : SUPPORTED_PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: `${STORE_NAME} UCP`, version: "1.0.0" },
        instructions:
          "Universal Commerce Protocol shopping tools. Prices are in minor currency units. Checkout hands payment off to the buyer via continue_url.",
      })
    }
    case "ping":
      return rpcResult(rpcId, {})
    case "tools/list":
      return rpcResult(rpcId, {
        tools: Object.entries(TOOLS).map(([name, { description, inputSchema }]) => ({
          name,
          description,
          inputSchema,
        })),
      })
    case "tools/call": {
      const tool = typeof params.name === "string" ? TOOLS[params.name] : undefined
      if (!tool) return rpcError(rpcId, -32602, `Unknown tool: ${String(params.name)}`)

      const { status, body } = await tool.run(request, (params.arguments ?? {}) as Args)
      return rpcResult(rpcId, {
        content: [{ type: "text", text: JSON.stringify(body) }],
        structuredContent: body,
        isError: status >= 400,
      })
    }
    default:
      return rpcError(rpcId, -32601, `Method not found: ${String(message.method)}`)
  }
}
