// This file contains real API integration examples to replace the mock data

import axios from "axios"

// Types for API responses
interface GeocodingResult {
  lat: number
  lng: number
  formatted_address?: string
}

interface StoreResult {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  distance: number
  hasInventoryAPI: boolean
}

interface ProductResult {
  available: boolean
  price?: number
  store_id: string
}

// 1. Geocoding API - Convert address to coordinates
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  try {
    // Make the API request with proper error handling
    const response = await axios.get(`/api/geocode?address=${encodeURIComponent(address)}`)

    // Check for API-specific error responses
    if (response.data.status !== "OK") {
      console.warn(`Geocoding API returned status: ${response.data.status}. Using fallback coordinates.`)
      return { lat: 37.7749, lng: -122.4194 }
    }

    if (!response.data.results || response.data.results.length === 0) {
      console.warn("Geocoding API returned no results. Using fallback coordinates.")
      return { lat: 37.7749, lng: -122.4194 }
    }

    const location = response.data.results[0].geometry.location
    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: response.data.results[0].formatted_address,
    }
  } catch (error) {
    // Log detailed error information
    if (axios.isAxiosError(error)) {
      console.error("Geocoding API request failed:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      })
    } else {
      console.error("Geocoding error:", error)
    }

    // Always return fallback coordinates instead of throwing
    return { lat: 37.7749, lng: -122.4194 } // San Francisco as fallback
  }
}

// 2. Store Finder API - Find nearby grocery stores
export async function findNearbyStores(lat: number, lng: number, radius = 50000): Promise<StoreResult[]> {
  try {
    // Use our server-side API route instead of calling Google directly
    const response = await axios.get(`/api/stores`, {
      params: { lat, lng, radius },
    })

    if (!response.data || !response.data.stores) {
      console.warn("Store API returned invalid data. Using mock store data.")
      throw new Error("Invalid API response")
    }

    return response.data.stores
      .map((place) => {
        // Calculate distance (you might want to use the distance matrix API for more accuracy)
        const storeLat = place.geometry?.location?.lat || place.lat
        const storeLng = place.geometry?.location?.lng || place.lng
        const distance = calculateDistance(lat, lng, storeLat, storeLng)

        return {
          id: place.place_id || place.id,
          name: place.name,
          address: place.vicinity || place.address,
          lat: storeLat,
          lng: storeLng,
          distance: distance,
          // This would depend on which stores you have inventory API access to
          hasInventoryAPI: ["walmart", "kroger", "target"].some((name) => place.name.toLowerCase().includes(name)),
        }
      })
      .filter((store) => store.distance <= radius / 1609.34) // Convert meters to miles
      .sort((a, b) => a.distance - b.distance)
  } catch (error) {
    // Log detailed error information
    if (axios.isAxiosError(error)) {
      console.error("Store finder API request failed:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      })
    } else {
      console.error("Store finder error:", error)
    }

    // Return empty array to trigger fallback to mock data
    return []
  }
}

// 3. Product/Inventory API - Check product availability and pricing
export async function checkProductAvailability(storeId: string, productName: string): Promise<ProductResult> {
  try {
    // Check if Kroger API credentials are available
    const clientId = process.env.KROGER_CLIENT_ID
    const clientSecret = process.env.KROGER_CLIENT_SECRET

    if (!clientId || !clientSecret || clientId === "your_kroger_client_id_here") {
      console.warn("Kroger API credentials are missing or invalid. Using mock inventory data.")
      throw new Error("API credentials missing")
    }

    // Example for Kroger API (you would need OAuth2 authentication)
    if (storeId.includes("kroger")) {
      try {
        const token = await getKrogerToken() // You would implement this

        const response = await axios.get(
          `/api/products?storeId=${storeId}&productName=${encodeURIComponent(productName)}`,
        )

        if (response.data && response.data.product) {
          return response.data.product
        }
      } catch (krogerError) {
        console.error("Kroger API error:", krogerError)
        // Fall through to default response
      }
    }

    // Default response if no API is available for this store
    return {
      available: false,
      store_id: storeId,
    }
  } catch (error) {
    console.error("Product availability check error:", error)
    return {
      available: false,
      store_id: storeId,
    }
  }
}

// Helper function to calculate distance between coordinates
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

// Example of how to get an OAuth token for Kroger API
async function getKrogerToken(): Promise<string> {
  try {
    const clientId = process.env.KROGER_CLIENT_ID
    const clientSecret = process.env.KROGER_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error("Kroger API credentials are missing")
    }

    // Use server-side API route to handle authentication
    const response = await axios.post("/api/kroger/token")

    if (!response.data || !response.data.access_token) {
      throw new Error("Failed to get Kroger token")
    }

    return response.data.access_token
  } catch (error) {
    console.error("Failed to get Kroger token:", error)
    throw error
  }
}
