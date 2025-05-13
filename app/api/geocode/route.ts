import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get the address from the URL params
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "Address parameter is required" }, { status: 400 })
    }

    // Get the API key from server environment
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Google Maps API key is not configured" }, { status: 500 })
    }

    // Make the API request
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
    )

    const data = await response.json()

    // Return the geocoding result
    return NextResponse.json(data)
  } catch (error) {
    console.error("Geocoding API error:", error)
    return NextResponse.json({ error: "Failed to geocode address" }, { status: 500 })
  }
}
