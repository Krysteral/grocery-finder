"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2, MapPin, Navigation } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getDirectionsToStore, getDirectionsToMultipleStores } from "@/lib/directions"

interface StoreMapProps {
  stores: {
    id: string
    name: string
    address: string
    lat: number
    lng: number
    distance: string
    distanceValue: number
  }[]
  userLocation?: { lat: number; lng: number }
  locationAccuracy?: number
  onStoreSelect?: (storeId: string) => void
  className?: string
  onMapRef?: (mapInstance: google.maps.Map | null) => void
  isRealTimeTracking?: boolean
  showDirections?: boolean
  directionsMode?: "single" | "multi"
  selectedStoreIds?: string[]
  onDirectionsClose?: () => void
}

// Declare google variable
declare global {
  interface Window {
    google: any
  }
}

export default function StoreMap({
  stores,
  userLocation,
  locationAccuracy,
  onStoreSelect,
  className = "",
  onMapRef,
  isRealTimeTracking = false,
  showDirections,
  directionsMode,
  selectedStoreIds,
  onDirectionsClose,
}: StoreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null)
  const [accuracyCircle, setAccuracyCircle] = useState<google.maps.Circle | null>(null)
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [followUser, setFollowUser] = useState(true)
  const { toast } = useToast()
  const initialFocusRef = useRef(false)
  const lastUserLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null)
  const [directionsResult, setDirectionsResult] = useState<any>(null)
  const [directionsInfo, setDirectionsInfo] = useState<{
    routes: any[]
    totalDistance: string
    totalDuration: string
  } | null>(null)
  const [travelMode, setTravelMode] = useState<string>("DRIVING")

  // For debugging
  useEffect(() => {
    if (userLocation) {
      console.log("User location updated in StoreMap:", userLocation)
      lastUserLocationRef.current = userLocation
    }
  }, [userLocation])

  // Load Google Maps API
  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true)
      return
    }

    // Create script element - note we're not including the API key in the URL
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?libraries=places,marker&v=beta&map_ids=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || "8f348d37d6e8549"}`

    // First fetch the Maps API URL from our server endpoint
    fetch("/api/maps")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error)
        }

        // Create script element with the secure URL that includes the API key
        const script = document.createElement("script")
        script.src = data.url
        script.async = true
        script.defer = true
        script.onload = () => setIsLoaded(true)
        script.onerror = () => {
          toast({
            title: "Error",
            description: "Failed to load Google Maps. Please try again later.",
            variant: "destructive",
          })
        }

        // Append script to document
        document.head.appendChild(script)
      })
      .catch((error) => {
        console.error("Error loading Maps API:", error)
        toast({
          title: "Error",
          description: "Failed to initialize maps. Please try again later.",
          variant: "destructive",
        })
      })

    // Remove the lines below since we're handling this in the fetch promise
    // script.async = true
    // script.defer = true
    // script.onload = () => setIsLoaded(true)
    // script.onerror = () => {
    //   toast({
    //     title: "Error",
    //     description: "Failed to load Google Maps. Please try again later.",
    //     variant: "destructive",
    //   })
    // }
    //
    // // Append script to document
    // document.head.appendChild(script)

    // Return a different cleanup function since we're using a different approach
    return () => {
      // No need to remove the script since it will be cleaned up when component unmounts
    }
  }, [toast])

  // Initialize map when API is loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    // Create map instance with better default options
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 13, // Default zoom level
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || "8f348d37d6e8549", // Add a default Map ID
    })

    // Create info window
    const info = new window.google.maps.InfoWindow()
    setInfoWindow(info)

    // Set map instance
    setMapInstance(map)

    // Call the ref callback if provided, but only once when the map is first created
    if (onMapRef && map) {
      onMapRef(map)
    }

    // Clean up
    return () => {
      // Clear markers
      markers.forEach((marker) => marker.setMap(null))

      // Clear user marker
      if (userMarker) {
        userMarker.setMap(null)
      }

      // Clear accuracy circle if it exists
      if (accuracyCircle) {
        accuracyCircle.setMap(null)
      }

      // Close info window
      if (infoWindow) {
        infoWindow.close()
      }
    }
  }, [isLoaded, onMapRef])

  // Handle user location changes separately
  useEffect(() => {
    if (!mapInstance || !isLoaded || !userLocation) return

    console.log("Updating user marker position:", userLocation)

    // Remove previous user marker if it exists
    if (userMarker) {
      userMarker.setMap(null)
    }

    // Create a new user marker at the exact location
    const newUserMarker = new window.google.maps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map: mapInstance,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 3,
      },
      title: "Your Location",
      zIndex: 1000, // Ensure user marker is on top
    })

    setUserMarker(newUserMarker)

    // Center map on user location if followUser is true
    if (followUser) {
      console.log("Centering map on user location:", userLocation)
      mapInstance.setCenter({ lat: userLocation.lat, lng: userLocation.lng })
    }

    // Set zoom level to focus on user location if this is the first time
    if (!initialFocusRef.current) {
      mapInstance.setZoom(14) // Closer zoom for initial focus
      initialFocusRef.current = true
    }

    // Update or create the accuracy circle if accuracy is provided
    if (locationAccuracy) {
      if (accuracyCircle) {
        // Update existing circle
        accuracyCircle.setCenter({ lat: userLocation.lat, lng: userLocation.lng })
        accuracyCircle.setRadius(locationAccuracy)
      } else {
        // Create new accuracy circle
        const newCircle = new window.google.maps.Circle({
          strokeColor: "#4285F4",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#4285F4",
          fillOpacity: 0.1,
          map: mapInstance,
          center: { lat: userLocation.lat, lng: userLocation.lng },
          radius: locationAccuracy,
          zIndex: 1,
        })
        setAccuracyCircle(newCircle)
      }
    }
  }, [userLocation, locationAccuracy, mapInstance, isLoaded, followUser])

  // Update markers when stores or map instance changes
  useEffect(() => {
    if (!mapInstance || !isLoaded || !window.google) return

    // Clear existing store markers (but keep user marker)
    markers.forEach((marker) => marker.setMap(null))

    // Create bounds object to fit all markers
    const bounds = new window.google.maps.LatLngBounds()
    const newMarkers = []

    // Add user location to bounds if available
    if (userLocation) {
      bounds.extend({ lat: userLocation.lat, lng: userLocation.lng })
    }

    // Create new markers for stores - using standard markers for compatibility
    stores.forEach((store, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: store.lat, lng: store.lng },
        map: mapInstance,
        title: store.name,
        label: {
          text: (index + 1).toString(),
          color: "#FFFFFF",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#1E40AF",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      })

      // Add click listener to marker
      marker.addListener("click", () => {
        if (infoWindow) {
          infoWindow.close()

          // Create info window content
          const content = `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600;">${store.name}</h3>
            <p style="margin: 0 0 8px; font-size: 14px;">${store.address}</p>
            <p style="margin: 0; font-size: 14px;"><strong>${store.distance}</strong> away</p>
          </div>
        `

          infoWindow.setContent(content)
          infoWindow.open(mapInstance, marker)

          // Call onStoreSelect if provided
          if (onStoreSelect) {
            onStoreSelect(store.id)
          }
        }
      })

      newMarkers.push(marker)
      // Extend bounds to include this marker
      bounds.extend(marker.getPosition()!)
    })

    // Set new markers
    setMarkers(newMarkers)

    // If we have stores, fit the map to include all markers
    if (stores.length > 0 && !bounds.isEmpty()) {
      // ALWAYS prioritize user location by setting center first
      if (userLocation && followUser) {
        // First center on user location
        mapInstance.setCenter({ lat: userLocation.lat, lng: userLocation.lng })

        // Then only fit bounds if we have more than one store or if the map is expanded
        if (stores.length > 1 || isExpanded) {
          // Use a timeout to ensure the center takes effect first
          setTimeout(() => {
            mapInstance.fitBounds(bounds)

            // Adjust zoom if too zoomed out
            const listener = window.google.maps.event.addListenerOnce(mapInstance, "idle", () => {
              if (mapInstance.getZoom()! > 15) {
                mapInstance.setZoom(15) // Don't zoom in too far
              } else if (mapInstance.getZoom()! < 10) {
                mapInstance.setZoom(10) // Don't zoom out too far
              }
            })
          }, 100)
        }
      } else {
        // If no user location or not following, just fit to store bounds
        mapInstance.fitBounds(bounds)
      }
    } else if (userLocation && followUser) {
      // If we only have user location, center on it
      mapInstance.setCenter({ lat: userLocation.lat, lng: userLocation.lng })
      mapInstance.setZoom(14)
    }
  }, [mapInstance, isLoaded, stores, userLocation, infoWindow, onStoreSelect, isExpanded, followUser])

  // Listen for map drag events to disable follow mode
  useEffect(() => {
    if (!mapInstance || !isLoaded) return

    const dragListener = mapInstance.addListener("dragstart", () => {
      if (followUser) {
        console.log("User dragged map, disabling follow mode")
        setFollowUser(false)
      }
    })

    return () => {
      if (dragListener) {
        window.google.maps.event.removeListener(dragListener)
      }
    }
  }, [mapInstance, isLoaded, followUser])

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)

    // Trigger resize event to ensure map renders correctly
    if (mapInstance) {
      setTimeout(() => {
        window.google.maps.event.trigger(mapInstance, "resize")

        // Refit bounds when expanding
        if (!isExpanded) {
          const bounds = new window.google.maps.LatLngBounds()

          // Include user location
          if (userLocation) {
            bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng))
          }

          // Include all store markers
          markers.forEach((marker) => {
            bounds.extend(marker.getPosition()!)
          })

          if (!bounds.isEmpty()) {
            // If we have user location, prioritize it
            if (userLocation && followUser) {
              mapInstance.setCenter({ lat: userLocation.lat, lng: userLocation.lng })

              // Only fit bounds if we have more than one store
              if (markers.length > 1) {
                mapInstance.fitBounds(bounds)
              }
            } else {
              mapInstance.fitBounds(bounds)
            }
          }
        }
      }, 100)
    }
  }

  // Function to center on user and enable follow mode
  const centerOnUser = () => {
    if (mapInstance && userLocation) {
      mapInstance.setCenter({ lat: userLocation.lat, lng: userLocation.lng })
      mapInstance.setZoom(14)
      setFollowUser(true)
    }
  }

  // Add this useEffect to handle directions
  useEffect(() => {
    if (!mapInstance || !isLoaded || !userLocation || !window.google) return

    // Clear previous directions
    if (directionsRenderer) {
      directionsRenderer.setMap(null)
      setDirectionsRenderer(null)
    }

    // Don't proceed if directions aren't requested
    if (!showDirections) return

    console.log("Fetching directions in StoreMap:", {
      directionsMode,
      selectedStoreIds,
      storeCount: stores.length,
      travelMode,
    })

    const fetchDirections = async () => {
      try {
        let result
        const googleTravelMode = window.google.maps.TravelMode[travelMode]

        if (directionsMode === "single" && selectedStoreIds && selectedStoreIds.length > 0) {
          // Get the selected store
          const selectedStore = stores.find((store) => store.id === selectedStoreIds[0])

          if (selectedStore) {
            console.log("Getting single store directions to:", selectedStore)
            // Get directions to a single store
            result = await getDirectionsToStore(
              { lat: userLocation.lat, lng: userLocation.lng },
              { lat: selectedStore.lat, lng: selectedStore.lng },
              googleTravelMode,
            )
          }
        } else if (directionsMode === "multi" && selectedStoreIds && selectedStoreIds.length > 0) {
          // Get all selected stores
          const selectedStores = stores.filter((store) => selectedStoreIds.includes(store.id))

          if (selectedStores.length > 0) {
            console.log(
              "Getting multi-store directions to:",
              selectedStores.map((s) => `${s.name} (${s.lat},${s.lng})`),
            )

            // Validate coordinates
            const validStores = selectedStores.filter(
              (store) =>
                typeof store.lat === "number" &&
                !isNaN(store.lat) &&
                typeof store.lng === "number" &&
                !isNaN(store.lng),
            )

            if (validStores.length !== selectedStores.length) {
              console.error(
                "Some stores have invalid coordinates:",
                selectedStores.filter((s) => !validStores.includes(s)).map((s) => `${s.name} (${s.lat},${s.lng})`),
              )
            }

            // Get directions to multiple stores
            result = await getDirectionsToMultipleStores(
              { lat: userLocation.lat, lng: userLocation.lng },
              validStores.map((store) => ({ lat: store.lat, lng: store.lng })),
              true, // Return to start
              googleTravelMode,
              true, // Optimize waypoints
            )
          }
        }

        if (result) {
          console.log("Directions result in StoreMap:", result)
          setDirectionsInfo({
            routes: result.routes,
            totalDistance: result.totalDistance,
            totalDuration: result.totalDuration,
          })

          // Render directions on the map
          const renderer = new window.google.maps.DirectionsRenderer({
            map: mapInstance,
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: "#4285F4",
              strokeWeight: 5,
              strokeOpacity: 0.7,
            },
          })

          renderer.setDirections(result.rawResponse)
          setDirectionsRenderer(renderer)

          // Log the raw response to help debug
          console.log("Raw directions response:", {
            routes: result.rawResponse.routes.length,
            legs: result.rawResponse.routes[0]?.legs.length,
            waypoints: result.rawResponse.routes[0]?.waypoint_order,
          })
        }
      } catch (error) {
        console.error("Error fetching directions:", error)
        toast({
          title: "Error",
          description: "Failed to get directions. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchDirections()
  }, [mapInstance, isLoaded, userLocation, showDirections, directionsMode, selectedStoreIds, travelMode, stores, toast])

  // Add a function to handle travel mode changes
  const handleChangeTravelMode = (mode: string) => {
    setTravelMode(mode)
  }

  return (
    <Card className={`relative overflow-hidden ${className} ${isExpanded ? "fixed inset-4 z-50" : "h-[300px]"}`}>
      <div ref={mapRef} className="w-full h-full" />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {isLoaded && stores.length === 0 && !userLocation && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="flex flex-col items-center text-center p-4">
            <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No locations to display on the map</p>
          </div>
        </div>
      )}

      <Button variant="secondary" size="sm" className="absolute top-2 right-2 z-10" onClick={toggleExpanded}>
        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        <span className="sr-only">{isExpanded ? "Minimize" : "Maximize"} map</span>
      </Button>

      {userLocation && (
        <Button
          variant={followUser ? "default" : "secondary"}
          size="sm"
          className="absolute bottom-2 right-2 z-10"
          onClick={centerOnUser}
        >
          <Navigation className={`h-4 w-4 mr-1 ${followUser ? "text-white" : ""}`} />
          {followUser ? "Following" : "Center on me"}
        </Button>
      )}

      {isRealTimeTracking && (
        <div className="absolute top-2 left-2 z-10 bg-white/80 rounded-md px-2 py-1 text-xs flex items-center">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1"></div>
          <span>Live tracking</span>
        </div>
      )}
      {/* Remove the directions panel from here */}
    </Card>
  )
}
