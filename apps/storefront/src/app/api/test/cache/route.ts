import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { cache: "public, max-age=31536000" },
    {
      headers: {
        "Cache-Control": "public, max-age=31536000",
      },
    }
  )
}
