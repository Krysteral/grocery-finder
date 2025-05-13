"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import { MapPin, Store, AlertCircle, MapIcon, List, Car, Navigation, Route } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchNearbyStores, findCheapestStore, findCheapestCombination } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StoreMap from "./store-map"
import { parseLocation } from "@/lib/api"
import { MultiStoreDirections } from "./multi-store-directions"
import { DirectionsPanel } from "./directions-panel"

interface StoreType {
  id: string
  name: string
  address: string
  distance: string
  distanceValue: number
  lat: number
  lng: number
}

interface LocationAddress {
  city: string
  state: string
  formattedAddress: string
  locationString: string
  zip?: string
}

interface RouteInfo {
  legs: any[]
  summary: string
  warnings: string[]
  waypoint_order: number[]
}

export default function StoreResults() {
  const searchParams = useSearchParams()
  const location = searchParams.get("location")
  const [stores, setStores] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(undefined)
  const [locationAccuracy, setLocationAccuracy] = useState<number | undefined>(undefined)
  const [locationAddress, setLocationAddress] = useState<LocationAddress | undefined>(undefined)
  const [activeView, setActiveView] = useState<"list" | "map">("list")
  const [isRealTimeTracking, setIsRealTimeTracking] = useState(false)
  const router = useRouter()
  const [mapRef, setMapRef] = useState<any>(null)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)

  // Add these state variables inside the component
  const [showDirections, setShowDirections] = useState(false)
  const [directionsMode, setDirectionsMode] = useState<"single" | "multi">("single")
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([])
  const [showMultiStoreDirections, setShowMultiStoreDirections] = useState(false)
  // Add these new state variables for cheapest options
  const [cheapestStore, setCheapestStore] = useState<string | null>(null)
  const [cheapestMultiStoreIds, setCheapestMultiStoreIds] = useState<string[]>([])
  const [directionsInfo, setDirectionsInfo] = useState<{
    routes: RouteInfo[]
    totalDistance: string
    totalDuration: string
  } | null>(null)
  const [travelMode, setTravelMode] = useState<string>("DRIVING")

  // For debugging
  useEffect(() => {
    if (userLocation) {
      console.log("User location state updated in StoreResults:", userLocation)
    }
  }, [userLocation])

  // Extract the getStores function from the existing useEffect
  const getStores = useCallback(
    async (locationValue: string, forceRefresh = false) => {
      if (!locationValue) return

      // Don't refresh too frequently unless forced
      const now = Date.now()
      if (!forceRefresh && now - lastUpdateTimeRef.current < 10000) {
        console.log("Skipping store refresh - too soon since last update")
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Only parse the location to get coordinates if we don't already have them
        // and if the location isn't "Current Location" or "Live Location"
        if (
          !userLocation &&
          locationValue !== "Current Location" &&
          locationValue !== "Live Location" &&
          locationValue !== "Getting your location..."
        ) {
          const coordinates = await parseLocation(locationValue)
          setUserLocation(coordinates)
        }

        // If we have coordinates, use them directly to fetch stores
        if (userLocation) {
          const nearbyStores = await fetchNearbyStores(
            locationAddress?.locationString || locationValue,
            100,
            userLocation,
          )

          // If we have location address info, update store addresses
          if (locationAddress) {
            const updatedStores = nearbyStores.map((store) => {
              // Extract the street address part (before the first comma)
              const streetPart = store.address.split(",")[0]

              // Create a new full address with the current city and state
              const updatedAddress = `${streetPart}, ${locationAddress.city}, ${locationAddress.state}`

              return {
                ...store,
                address: updatedAddress,
              }
            })
            setStores(updatedStores)
          } else {
            setStores(nearbyStores)
          }
        } else {
          // Fallback to regular location-based search
          const nearbyStores = await fetchNearbyStores(locationValue, 100)
          setStores(nearbyStores)
        }

        // Update last refresh time
        lastUpdateTimeRef.current = now
      } catch (error) {
        console.error("Failed to fetch stores:", error)
        setError("There was an error fetching nearby stores. Please try again.")
      } finally {
        setLoading(false)
      }
    },
    [userLocation, locationAddress],
  )

  // Add this function to pass to StoreMap
  const handleMapRef = useCallback((ref: any) => {
    setMapRef(ref)
  }, []) // Empty dependency array ensures this function doesn't change on re-renders

  // Update the existing useEffect to use the extracted function
  useEffect(() => {
    if (location && location !== "Getting your location...") {
      getStores(location, true)
    }
  }, [location, getStores])

  // Listen for direct geolocation updates
  const handleUserLocationUpdate = useCallback(
    (event: any) => {
      const { coordinates, accuracy, address, isRealTime } = event.detail

      console.log("Received userLocationUpdated event with coordinates:", coordinates)

      // ALWAYS update user location with the exact coordinates from geolocation
      if (coordinates) {
        setUserLocation(coordinates)
      }

      // Store accuracy if provided
      if (accuracy) {
        setLocationAccuracy(accuracy)
      }

      // Store address information if provided
      if (address) {
        setLocationAddress(address)
      }

      // Set real-time tracking flag
      if (isRealTime) {
        setIsRealTimeTracking(true)
      }

      // Set active view to map when location is updated
      setActiveView("map")

      // Fetch stores using the coordinates
      if (coordinates) {
        // Use the exact coordinates for fetching stores
        getStores(address?.formattedAddress || address?.locationString || "Live Location")
      }
    },
    [getStores],
  )

  useEffect(() => {
    const handleUserLocationUpdateWrapper = (event: any) => {
      handleUserLocationUpdate(event)
    }

    // Listen for the custom geolocation event
    window.addEventListener("userLocationUpdated", handleUserLocationUpdateWrapper)

    // Clean up
    return () => {
      window.removeEventListener("userLocationUpdated", handleUserLocationUpdateWrapper)
    }
  }, [handleUserLocationUpdate])

  const handleLocationUpdate = (event: any) => {
    // When location is updated, fetch stores again
    const newLocation = event.detail.location
    if (newLocation && newLocation !== "Getting your location...") {
      // If coordinates are directly provided in the event, use them
      if (event.detail.coordinates) {
        setUserLocation(event.detail.coordinates)
      }

      // If this is not a real-time update, disable real-time tracking
      if (newLocation !== "Live Location") {
        setIsRealTimeTracking(false)

        // Clear any existing refresh timer
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current)
          refreshTimerRef.current = null
        }
      }

      // If this is a manual entry, update the locationAddress if cityInfo is provided
      if (event.detail.isManualEntry && event.detail.cityInfo) {
        setLocationAddress({
          city: event.detail.cityInfo.city || "",
          state: event.detail.cityInfo.state || "",
          formattedAddress: event.detail.formattedLocation || newLocation,
          locationString: event.detail.formattedLocation || newLocation,
          zip: event.detail.cityInfo.zip || "",
        })
      }

      getStores(newLocation, true)

      // Set active view to map when location is updated
      setActiveView("map")
    }
  }

  // Add this useEffect to listen for force refresh events
  useEffect(() => {
    const handleForceRefresh = (event: any) => {
      if (event.detail && event.detail.location) {
        // Force refresh the stores with the new location
        getStores(event.detail.location, true)
      }
    }

    // Listen for the custom event
    window.addEventListener("forceStoreRefresh", handleForceRefresh)

    // Clean up
    return () => {
      window.removeEventListener("forceStoreRefresh", handleForceRefresh)
    }
  }, [getStores])

  useEffect(() => {
    const handleLocationUpdateWrapper = (event: any) => {
      handleLocationUpdate(event)
    }

    // Listen for the custom event
    window.addEventListener("locationUpdated", handleLocationUpdateWrapper)

    // Clean up
    return () => {
      window.removeEventListener("locationUpdated", handleLocationUpdateWrapper)
    }
  }, [getStores])

  // Set up periodic refresh for real-time tracking
  useEffect(() => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    // If real-time tracking is enabled, set up a timer to refresh stores
    if (isRealTimeTracking && location) {
      console.log("Setting up periodic store refresh for real-time tracking")
      refreshTimerRef.current = setInterval(() => {
        console.log("Refreshing stores due to real-time tracking")
        getStores(location)
      }, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [isRealTimeTracking, location, getStores])

  useEffect(() => {
    const handleSearchReset = () => {
      // Clear stores when search is reset
      setStores([])
      setError(null)
      setUserLocation(undefined)
      setLocationAccuracy(undefined)
      setLocationAddress(undefined)
      setIsRealTimeTracking(false)

      // Clear any existing refresh timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }

    // Listen for the custom event
    window.addEventListener("searchReset", handleSearchReset)

    // Clean up
    return () => {
      window.removeEventListener("searchReset", handleSearchReset)
    }
  }, [])

  // Listen for getDirections events from other components
  useEffect(() => {
    const handleGetDirectionsEvent = (event: any) => {
      if (event.detail && event.detail.storeId) {
        handleGetDirections(event.detail.storeId)
      }
    }

    // Listen for getMultiStoreDirections events
    const handleGetMultiStoreDirectionsEvent = (event: any) => {
      if (event.detail && event.detail.storeIds && event.detail.storeIds.length > 0) {
        console.log("Received multi-store directions event with store IDs:", event.detail.storeIds)
        handleGetMultiStoreDirections(event.detail.storeIds, {
          fromSearchResults: event.detail.fromSearchResults,
          hideMap: event.detail.hideMap,
        })
      }
    }

    // Listen for tab switch events
    const handleSwitchToMapTab = () => {
      setActiveView("map")
    }

    window.addEventListener("getDirections", handleGetDirectionsEvent)
    window.addEventListener("getMultiStoreDirections", handleGetMultiStoreDirectionsEvent)
    window.addEventListener("switchToMapTab", handleSwitchToMapTab)

    // Clean up
    return () => {
      window.removeEventListener("getDirections", handleGetDirectionsEvent)
      window.removeEventListener("getMultiStoreDirections", handleGetMultiStoreDirectionsEvent)
      window.removeEventListener("switchToMapTab", handleSwitchToMapTab)
    }
  }, [])

  const handleViewStore = (storeId: string) => {
    router.push(`/stores/${storeId}`)
  }

  // Add this function to handle getting directions to a single store
  const handleGetDirections = async (storeId: string) => {
    // Set active view to map immediately to show directions
    setActiveView("map")

    // Clear any existing multi-store directions first
    setShowMultiStoreDirections(false)

    // Set these states immediately to trigger UI updates
    setSelectedStoreIds([storeId])
    setDirectionsMode("single")
    setShowDirections(true)

    try {
      // Import the directions function dynamically
      const { getDirectionsToStore } = await import("@/lib/directions")

      // Find the selected store
      const selectedStore = stores.find((store) => store.id === storeId)

      if (selectedStore && userLocation) {
        // Show loading state while fetching directions
        setDirectionsInfo({
          routes: [],
          totalDistance: "Calculating...",
          totalDuration: "Calculating...",
        })

        const result = await getDirectionsToStore(
          userLocation,
          { lat: selectedStore.lat, lng: selectedStore.lng },
          window.google.maps.TravelMode[travelMode],
        )

        if (result) {
          setDirectionsInfo({
            routes: result.routes,
            totalDistance: result.totalDistance,
            totalDuration: result.totalDuration,
          })
        }
      }
    } catch (error) {
      console.error("Error getting directions:", error)
    }
  }

  // Add this function to handle getting directions to multiple stores
  const handleGetMultiStoreDirections = (
    storeIds: string[],
    options?: { fromSearchResults?: boolean; hideMap?: boolean },
  ) => {
    console.log("Getting multi-store directions for store IDs:", storeIds)

    // Set active view to map immediately
    setActiveView("map")

    // Clear any existing directions first
    setShowDirections(false)

    // Set the selected store IDs
    setSelectedStoreIds(storeIds)
    setDirectionsMode("multi")

    // Show the multi-store directions panel
    setShowMultiStoreDirections(true)

    // Make sure we're not showing the single-store directions
    setDirectionsInfo(null)

    // Log the selected stores for debugging
    const selectedStores = stores.filter((store) => storeIds.includes(store.id))
    console.log("Selected stores for multi-store directions:", selectedStores)
  }

  // Add this function to close directions
  const handleCloseDirections = () => {
    setShowDirections(false)
    setShowMultiStoreDirections(false)
    setDirectionsInfo(null)
    setSelectedStoreIds([])
  }

  // Add this function to open the multi-store directions panel
  const handleOpenMultiStoreDirections = () => {
    if (cheapestMultiStoreIds.length > 0) {
      handleGetMultiStoreDirections(cheapestMultiStoreIds)
    } else {
      setShowMultiStoreDirections(true)
    }
  }

  // Add this function after handleCloseDirections
  const findCheapestOptions = useCallback(async () => {
    if (!stores || stores.length === 0) return

    try {
      // Get items from localStorage
      const storedItems = localStorage.getItem("groceryItems")
      let items = []
      if (storedItems) {
        try {
          items = JSON.parse(storedItems)
        } catch (e) {
          console.error("Failed to parse items from localStorage:", e)
        }
      }

      // If there are no items, just use distance as the metric
      if (!items || items.length === 0) {
        // Find the closest/cheapest single store
        const sortedByDistance = [...stores].sort((a, b) => a.distanceValue - b.distanceValue)
        setCheapestStore(sortedByDistance[0].id)

        // For multi-store, we'll take the 2-3 closest stores
        const multiStoreCount = Math.min(3, stores.length)
        const multiStoreIds = sortedByDistance.slice(0, multiStoreCount).map((store) => store.id)
        setCheapestMultiStoreIds(multiStoreIds)
        return
      }

      // If we have items, use the API to find the cheapest store
      if (location) {
        // For single store
        const cheapestStoreResult = await findCheapestStore(location, items)
        if (cheapestStoreResult) {
          setCheapestStore(cheapestStoreResult.storeId)
        } else {
          // Fallback to closest store if no store has all items
          const sortedByDistance = [...stores].sort((a, b) => a.distanceValue - b.distanceValue)
          setCheapestStore(sortedByDistance[0].id)
        }

        // For multi-store
        const cheapestComboResult = await findCheapestCombination(location, items)
        if (cheapestComboResult && cheapestComboResult.stores.length > 0) {
          const storeIds = cheapestComboResult.stores.map((store) => store.storeId)
          setCheapestMultiStoreIds(storeIds)
        } else {
          // Fallback to closest stores if no combination found
          const sortedByDistance = [...stores].sort((a, b) => a.distanceValue - b.distanceValue)
          const multiStoreCount = Math.min(3, stores.length)
          const multiStoreIds = sortedByDistance.slice(0, multiStoreCount).map((store) => store.id)
          setCheapestMultiStoreIds(multiStoreIds)
        }
      }
    } catch (error) {
      console.error("Error finding cheapest options:", error)
      // Fallback to distance-based calculation
      const sortedByDistance = [...stores].sort((a, b) => a.distanceValue - b.distanceValue)
      setCheapestStore(sortedByDistance[0].id)
      const multiStoreCount = Math.min(3, stores.length)
      const multiStoreIds = sortedByDistance.slice(0, multiStoreCount).map((store) => store.id)
      setCheapestMultiStoreIds(multiStoreIds)
    }
  }, [stores, location])

  // Call this function when stores are loaded
  useEffect(() => {
    if (stores.length > 0) {
      findCheapestOptions()
    }
  }, [stores, findCheapestOptions])

  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Add this useEffect to listen for shopping list updates
  useEffect(() => {
    const handleShoppingListUpdated = () => {
      // Recalculate cheapest options when shopping list changes
      findCheapestOptions()
    }

    window.addEventListener("shoppingListUpdated", handleShoppingListUpdated)

    return () => {
      window.removeEventListener("shoppingListUpdated", handleShoppingListUpdated)
    }
  }, [findCheapestOptions])

  const handleChangeTravelMode = (mode: any) => {
    setTravelMode(mode)
    // Re-fetch directions with the new travel mode
    if (directionsMode === "single" && selectedStoreIds.length === 1) {
      handleGetDirections(selectedStoreIds[0])
    } else if (directionsMode === "multi" && selectedStoreIds.length > 0) {
      handleGetMultiStoreDirections(selectedStoreIds)
    }
  }

  if (!location || location === "Getting your location...") {
    return (
      <div className="mt-5 p-6 border rounded-lg text-center text-muted-foreground">
        {location === "Getting your location..." ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p>Getting your location...</p>
          </div>
        ) : (
          "Enter a location to find nearby stores"
        )}
      </div>
    )
  }

  if (loading && stores.length === 0) {
    return <div className="mt-5 p-4 border rounded-lg animate-pulse bg-muted/50">Loading stores...</div>
  }

  if (error && stores.length === 0) {
    return (
      <div className="mt-5">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className="mt-5 p-6 border rounded-lg text-center text-muted-foreground">
        No stores found near this location
      </div>
    )
  }

  const handleShowMultiStoreDirections = () => {
    setActiveView("map")
    setShowMultiStoreDirections(true)
  }

  return (
    <div className="mt-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Found {stores.length} stores within 100 miles</h3>
        <div className="flex items-center gap-2">
          {isRealTimeTracking && (
            <div className="mr-3 text-xs flex items-center text-green-600">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1"></div>
              <span>Live</span>
            </div>
          )}
          {locationAddress && (
            <div className="text-sm text-muted-foreground flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {locationAddress.city}, {locationAddress.state}
            </div>
          )}
        </div>
      </div>

      {loading && stores.length > 0 && (
        <div className="mb-2 flex items-center text-xs text-muted-foreground">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
          <span>Updating stores...</span>
        </div>
      )}

      <Tabs
        value={activeView}
        onValueChange={(value) => {
          setActiveView(value as "list" | "map")
          if (value === "list") {
            setShowDirections(false)
            setShowMultiStoreDirections(false)
          }
        }}
      >
        <div className="flex justify-end mb-4">
          <TabsList className="grid w-[180px] grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-1">
              <List className="h-4 w-4" />
              <span>List</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-1">
              <MapIcon className="h-4 w-4" />
              <span>Map</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Nearby Stores</CardTitle>
              <CardDescription>Click on a store to view details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <tbody>
                    {stores.map((store) => (
                      <tr
                        key={store.id}
                        className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleViewStore(store.id)}
                      >
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{store.name}</span>
                            {/* Update the address display code to include zip codes */}
                            <span className="text-xs text-muted-foreground flex items-center">
                              <MapPin className="h-3 w-3 mr-1 inline" />
                              {store.address.includes(locationAddress?.city)
                                ? store.address
                                : locationAddress?.city && locationAddress?.state
                                  ? `${store.address.split(",")[0]}, ${locationAddress.city}, ${locationAddress.state} ${locationAddress?.zip || ""}`
                                  : store.address}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-medium">{store.distance}</span>
                            <span className="text-xs text-muted-foreground flex items-center justify-end">
                              <Car className="h-3 w-3 mr-1 inline" />
                              {calculateTravelTime(store.distanceValue)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 w-10 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Store className="h-4 w-4" />
                            <span className="sr-only">View Store</span>
                          </Button>
                        </td>
                        <td className="p-3 w-10 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGetDirections(store.id)
                            }}
                            className="ml-2"
                          >
                            <Navigation className="h-4 w-4" />
                            <span className="sr-only">Get Directions</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add the new buttons here */}
              <div className="p-4 border-t">
                <div className="mb-2 text-sm font-medium">
                  {cheapestStore
                    ? "Get directions to the cheapest store for your items:"
                    : "Get directions to nearby stores:"}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {cheapestStore && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleGetDirections(cheapestStore)
                      }}
                      className="flex items-center"
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Single Store Directions
                    </Button>
                  )}
                  {cheapestMultiStoreIds.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleGetMultiStoreDirections(cheapestMultiStoreIds)
                      }}
                      className="flex items-center"
                    >
                      <Route className="h-4 w-4 mr-1" />
                      Multi-Store Route
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="mt-0 relative">
          <StoreMap
            stores={stores}
            userLocation={userLocation}
            locationAccuracy={locationAccuracy}
            onStoreSelect={handleViewStore}
            className="h-[500px] md:h-[600px]"
            onMapRef={handleMapRef}
            isRealTimeTracking={isRealTimeTracking}
            showDirections={showDirections || showMultiStoreDirections}
            directionsMode={directionsMode}
            selectedStoreIds={selectedStoreIds}
            onDirectionsClose={handleCloseDirections}
          />

          {showDirections && directionsInfo ? (
            <div className="mt-4">
              <DirectionsPanel
                routes={directionsInfo.routes || []}
                totalDistance={directionsInfo.totalDistance || ""}
                totalDuration={directionsInfo.totalDuration || ""}
                onChangeTravelMode={handleChangeTravelMode}
                onClose={handleCloseDirections}
                currentTravelMode={travelMode}
                loading={directionsInfo.routes.length === 0}
              />
            </div>
          ) : showMultiStoreDirections ? (
            <div className="mt-4">
              <MultiStoreDirections
                stores={stores}
                userLocation={userLocation}
                onClose={() => setShowMultiStoreDirections(false)}
                preSelectedStoreIds={selectedStoreIds.length > 0 ? selectedStoreIds : undefined}
                showMap={false} // Don't show the map in the directions panel
              />
            </div>
          ) : showDirections ? (
            <div className="mt-4">
              <DirectionsPanel
                routes={directionsInfo?.routes || []}
                totalDistance={directionsInfo?.totalDistance || ""}
                totalDuration={directionsInfo?.totalDuration || ""}
                onChangeTravelMode={handleChangeTravelMode}
                onClose={handleCloseDirections}
                currentTravelMode={travelMode}
                loading={!directionsInfo || directionsInfo.routes.length === 0}
              />
            </div>
          ) : (
            <div className="mt-4 max-h-[400px] md:max-h-[500px] overflow-y-auto border rounded-md shadow-sm w-full">
              <table className="w-full">
                <tbody>
                  {stores.map((store, index) => (
                    <tr
                      key={store.id}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleViewStore(store.id)}
                    >
                      <td className="p-2 w-8 text-center">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{store.name}</span>
                          {/* Update the address display code to include zip codes */}
                          <span className="text-xs text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1 inline" />
                            {store.address.includes(locationAddress?.city)
                              ? store.address
                              : locationAddress?.city && locationAddress?.state
                                ? `${store.address.split(",")[0]}, ${locationAddress.city}, ${locationAddress.state} ${locationAddress?.zip || ""}`
                                : store.address}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium">{store.distance}</span>
                          <span className="text-xs text-muted-foreground flex items-center justify-end">
                            <Car className="h-3 w-3 mr-1 inline" />
                            {calculateTravelTime(store.distanceValue)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 w-10 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Store className="h-4 w-4" />
                          <span className="sr-only">View Store</span>
                        </Button>
                      </td>
                      <td className="p-3 w-10 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGetDirections(store.id)
                          }}
                          className="ml-2"
                        >
                          <Navigation className="h-4 w-4" />
                          <span className="sr-only">Get Directions</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* REMOVE THIS DUPLICATE PANEL - This is causing the duplication issue */}
    </div>
  )
}

// Helper function to calculate travel time based on distance
function calculateTravelTime(distanceInMiles: number): string {
  // Assume average driving speed of 30 mph in city
  const timeInHours = distanceInMiles / 30

  if (timeInHours < 1) {
    // Convert to minutes if less than an hour
    const timeInMinutes = Math.ceil(timeInHours * 60)
    return `${timeInMinutes} min drive`
  } else {
    // Format as hours and minutes
    const hours = Math.floor(timeInHours)
    const minutes = Math.ceil((timeInHours - hours) * 60)
    return `${hours}h ${minutes}m drive`
  }
}
