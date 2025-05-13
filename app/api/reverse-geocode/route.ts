import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get coordinates from the URL params
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")

    if (!lat || !lng) {
      return NextResponse.json({ error: "Latitude and longitude parameters are required" }, { status: 400 })
    }

    // Get the API key from server environment
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Google Maps API key is not configured" }, { status: 500 })
    }

    // Make the API request
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`)

    const data = await response.json()

    // Return the geocoding result
    return NextResponse.json(data)
  } catch (error) {
    console.error("Reverse geocoding API error:", error)
    return NextResponse.json({ error: "Failed to reverse geocode coordinates" }, { status: 500 })
  }
}
