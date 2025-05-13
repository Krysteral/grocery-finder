"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Navigation, Check, Save } from "lucide-react"
import StoreMap from "./store-map"
import { DirectionsPanel } from "./directions-panel"

interface Store {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  distance: string
  distanceValue: number
}

interface MultiStoreDirectionsProps {
  stores: Store[]
  userLocation?: { lat: number; lng: number }
  onClose: () => void
  preSelectedStoreIds?: string[]
  showMap?: boolean // Add this new prop
}

export function MultiStoreDirections({
  stores,
  userLocation,
  onClose,
  preSelectedStoreIds,
  showMap = true, // Default to true for backward compatibility
}: MultiStoreDirectionsProps) {
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([])
  const [showDirections, setShowDirections] = useState(false)
  const [directionsInfo, setDirectionsInfo] = useState<{
    routes: any[]
    totalDistance: string
    totalDuration: string
  } | null>(null)
  const [travelMode, setTravelMode] = useState<string>("DRIVING")
  const [returnToStart, setReturnToStart] = useState(true)
  const [optimizeRoute, setOptimizeRoute] = useState(true)
  const { toast } = useToast()

  // Initialize with all stores selected or pre-selected stores if provided
  useEffect(() => {
    if (preSelectedStoreIds && preSelectedStoreIds.length > 0) {
      setSelectedStoreIds(preSelectedStoreIds)
      // Automatically show directions if pre-selected stores are provided
      if (userLocation) {
        setTimeout(() => {
          handleGetDirections(preSelectedStoreIds)
        }, 500)
      }
    } else if (stores.length > 0) {
      setSelectedStoreIds(stores.map((store) => store.id))
    }
  }, [stores, preSelectedStoreIds, userLocation])

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStoreIds((prev) => {
      if (prev.includes(storeId)) {
        return prev.filter((id) => id !== storeId)
      } else {
        return [...prev, storeId]
      }
    })
  }

  const handleSelectAll = () => {
    setSelectedStoreIds(stores.map((store) => store.id))
  }

  const handleSelectNone = () => {
    setSelectedStoreIds([])
  }

  const handleGetDirections = async (storeIds = selectedStoreIds) => {
    if (!userLocation) {
      toast({
        title: "Error",
        description: "Your location is needed to get directions. Please enable location services.",
        variant: "destructive",
      })
      return
    }

    if (storeIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one store to get directions.",
        variant: "destructive",
      })
      return
    }

    setShowDirections(true)

    try {
      // Import the directions function dynamically to avoid issues with window.google
      const { getDirectionsToMultipleStores } = await import("@/lib/directions")

      // Get selected stores
      const selectedStores = stores.filter((store) => storeIds.includes(store.id))

      console.log(
        "Getting directions to stores:",
        selectedStores.map((s) => `${s.name} (${s.lat},${s.lng})`),
      )

      // Make sure we have valid coordinates for all stores
      const validStores = selectedStores.filter(
        (store) =>
          typeof store.lat === "number" && !isNaN(store.lat) && typeof store.lng === "number" && !isNaN(store.lng),
      )

      if (validStores.length !== selectedStores.length) {
        console.error(
          "Some stores have invalid coordinates:",
          selectedStores.filter((s) => !validStores.includes(s)).map((s) => `${s.name} (${s.lat},${s.lng})`),
        )

        toast({
          title: "Warning",
          description: "Some stores have invalid coordinates and will be skipped.",
          variant: "warning",
        })

        if (validStores.length === 0) {
          throw new Error("No stores with valid coordinates selected")
        }
      }

      const result = await getDirectionsToMultipleStores(
        userLocation,
        validStores.map((store) => ({ lat: store.lat, lng: store.lng })),
        returnToStart,
        window.google.maps.TravelMode[travelMode],
        optimizeRoute,
      )

      if (result) {
        console.log("Directions result:", result)
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
      setShowDirections(false)
    }
  }

  const handleChangeTravelMode = (mode: string) => {
    setTravelMode(mode)
    if (showDirections) {
      handleGetDirections()
    }
  }

  // Add this after the other useEffects
  useEffect(() => {
    if (selectedStoreIds.length > 0) {
      const selectedStores = stores.filter((store) => selectedStoreIds.includes(store.id))
      console.log("Currently selected stores:", selectedStores)
    }
  }, [selectedStoreIds, stores])

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Multi-Store Directions</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      <div>
        {!showDirections ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Select stores to visit:</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  <Check className="h-4 w-4 mr-1" />
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleSelectNone}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
              {stores.map((store) => (
                <div key={store.id} className="flex items-center p-3">
                  <Checkbox
                    id={`store-${store.id}`}
                    checked={selectedStoreIds.includes(store.id)}
                    onCheckedChange={() => toggleStoreSelection(store.id)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <label htmlFor={`store-${store.id}`} className="flex flex-col cursor-pointer">
                      <span className="font-medium">{store.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 mr-1 inline" />
                        {store.address}
                      </span>
                    </label>
                  </div>
                  <div className="text-right text-sm">{store.distance}</div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="return-to-start"
                  checked={returnToStart}
                  onCheckedChange={(checked) => setReturnToStart(!!checked)}
                />
                <label htmlFor="return-to-start" className="text-sm cursor-pointer">
                  Return to starting point
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="optimize-route"
                  checked={optimizeRoute}
                  onCheckedChange={(checked) => setOptimizeRoute(!!checked)}
                />
                <label htmlFor="optimize-route" className="text-sm cursor-pointer">
                  Optimize route (visit stores in the most efficient order)
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              <Button
                onClick={() => handleGetDirections()}
                disabled={selectedStoreIds.length === 0 || !userLocation}
                className="flex items-center justify-center"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Dispatch an event to save the multi-store route
                  const selectedStores = stores.filter((store) => selectedStoreIds.includes(store.id))
                  window.dispatchEvent(
                    new CustomEvent("saveMultiStoreRoute", {
                      detail: {
                        stores: selectedStores,
                        optimizeRoute,
                        returnToStart,
                      },
                    }),
                  )
                }}
                disabled={selectedStoreIds.length === 0}
                className="flex items-center justify-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Route
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {showMap && (
              <div className="h-[500px]">
                <StoreMap
                  stores={stores.filter((store) => selectedStoreIds.includes(store.id))}
                  userLocation={userLocation}
                  className="h-full"
                  showDirections={true}
                  directionsMode="multi"
                  selectedStoreIds={selectedStoreIds}
                  onDirectionsClose={() => setShowDirections(false)}
                />
              </div>
            )}
            {directionsInfo && (
              <div className="border rounded-md p-4 mt-8 clear-both">
                <h3 className="text-lg font-semibold mb-4">Route Details</h3>
                <DirectionsPanel
                  routes={directionsInfo.routes}
                  totalDistance={directionsInfo.totalDistance}
                  totalDuration={directionsInfo.totalDuration}
                  onChangeTravelMode={handleChangeTravelMode}
                  onClose={() => setShowDirections(false)}
                  currentTravelMode={travelMode}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
