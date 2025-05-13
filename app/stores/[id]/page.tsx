"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, ArrowLeft, ShoppingBag, Clock, Car, Navigation } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { groceryItems } from "@/lib/grocery-items"
import StoreMap from "@/components/store-map"
import { DirectionsPanel } from "@/components/directions-panel"

// Mock store data - in a real app, this would come from an API
const mockStores = [
  {
    id: "store1",
    name: "Whole Foods Market",
    address: "123 Main St, Anytown, USA",
    lat: 37.7749,
    lng: -122.4194,
    distance: 0.5,
    distanceText: "0.5 miles",
    travelTime: "5 min",
  },
  {
    id: "store2",
    name: "Trader Joe's",
    address: "456 Oak Ave, Anytown, USA",
    lat: 37.7346,
    lng: -122.4872,
    distance: 5.2,
    distanceText: "5.2 miles",
    travelTime: "15 min",
  },
  {
    id: "store3",
    name: "Safeway",
    address: "789 Pine St, Anytown, USA",
    lat: 37.8031,
    lng: -122.3761,
    distance: 4.1,
    distanceText: "4.1 miles",
    travelTime: "12 min",
  },
  {
    id: "store4",
    name: "Target",
    address: "101 Market St, Anytown, USA",
    lat: 37.6965,
    lng: -122.4894,
    distance: 8.3,
    distanceText: "8.3 miles",
    travelTime: "20 min",
  },
  {
    id: "store5",
    name: "Costco Wholesale",
    address: "202 Mission St, Anytown, USA",
    lat: 37.8781,
    lng: -122.3212,
    distance: 12.7,
    distanceText: "12.7 miles",
    travelTime: "25 min",
  },
  {
    id: "store6",
    name: "Walmart Supercenter",
    address: "303 Broadway, Anytown, USA",
    lat: 37.579,
    lng: -122.32,
    distance: 15.4,
    distanceText: "15.4 miles",
    travelTime: "30 min",
  },
  {
    id: "store7",
    name: "Kroger",
    address: "404 Valencia St, Anytown, USA",
    lat: 37.972,
    lng: -122.518,
    distance: 20.1,
    distanceText: "20.1 miles",
    travelTime: "35 min",
  },
]

// Generate mock inventory with prices
function generateMockInventory(storeId: string) {
  const inventory = []

  // Get a subset of grocery items (30-50 items)
  const itemCount = Math.floor(Math.random() * 20) + 30
  const shuffledItems = [...groceryItems].sort(() => 0.5 - Math.random()).slice(0, itemCount)

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

  const storeMultiplier = storeMultipliers[storeId] || 1.0

  // For each grocery item
  shuffledItems.forEach((item) => {
    // 90% chance of item being available
    const isAvailable = Math.random() < 0.9

    if (isAvailable) {
      // Generate a random base price between $0.99 and $15.99
      const basePrice = (Math.floor(Math.random() * 1500) + 99) / 100

      // Apply the store's general pricing strategy
      let adjustedPrice = basePrice * storeMultiplier

      // Add some random variation (±5%) to make prices look more realistic
      const randomVariation = 0.95 + Math.random() * 0.1 // 0.95 to 1.05
      adjustedPrice *= randomVariation

      // Round to nearest cent
      const price = Math.round(adjustedPrice * 100) / 100

      // Add to inventory
      inventory.push({
        id: item.value,
        name: item.label,
        category: item.category,
        unit: item.unit || "",
        price: price,
        onSale: Math.random() < 0.3, // 30% chance of being on sale
        salePrice: Math.round(price * 0.85 * 100) / 100, // 15% off
      })
    }
  })

  // Sort by category then name
  inventory.sort((a, b) => {
    if (a.category === b.category) {
      return a.name.localeCompare(b.name)
    }
    return a.category.localeCompare(b.category)
  })

  return inventory
}

export default function StorePage() {
  const params = useParams()
  const storeId = params.id as string
  const [store, setStore] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showDirections, setShowDirections] = useState(false)
  const [directionsInfo, setDirectionsInfo] = useState<{
    routes: any[]
    totalDistance: string
    totalDuration: string
  } | null>(null)
  const [travelMode, setTravelMode] = useState<string>("DRIVING")

  useEffect(() => {
    const fetchStoreData = () => {
      setIsLoading(true)

      try {
        // Find store in mock data
        const foundStore = mockStores.find((s) => s.id === storeId)

        if (!foundStore) {
          toast({
            title: "Error",
            description: "Store not found",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setStore(foundStore)

        // Generate mock inventory for this store
        const storeInventory = generateMockInventory(storeId)
        setInventory(storeInventory)
      } catch (error) {
        console.error("Error fetching store data:", error)
        toast({
          title: "Error",
          description: "Failed to load store information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStoreData()
  }, [storeId, router, toast])

  // Get user's current location
  useEffect(() => {
    // Check if we already have the user location from localStorage
    const storedLocation = localStorage.getItem("userLocation")
    if (storedLocation) {
      try {
        const parsedLocation = JSON.parse(storedLocation)
        setUserLocation(parsedLocation)
      } catch (error) {
        console.error("Error parsing stored location:", error)
      }
    }

    // Listen for location updates
    const handleLocationUpdate = (event: any) => {
      if (event.detail.coordinates) {
        setUserLocation(event.detail.coordinates)
        // Store in localStorage for future use
        localStorage.setItem("userLocation", JSON.stringify(event.detail.coordinates))
      }
    }

    window.addEventListener("userLocationUpdated", handleLocationUpdate)
    window.addEventListener("locationUpdated", handleLocationUpdate)

    // Try to get current location if we don't have it
    if (!storedLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(location)
          localStorage.setItem("userLocation", JSON.stringify(location))
        },
        (error) => {
          console.error("Error getting user location:", error)
        },
      )
    }

    return () => {
      window.removeEventListener("userLocationUpdated", handleLocationUpdate)
      window.removeEventListener("locationUpdated", handleLocationUpdate)
    }
  }, [])

  const addToShoppingList = (item: any) => {
    try {
      // Get existing items from localStorage first (this is the source of truth for the shopping list)
      let items = []
      const storedItems = localStorage.getItem("groceryItems")
      if (storedItems) {
        try {
          items = JSON.parse(storedItems)
        } catch (e) {
          console.error("Failed to parse items from localStorage:", e)
          items = [] // Reset if parsing fails
        }
      }

      // Check if item already exists in the list
      const existingItemIndex = items.findIndex(
        (listItem: any) => listItem.name.toLowerCase() === item.name.toLowerCase(),
      )

      if (existingItemIndex >= 0) {
        // If item exists, increment quantity
        items[existingItemIndex].quantity += 1
        toast({
          title: "Item Updated",
          description: `Increased ${item.name} quantity in your shopping list`,
        })
      } else {
        // Add new item to list with quantity 1
        items.push({
          id: Date.now().toString(),
          name: item.name,
          quantity: 1,
          price: item.onSale ? item.salePrice : item.price,
        })
        toast({
          title: "Item Added",
          description: `${item.name} added to your shopping list`,
        })
      }

      // Save updated list to localStorage for persistence
      localStorage.setItem("groceryItems", JSON.stringify(items))

      // Get the current location from URL params or use a default
      const searchParams = new URLSearchParams(window.location.search)
      const location = searchParams.get("location") || ""

      // Update URL params to include the updated shopping list
      searchParams.set("items", JSON.stringify(items))
      window.history.replaceState({}, "", `${window.location.pathname}?${searchParams.toString()}`)

      // Trigger a custom event to notify other components that the shopping list has been updated
      const event = new CustomEvent("shoppingListUpdated", {
        detail: { items, location },
      })
      window.dispatchEvent(event)

      console.log("Shopping list updated:", items) // Debug log
    } catch (error) {
      console.error("Error adding item to shopping list:", error)
      toast({
        title: "Error",
        description: "Failed to add item to shopping list",
        variant: "destructive",
      })
    }
  }

  const handleGetDirections = async () => {
    if (!userLocation || !store) {
      toast({
        title: "Error",
        description: "Your location is needed to get directions. Please enable location services.",
        variant: "destructive",
      })
      return
    }

    setShowDirections(true)

    try {
      // Import the directions function dynamically to avoid issues with window.google
      const { getDirectionsToStore } = await import("@/lib/directions")

      const result = await getDirectionsToStore(
        userLocation,
        { lat: store.lat, lng: store.lng },
        window.google.maps.TravelMode[travelMode],
      )

      if (result) {
        setDirectionsInfo({
          routes: result.routes,
          totalDistance: result.totalDistance,
          totalDuration: result.totalDuration,
        })
      }
    } catch (error) {
      console.error("Error getting directions:", error)
      toast({
        title: "Error",
        description: "Failed to get directions. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleChangeTravelMode = (mode: string) => {
    setTravelMode(mode)
    if (showDirections) {
      handleGetDirections()
    }
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Header />
        <div className="p-4 border rounded-lg animate-pulse bg-muted/50">Loading store information...</div>
      </main>
    )
  }

  if (!store) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Header />
        <div className="p-6 border rounded-lg text-center text-muted-foreground">
          Store not found. Please try another store.
        </div>
      </main>
    )
  }

  // Group inventory by category
  const inventoryByCategory: Record<string, any[]> = {}
  inventory.forEach((item) => {
    if (!inventoryByCategory[item.category]) {
      inventoryByCategory[item.category] = []
    }
    inventoryByCategory[item.category].push(item)
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <Header />

      <div className="mb-2">
        <Button variant="ghost" onClick={() => router.back()} className="pl-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{store.name}</h1>
            <div className="flex items-center mt-2 text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{store.address}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Car className="h-4 w-4 mr-1" />
                <span>{store.distanceText}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{store.travelTime} drive</span>
              </div>
            </div>
          </div>
          <Button onClick={handleGetDirections} className="flex items-center gap-2" disabled={!userLocation}>
            <Navigation className="h-4 w-4" />
            Get Directions
          </Button>
        </div>
      </div>

      {showDirections && (
        <div className="mb-6">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle>Directions to {store.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-[400px]">
                  <StoreMap
                    stores={[
                      {
                        id: store.id,
                        name: store.name,
                        address: store.address,
                        lat: store.lat,
                        lng: store.lng,
                        distance: store.distanceText,
                        distanceValue: store.distance,
                      },
                    ]}
                    userLocation={userLocation || undefined}
                    className="h-full"
                    showDirections={true}
                    directionsMode="single"
                    selectedStoreIds={[store.id]}
                    onDirectionsClose={() => setShowDirections(false)}
                  />
                </div>
                {directionsInfo && (
                  <div className="h-[400px] overflow-auto">
                    <DirectionsPanel
                      routes={directionsInfo.routes}
                      totalDistance={directionsInfo.totalDistance}
                      totalDuration={directionsInfo.totalDuration}
                      onChangeTravelMode={handleChangeTravelMode}
                      onClose={() => setShowDirections(false)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(inventoryByCategory).map(([category, items]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {items.map((item) => (
                  <li key={item.id} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {(() => {
                        // Try to get unit from item first
                        let unit = item.unit
                        // If no unit, try to find it in the grocery database
                        if (!unit) {
                          const dbItem = groceryItems.find(
                            (dbItem) => dbItem.value === item.id || dbItem.label === item.name,
                          )
                          unit = dbItem?.unit || ""
                        }

                        return unit ? <span className="ml-2 text-xs text-muted-foreground">({unit})</span> : null
                      })()}
                      {item.onSale && (
                        <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Sale</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {item.onSale ? (
                          <>
                            <div className="text-green-600 font-medium">${item.salePrice.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground line-through">${item.price.toFixed(2)}</div>
                          </>
                        ) : (
                          <div>${item.price.toFixed(2)}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          addToShoppingList(item)
                          // Visual feedback that the button was clicked
                          const btn = document.activeElement as HTMLButtonElement
                          if (btn) {
                            const originalText = btn.innerHTML
                            btn.innerHTML = '<span class="animate-pulse">Added!</span>'
                            setTimeout(() => {
                              btn.innerHTML = originalText
                            }, 1000)
                          }
                        }}
                        className="bg-primary/10 hover:bg-primary/20"
                      >
                        <ShoppingBag className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Add to List</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
