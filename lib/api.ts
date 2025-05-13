// Updated API file that uses only mock data
import { getCoordinatesForLocation } from "./location-coordinates"

// Mock data for stores with only street names
const mockStores = [
  {
    id: "store1",
    name: "Whole Foods Market",
    address: "123 Main St",
    lat: 37.7749,
    lng: -122.4194,
  },
  {
    id: "store2",
    name: "Trader Joe's",
    address: "456 Oak Ave",
    lat: 37.7346,
    lng: -122.4872,
  },
  {
    id: "store3",
    name: "Safeway",
    address: "789 Pine St",
    lat: 37.8031,
    lng: -122.3761,
  },
  {
    id: "store4",
    name: "Target",
    address: "101 Market St",
    lat: 37.6965,
    lng: -122.4894,
  },
  {
    id: "store5",
    name: "Costco Wholesale",
    address: "202 Mission St",
    lat: 37.8781,
    lng: -122.3212,
  },
  {
    id: "store6",
    name: "Walmart Supercenter",
    address: "303 Broadway",
    lat: 37.579,
    lng: -122.32,
  },
  {
    id: "store7",
    name: "Kroger",
    address: "404 Valencia St",
    lat: 37.972,
    lng: -122.518,
  },
]

// Import grocery items
import { groceryItems } from "./grocery-items"

// Update the mock inventory generation to use price ranges from grocery-items.ts

// Find and modify the generateMockInventory function to use the new price ranges
function generateMockInventory() {
  const inventory = {}

  // Store price multipliers - each store will have a consistent pricing strategy
  const storeMultipliers = {
    store1: 1.1, // Whole Foods - 10% more expensive (premium store)
    store2: 0.95, // Trader Joe's - 5% cheaper (good value)
    store3: 1.0, // Safeway - average prices
    store4: 0.98, // Target - slightly below average
    store5: 0.9, // Costco - 10% cheaper (bulk discount store)
    store6: 0.92, // Walmart - 8% cheaper (discount store)
    store7: 1.05, // Kroger - 5% more expensive
  }

  // For each store
  mockStores.forEach((store) => {
    inventory[store.id] = {}
    const storeMultiplier = storeMultipliers[store.id] || 1.0

    // For each grocery item
    groceryItems.forEach((item) => {
      // 90% chance of item being available
      const isAvailable = Math.random() < 0.9

      if (isAvailable) {
        // Use the predefined price range
        const minPrice = item.minPrice || 0.99
        const maxPrice = item.maxPrice || minPrice + 3

        // Calculate a base price within the defined range
        // This ensures the price is within the realistic range for this item
        const basePrice = minPrice + Math.random() * (maxPrice - minPrice)

        // Apply the store's general pricing strategy
        let adjustedPrice = basePrice * storeMultiplier

        // Add some random variation (±5%) to make prices look more realistic
        // But make sure we stay within the max $3 difference constraint
        const randomVariation = 0.97 + Math.random() * 0.06 // 0.97 to 1.03 (±3%)
        adjustedPrice *= randomVariation

        // Ensure we stay within the min/max range (esp. important for expensive items)
        adjustedPrice = Math.max(minPrice, Math.min(maxPrice, adjustedPrice))

        // Random tax rate between 5-9%
        const taxRate = 5 + Math.floor(Math.random() * 5)

        // Round to nearest cent
        const finalPrice = Math.round(adjustedPrice * 100) / 100

        inventory[store.id][item.value] = {
          available: true,
          price: finalPrice,
          unit: item.unit || "",
          taxRate: taxRate,
        }
      } else {
        inventory[store.id][item.value] = {
          available: false,
          price: 0,
          unit: item.unit || "",
          taxRate: 0,
        }
      }
    })
  })

  return inventory
}

// Generate the mock inventory once
const mockInventory = generateMockInventory()

// Default city info to use when none is available - using Oxford, MS as default
const DEFAULT_CITY_INFO = {
  city: "Oxford",
  state: "MS",
  zip: "38655",
}

// Parse location string to coordinates
export async function parseLocation(location: string): Promise<{ lat: number; lng: number; cityInfo: any }> {
  try {
    // Check if this is a real-time location
    if (location === "Live Location" || location === "Current Location") {
      // Try to get the last known coordinates from localStorage
      const lastLocationStr = localStorage.getItem("lastKnownLocation")
      if (lastLocationStr) {
        try {
          const lastLocation = JSON.parse(lastLocationStr)
          if (lastLocation.coordinates && lastLocation.coordinates.lat && lastLocation.coordinates.lng) {
            return {
              lat: lastLocation.coordinates.lat,
              lng: lastLocation.coordinates.lng,
              cityInfo: lastLocation.cityInfo || {
                city: lastLocation.address?.city || "Unknown City",
                state: lastLocation.address?.state || "Unknown State",
                zip: "00000",
              },
            }
          }
        } catch (e) {
          console.error("Error parsing last known location:", e)
        }
      }
    }

    // Get city information from our database
    const cityInfo = await getCityInfo(location)

    // If it's already coordinates, parse them directly
    if (location && location.includes(",")) {
      const parts = location.split(",")
      if (parts.length === 2) {
        // Check if it's lat,lng format
        const lat = Number.parseFloat(parts[0].trim())
        const lng = Number.parseFloat(parts[1].trim())
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng, cityInfo }
        }

        // If not lat,lng, it might be city,state format
        const city = parts[0].trim()
        const state = parts[1].trim()

        // Try to geocode the city,state
        try {
          const response = await fetch(`/api/geocode?address=${encodeURIComponent(`${city}, ${state}`)}`)

          const data = await response.json()
          if (data.status === "OK" && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location

            // Extract city and state from the result to ensure accuracy
            let resultCity = city
            let resultState = state

            for (const component of data.results[0].address_components) {
              if (component.types.includes("locality")) {
                resultCity = component.long_name
              }
              if (component.types.includes("administrative_area_level_1")) {
                resultState = component.short_name
              }
            }

            return {
              lat,
              lng,
              cityInfo: {
                city: resultCity,
                state: resultState,
                zip: cityInfo?.zip || "00000",
              },
            }
          }
        } catch (error) {
          console.error("Error geocoding city,state:", error)
        }
      }
    }

    // Check if it's a city in our database
    const cityCoords = getCoordinatesForLocation(location)
    if (cityCoords) {
      return { ...cityCoords, cityInfo }
    }

    // If we have city and state, try to geocode it
    if (cityInfo && cityInfo.city && cityInfo.state) {
      try {
        const response = await fetch(
          `/api/geocode?address=${encodeURIComponent(`${cityInfo.city}, ${cityInfo.state}`)}`,
        )

        const data = await response.json()
        if (data.status === "OK" && data.results.length > 0) {
          const { lat, lng } = data.results[0].geometry.location
          return { lat, lng, cityInfo }
        }
      } catch (error) {
        console.error("Error geocoding city and state:", error)
      }
    }

    // Try to geocode the location directly
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(location)}`)

      const data = await response.json()
      if (data.status === "OK" && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location

        // Extract city and state from the result
        let city = cityInfo?.city || "Unknown City"
        let state = cityInfo?.state || "Unknown State"

        for (const component of data.results[0].address_components) {
          if (component.types.includes("locality")) {
            city = component.long_name
          }
          if (component.types.includes("administrative_area_level_1")) {
            state = component.short_name
          }
        }

        return {
          lat,
          lng,
          cityInfo: {
            city,
            state,
            zip: cityInfo?.zip || "00000",
          },
        }
      }
    } catch (error) {
      console.error("Error geocoding location:", error)
    }

    // Don't fall back to a default location, throw an error instead
    throw new Error("Location not found")
  } catch (error) {
    console.error("Error parsing location:", error)
    throw error // Re-throw the error instead of returning a default
  }
}

// Get city information including state and zip
async function getCityInfo(location: string): Promise<{ city: string; state: string; zip: string }> {
  // Default to Oxford, MS if no location
  if (!location) {
    return DEFAULT_CITY_INFO
  }

  try {
    // Try to match with our city database in location-coordinates.ts
    const cityData = await import("./location-coordinates").then((module) => {
      return module.getCityInfo ? module.getCityInfo(location) : null
    })

    if (cityData) {
      return cityData
    }

    // Extract city name from location string
    let city = location
    let state = "MS" // Default state to Mississippi

    // If location is in "City, State" format
    if (location.includes(",")) {
      const parts = location.split(",")
      city = parts[0].trim()
      if (parts.length > 1 && parts[1].trim().length === 2) {
        state = parts[1].trim().toUpperCase()
      }
    }

    // Generate a plausible ZIP code for the city
    // Different ranges for different regions
    let zip
    switch (state) {
      case "NY":
        zip = `1${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`
        break
      case "CA":
        zip = `9${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`
        break
      case "TX":
        zip = `7${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`
        break
      case "FL":
        zip = `3${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`
        break
      case "IL":
        zip = `6${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`
        break
      case "MS":
        zip = `38${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`
        break
      default:
        zip = `${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`
    }

    return { city, state, zip }
  } catch (error) {
    console.error("Error getting city info:", error)
    return DEFAULT_CITY_INFO
  }
}

// Generate mock stores for a specific city
function generateMockStoresForCity(cityLat: number, cityLng: number, cityInfo: any): any[] {
  // Create a copy of the mock stores
  const cityStores = JSON.parse(JSON.stringify(mockStores))

  // Extract city information with defaults in case cityInfo is undefined
  const { city = "Oxford", state = "MS", zip = "38655" } = cityInfo || DEFAULT_CITY_INFO

  // Adjust the coordinates to be around the specified city
  cityStores.forEach((store, index) => {
    // Create a random offset (within ~10 miles)
    const latOffset = (Math.random() - 0.5) * 0.15
    const lngOffset = (Math.random() - 0.5) * 0.15

    store.lat = cityLat + latOffset
    store.lng = cityLng + lngOffset

    // Get the street part from the original address
    const streetAddress = store.address

    // Generate a ZIP+4 by adding a random 4-digit extension
    const zipPlus4 = `${zip}-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`

    // Update the address with the city, state, and ZIP
    store.fullAddress = `${streetAddress}, ${city}, ${state} ${zipPlus4}`
  })

  return cityStores
}

// Fetch nearby stores
export async function fetchNearbyStores(
  location: string,
  maxDistance = 100,
  userCoordinates?: { lat: number; lng: number },
) {
  try {
    // Use provided coordinates if available, otherwise parse the location
    const userLocation = userCoordinates
      ? { ...userCoordinates, cityInfo: (await getCityInfo(location)) || DEFAULT_CITY_INFO }
      : await parseLocation(location || "Oxford, MS")

    // Ensure cityInfo exists
    if (!userLocation.cityInfo) {
      userLocation.cityInfo = DEFAULT_CITY_INFO
    }

    // Generate stores around the user's location
    const cityStores = generateMockStoresForCity(userLocation.lat, userLocation.lng, userLocation.cityInfo)

    // Return all mock stores with calculated distances
    return cityStores
      .map((store) => {
        const distance = calculateDistance(userLocation.lat, userLocation.lng, store.lat, store.lng)

        // Use the full address if available, otherwise construct it from components
        const storeAddress =
          store.fullAddress ||
          (userLocation.cityInfo && userLocation.cityInfo.city !== "Live Location"
            ? `${store.address}, ${userLocation.cityInfo.city}, ${userLocation.cityInfo.state}`
            : store.address)

        return {
          id: store.id,
          name: store.name,
          address: storeAddress,
          distance: `${distance.toFixed(1)} miles`,
          hasInventoryAPI: true,
          distanceValue: distance,
          lat: store.lat,
          lng: store.lng,
        }
      })
      .filter((store) => store.distanceValue <= maxDistance)
      .sort((a, b) => a.distanceValue - b.distanceValue)
  } catch (error) {
    console.error("Error fetching stores:", error)
    return []
  }
}

// Search for items in nearby stores
export async function searchItemsInStores(location: string, items: any[], maxDistance = 100) {
  try {
    // Get nearby stores
    const stores = await fetchNearbyStores(location || "Oxford, MS", maxDistance)
    const results = []

    for (const item of items) {
      const itemName = item.name.toLowerCase()
      const storeResults = []

      for (const store of stores) {
        // Get item availability and price from mock inventory
        const inventory = mockInventory[store.id]
        const itemInventory = inventory?.[itemName.toLowerCase()]

        storeResults.push({
          storeId: store.id,
          storeName: store.name,
          available: itemInventory ? itemInventory.available : false,
          price: itemInventory?.available ? itemInventory.price : undefined,
        })
      }

      results.push({
        itemName: item.name,
        quantity: item.quantity,
        stores: storeResults,
      })
    }

    return results
  } catch (error) {
    console.error("Error searching items:", error)
    return []
  }
}

// Find the store with the cheapest total for all items
export async function findCheapestStore(location: string, items: any[], maxDistance = 100) {
  try {
    // Parse the location
    const userLocation = await parseLocation(location || "Oxford, MS")

    // Get nearby stores
    const stores = await fetchNearbyStores(location || "Oxford, MS", maxDistance)

    // Calculate total cost for each store
    const storeResults = stores.map((store) => {
      let totalCost = 0
      const itemDetails = []

      // Check each item's availability and price at this store
      for (const item of items) {
        const itemName = item.name.toLowerCase()
        const inventory = mockInventory[store.id]
        const itemInventory = inventory?.[itemName]

        const available = itemInventory ? itemInventory.available : false
        const price = available ? itemInventory.price : 0
        const quantity = item.quantity
        const subtotal = price * quantity

        if (available) {
          totalCost += subtotal
        }

        itemDetails.push({
          name: item.name,
          quantity,
          price,
          subtotal,
          available,
        })
      }

      // Calculate travel info
      const distanceFromUser = store.distanceValue
      const travelTime = calculateTravelTime(distanceFromUser)
      const gasCost = calculateGasCost(distanceFromUser)

      return {
        storeId: store.id,
        storeName: store.name,
        storeAddress: store.address,
        totalCost,
        items: itemDetails,
        // Check if all items are available at this store
        allItemsAvailable: itemDetails.every((item) => item.available),
        // Add location and travel info
        lat: store.lat,
        lng: store.lng,
        distanceFromUser,
        travelTime,
        gasCost,
      }
    })

    // Filter stores that have all items available
    const storesWithAllItems = storeResults.filter((store) => store.allItemsAvailable)

    if (storesWithAllItems.length === 0) {
      return null // No store has all items
    }

    // Find the store with the lowest total cost
    return storesWithAllItems.sort((a, b) => a.totalCost - b.totalCost)[0]
  } catch (error) {
    console.error("Error finding cheapest store:", error)
    return null
  }
}

// Find the cheapest combination of stores for all items
export async function findCheapestCombination(location: string, items: any[], maxDistance = 100) {
  try {
    // Parse the location
    const userLocation = await parseLocation(location || "Oxford, MS")

    // Get nearby stores
    const stores = await fetchNearbyStores(location || "Oxford, MS", maxDistance)

    // Find the cheapest store for each item
    const itemAssignments = []
    const unavailableItems = []

    for (const item of items) {
      const itemName = item.name.toLowerCase()
      let cheapestStore = null
      let lowestPrice = Number.POSITIVE_INFINITY

      // Find the cheapest store for this item
      for (const store of stores) {
        const inventory = mockInventory[store.id]
        const itemInventory = inventory?.[itemName]

        if (itemInventory && itemInventory.available && itemInventory.price < lowestPrice) {
          lowestPrice = itemInventory.price
          cheapestStore = {
            storeId: store.id,
            storeName: store.name,
            storeAddress: store.address,
            price: itemInventory.price,
            lat: store.lat,
            lng: store.lng,
            distanceFromUser: store.distanceValue,
          }
        }
      }

      if (cheapestStore) {
        itemAssignments.push({
          name: item.name,
          quantity: item.quantity,
          store: cheapestStore,
          price: cheapestStore.price,
          subtotal: cheapestStore.price * item.quantity,
        })
      } else {
        unavailableItems.push({
          name: item.name,
          quantity: item.quantity,
        })
      }
    }

    // Group items by store
    const storeGroups = {}

    for (const assignment of itemAssignments) {
      const { store, name, quantity, price, subtotal } = assignment

      if (!storeGroups[store.storeId]) {
        storeGroups[store.storeId] = {
          storeId: store.storeId,
          storeName: store.storeName,
          storeAddress: store.storeAddress,
          items: [],
          subtotal: 0,
          lat: store.lat,
          lng: store.lng,
          distanceFromUser: store.distanceFromUser,
        }
      }

      storeGroups[store.storeId].items.push({
        name,
        quantity,
        price,
        subtotal,
      })

      storeGroups[store.storeId].subtotal += subtotal
    }

    // Convert to array and sort by distance
    const storeGroupsArray = Object.values(storeGroups)
    storeGroupsArray.sort((a: any, b: any) => a.distanceFromUser - b.distanceFromUser)

    // Calculate total travel distance, time and gas cost
    let totalTravelDistance = 0
    const previousLat = userLocation.lat
    const previousLng = userLocation.lng

    // First, calculate distance from user to first store
    if (storeGroupsArray.length > 0) {
      totalTravelDistance += calculateDistance(
        userLocation.lat,
        userLocation.lng,
        storeGroupsArray[0].lat,
        storeGroupsArray[0].lng,
      )
    }

    // Then calculate distances between stores in order
    for (let i = 0; i < storeGroupsArray.length; i++) {
      const store = storeGroupsArray[i]

      // Add travel info to each store
      store.travelTime = calculateTravelTime(store.distanceFromUser)
      store.gasCost = calculateGasCost(store.distanceFromUser)

      // Calculate distance to next store
      if (i < storeGroupsArray.length - 1) {
        const nextStore = storeGroupsArray[i + 1]
        const distanceBetween = calculateDistance(store.lat, store.lng, nextStore.lat, nextStore.lng)
        totalTravelDistance += distanceBetween
      }
    }

    // Add return trip to user's location
    if (storeGroupsArray.length > 0) {
      const lastStore = storeGroupsArray[storeGroupsArray.length - 1]
      totalTravelDistance += calculateDistance(lastStore.lat, lastStore.lng, userLocation.lat, userLocation.lng)
    }

    // Calculate total travel time and gas cost
    const totalTravelTime = calculateTravelTime(totalTravelDistance)
    const totalGasCost = calculateGasCost(totalTravelDistance)

    // Calculate total cost of items
    const totalItemCost = storeGroupsArray.reduce((sum: number, store: any) => sum + store.subtotal, 0)

    return {
      totalCost: totalItemCost,
      stores: storeGroupsArray,
      unavailableItems,
      travelInfo: {
        totalDistance: totalTravelDistance,
        totalTravelTime,
        totalGasCost,
      },
    }
  } catch (error) {
    console.error("Error finding cheapest combination:", error)
    return {
      totalCost: 0,
      stores: [],
      unavailableItems: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      })),
      travelInfo: {
        totalDistance: 0,
        totalTravelTime: "0 min",
        totalGasCost: 0,
      },
    }
  }
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

// Helper function to calculate travel time based on distance
function calculateTravelTime(distanceInMiles: number): string {
  // Assume average driving speed of 30 mph in city
  const timeInHours = distanceInMiles / 30

  if (timeInHours < 1) {
    // Convert to minutes if less than an hour
    const timeInMinutes = Math.ceil(timeInHours * 60)
    return `${timeInMinutes} min`
  } else {
    // Format as hours and minutes
    const hours = Math.floor(timeInHours)
    const minutes = Math.ceil((timeInHours - hours) * 60)
    return `${hours} hr ${minutes} min`
  }
}

// Helper function to calculate gas cost based on distance
function calculateGasCost(distanceInMiles: number): number {
  // Assume average fuel efficiency of 25 mpg and gas price of $3.50 per gallon
  const gallonsUsed = distanceInMiles / 25
  const gasCost = gallonsUsed * 3.5
  return Math.round(gasCost * 100) / 100 // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Add this at the end of the file
if (typeof window !== "undefined") {
  window.addEventListener("userLocationUpdated", (event: any) => {
    if (event.detail && event.detail.coordinates) {
      // Store the last known location in localStorage
      localStorage.setItem("lastKnownLocation", JSON.stringify(event.detail))
    }
  })
}
