import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(
    { cache: "no-store" },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
