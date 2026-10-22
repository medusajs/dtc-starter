import { handleMcpRequest } from "@lib/ucp/mcp"

export const POST = (request: Request) => handleMcpRequest(request)

export const GET = () =>
  new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } })
