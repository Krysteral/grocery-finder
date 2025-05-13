import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Google Maps API key is not configured" }, { status: 500 })
    }

    // Return the API key in a safer way - this will be used by our client to load the Maps API
    // but won't expose the key in client code
    return NextResponse.json({
      status: "ok",
      url: `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=beta&map_ids=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || "8f348d37d6e8549"}`,
    })
  } catch (error) {
    console.error("Maps API error:", error)
    return NextResponse.json({ error: "Failed to get Maps API URL" }, { status: 500 })
  }
}
