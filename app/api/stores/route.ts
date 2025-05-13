import { NextResponse } from "next/server"

// Mock data for stores
const mockStores = [
  {
    id: "store1",
    name: "Whole Foods Market",
    address: "123 Main St, Anytown, USA",
    lat: 37.7749,
    lng: -122.4194,
  },
  {
    id: "store2",
    name: "Trader Joe's",
    address: "456 Oak Ave, Anytown, USA",
    lat: 37.7746,
    lng: -122.4172,
  },
  {
    id: "store3",
    name: "Safeway",
    address: "789 Pine St, Anytown, USA",
    lat: 37.7731,
    lng: -122.4161,
  },
  {
    id: "store4",
    name: "Target",
    address: "101 Market St, Anytown, USA",
    lat: 37.7765,
    lng: -122.4196,
  },
  {
    id: "store5",
    name: "Costco Wholesale",
    address: "202 Mission St, Anytown, USA",
    lat: 37.7781,
    lng: -122.4212,
  },
  {
    id: "store6",
    name: "Walmart Supercenter",
    address: "303 Broadway, Anytown, USA",
    lat: 37.779,
    lng: -122.42,
  },
  {
    id: "store7",
    name: "Kroger",
    address: "404 Valencia St, Anytown, USA",
    lat: 37.772,
    lng: -122.418,
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = Number.parseFloat(searchParams.get("lat") || "0")
  const lng = Number.parseFloat(searchParams.get("lng") || "0")
  const radius = Number.parseFloat(searchParams.get("radius") || "50000") // Default 50km

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
  }

  // Calculate distances and filter by radius
  const stores = mockStores
    .map((store) => {
      const distance = calculateDistance(lat, lng, store.lat, store.lng)
      return {
        ...store,
        distance,
      }
    })
    .filter((store) => store.distance <= radius / 1609.34) // Convert meters to miles
    .sort((a, b) => a.distance - b.distance)

  return NextResponse.json({ stores })
}

// Helper function to calculate distance
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Haversine formula for more accurate distance calculation
  const R = 3958.8 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}
