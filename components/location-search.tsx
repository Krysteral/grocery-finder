"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { locationSuggestions } from "@/lib/location-suggestions"
import { parseLocation } from "@/lib/api"

export default function LocationSearch() {
  const [location, setLocation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentLocations, setRecentLocations] = useState<string[]>([])
  const [isTracking, setIsTracking] = useState(false)
  const watchIdRef = useRef<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Load recent locations from localStorage on component mount
  useEffect(() => {
    const savedLocations = localStorage.getItem("recentLocations")
    if (savedLocations) {
      try {
        setRecentLocations(JSON.parse(savedLocations))
      } catch (e) {
        console.error("Failed to parse recent locations:", e)
      }
    }
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const handleSearchReset = () => {
      // Clear location input when search is reset
      setLocation("")
      // Stop tracking if active
      stopLocationTracking()
    }

    // Listen for the custom event
    window.addEventListener("searchReset", handleSearchReset)

    // Clean up
    return () => {
      window.removeEventListener("searchReset", handleSearchReset)
      // Make sure to stop tracking when component unmounts
      stopLocationTracking()
    }
  }, [])

  // Save a location to recent locations
  const saveToRecentLocations = (locationValue: string) => {
    if (!locationValue) return

    const updatedLocations = [locationValue, ...recentLocations.filter((loc) => loc !== locationValue)].slice(0, 5) // Keep only the 5 most recent locations

    setRecentLocations(updatedLocations)
    localStorage.setItem("recentLocations", JSON.stringify(updatedLocations))
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!location.trim()) return

    setIsLoading(true)

    try {
      // Check if we're using real-time location
      const isRealTimeLocation =
        location === "Live Location" ||
        location === "Current Location" ||
        location === "Getting your location..." ||
        location.includes("GPS")

      if (isRealTimeLocation) {
        // For real-time location, try to use the last known location
        const lastLocationStr = localStorage.getItem("lastKnownLocation")
        const lastKnownCityState = localStorage.getItem("lastKnownCityState")

        if (lastLocationStr) {
          try {
            const lastLocation = JSON.parse(lastLocationStr)

            // If we have city and state, use that format
            if (lastKnownCityState) {
              // Update the display
              setLocation(lastKnownCityState)

              // Update URL
              const params = new URLSearchParams(window.location.search)
              params.set("location", lastKnownCityState)
              window.history.replaceState({}, "", `?${params.toString()}`)

              // Dispatch event with the city, state format but keep the coordinates
              window.dispatchEvent(
                new CustomEvent("locationUpdated", {
                  detail: {
                    ...lastLocation,
                    location: lastKnownCityState,
                    formattedLocation: lastKnownCityState,
                  },
                }),
              )
            } else {
              // Just use the last known location as is
              window.dispatchEvent(
                new CustomEvent("locationUpdated", {
                  detail: lastLocation,
                }),
              )

              // Update URL
              const params = new URLSearchParams(window.location.search)
              params.set("location", "Live Location")
              window.history.replaceState({}, "", `?${params.toString()}`)
            }

            setIsLoading(false)
            setShowSuggestions(false)
            return
          } catch (e) {
            console.error("Error parsing last known location:", e)
          }
        }

        // If we couldn't use the last known location, try to get it again
        handleGetCurrentLocation()
        setIsLoading(false)
        setShowSuggestions(false)
        return
      }

      // Extract city and state if possible
      const searchLocation = location.trim()
      let cityStateFormat = searchLocation

      // Try to extract city and state from the input
      const cityStateRegex = /([^,]+),\s*([^,]+)/
      const match = searchLocation.match(cityStateRegex)

      if (match) {
        const city = match[1].trim()
        const state = match[2].trim()
        cityStateFormat = `${city}, ${state}`
      }

      // Save to recent locations
      saveToRecentLocations(searchLocation)

      // Stop location tracking if it's active
      stopLocationTracking()

      // Update URL and trigger search
      await updateUrlAndTriggerSearch(searchLocation)

      // Force a refresh of the stores with the new location
      window.dispatchEvent(
        new CustomEvent("forceStoreRefresh", {
          detail: { location: searchLocation },
        }),
      )
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Error",
        description: "Failed to search for location",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowSuggestions(false)
    }
  }

  // Function to stop location tracking
  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      setIsTracking(false)
      console.log("Location tracking stopped")
    }
  }

  // Function to handle location updates
  const handlePositionUpdate = async (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords
    console.log("Real-time geolocation update:", { latitude, longitude, accuracy: position.coords.accuracy })

    try {
      // Dispatch event with exact coordinates
      const locationEvent = new CustomEvent("userLocationUpdated", {
        detail: {
          coordinates: { lat: latitude, lng: longitude },
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          isRealTime: true,
        },
      })
      window.dispatchEvent(locationEvent)

      // Use Google Maps Geocoding API to get address from coordinates
      const response = await fetch(`/api/reverse-geocode?lat=${latitude}&lng=${longitude}`)

      const data = await response.json()

      if (data.status === "OK" && data.results.length > 0) {
        // Extract city and state from address components
        let city = ""
        let state = ""
        let formattedAddress = ""

        // Find address components for locality (city) and administrative_area_level_1 (state)
        for (const component of data.results[0].address_components) {
          if (component.types.includes("locality")) {
            city = component.long_name
          }
          if (component.types.includes("administrative_area_level_1")) {
            state = component.short_name // Use short_name for state abbreviation (e.g., CA instead of California)
          }
        }

        // Create a formatted location string
        const locationString = city && state ? `${city}, ${state}` : data.results[0].formatted_address
        formattedAddress = data.results[0].formatted_address

        // Only update the location display if we're not already tracking
        if (!isTracking) {
          setLocation("Live Location")
          saveToRecentLocations("Live Location")
          setIsTracking(true)
        }

        // Dispatch a more detailed event with address information
        const detailedEvent = new CustomEvent("userLocationUpdated", {
          detail: {
            coordinates: { lat: latitude, lng: longitude },
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            isRealTime: true,
            address: {
              city,
              state,
              formattedAddress,
              locationString,
            },
          },
        })
        window.dispatchEvent(detailedEvent)

        // Update URL with the readable address if not already tracking
        if (!isTracking) {
          const params = new URLSearchParams(window.location.search)
          params.set("location", "Live Location")
          window.history.replaceState({}, "", `?${params.toString()}`)
        }
      }
    } catch (error) {
      console.error("Error processing location update:", error)
      // Still dispatch the basic coordinates event even if geocoding fails
      const locationEvent = new CustomEvent("userLocationUpdated", {
        detail: {
          coordinates: { lat: latitude, lng: longitude },
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          isRealTime: true,
        },
      })
      window.dispatchEvent(locationEvent)
    }
  }

  // Function to handle location errors
  const handlePositionError = (error: GeolocationPositionError) => {
    console.error("Geolocation error:", error.message)
    toast({
      title: "Location Error",
      description: error.message || "Failed to track your location",
      variant: "destructive",
    })
    stopLocationTracking()
    setIsLoading(false)
  }

  const getCurrentLocation = () => {
    setIsLoading(true)

    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Set a temporary loading message
    setLocation("Getting your location...")

    // First get a single position to center the map immediately
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Process the initial position
        await handlePositionUpdate(position)

        // Then start continuous tracking
        watchIdRef.current = navigator.geolocation.watchPosition(handlePositionUpdate, handlePositionError, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })

        setIsTracking(true)
        setIsLoading(false)
        console.log("Real-time location tracking started")

        // Update UI to show tracking is active
        setLocation("Live Location")
        saveToRecentLocations("Live Location")

        // Update URL
        const params = new URLSearchParams(window.location.search)
        params.set("location", "Live Location")
        window.history.replaceState({}, "", `?${params.toString()}`)
      },
      (error) => {
        setLocation("") // Clear the loading message
        toast({
          title: "Error",
          description: error.message || "Failed to get your location",
          variant: "destructive",
        })
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  // Helper function to update URL and trigger search
  const updateUrlAndTriggerSearch = async (locationValue) => {
    try {
      // Get coordinates for the location
      const locationData = await parseLocation(locationValue)

      // Check if we have city and state information
      let cityState = locationValue

      // If this is a real-time location or full address, try to extract city and state
      if (locationValue === "Live Location" || locationValue === "Current Location" || locationValue.includes(",")) {
        // If we have cityInfo from the parseLocation result, use it
        if (locationData.cityInfo) {
          const { city, state } = locationData.cityInfo
          if (city && state) {
            cityState = `${city}, ${state}`
          }
        }
      }

      // Update URL without refreshing the page
      const params = new URLSearchParams(window.location.search)
      params.set("location", locationValue)

      // Use history.replaceState to update URL without navigation
      window.history.replaceState({}, "", `?${params.toString()}`)

      // Trigger a custom event to notify other components that location has been updated
      // Include the coordinates in the event
      const event = new CustomEvent("locationUpdated", {
        detail: {
          location: locationValue,
          formattedLocation: cityState, // Add the formatted city, state
          coordinates: {
            lat: locationData.lat,
            lng: locationData.lng,
          },
          cityInfo: locationData.cityInfo,
          isManualEntry: true, // Add flag to indicate this was manually entered
        },
      })
      window.dispatchEvent(event)

      console.log("Location updated with coordinates:", locationData, "Formatted as:", cityState)
    } catch (error) {
      console.error("Error geocoding location:", error)
      // Still dispatch event with just the location string if geocoding fails
      const event = new CustomEvent("locationUpdated", {
        detail: {
          location: locationValue,
          isManualEntry: true,
        },
      })
      window.dispatchEvent(event)
    }
  }

  const handleLocationSelect = async (selectedLocation: string) => {
    // Stop tracking if active
    stopLocationTracking()

    setLocation(selectedLocation)
    saveToRecentLocations(selectedLocation)
    setShowSuggestions(false)

    // Update URL and trigger search with the selected location
    await updateUrlAndTriggerSearch(selectedLocation)
  }

  // Filter location suggestions based on user input
  const filteredLocations = locationSuggestions
    .filter(
      (loc) =>
        loc.label.toLowerCase().includes(location.toLowerCase()) ||
        loc.value.toLowerCase().includes(location.toLowerCase()),
    )
    .slice(0, 5) // Limit to 5 suggestions

  // Filter recent locations based on user input if they're typing
  const filteredRecentLocations =
    location.length > 0
      ? recentLocations.filter((loc) => loc.toLowerCase().includes(location.toLowerCase()))
      : recentLocations

  const handleGetCurrentLocation = useCallback(() => {
    setIsGettingLocation(true)
    setLocation("Getting your location...")
    setLocationError(null) // Clear any previous errors

    if (!navigator.geolocation) {
      setLocation("")
      setIsGettingLocation(false)
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    // Options for geolocation request
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // Increase timeout to 15 seconds
      maximumAge: 30000, // Allow cached positions up to 30 seconds old
    }

    // First try to get a high accuracy position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        handleSuccessfulGeolocation(position)
      },
      (highAccuracyError) => {
        console.warn("High accuracy geolocation failed:", highAccuracyError.message)

        // If high accuracy fails, try again with lower accuracy
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            handleSuccessfulGeolocation(position)
          },
          (error) => {
            handleGeolocationError(error)
          },
          { ...geoOptions, enableHighAccuracy: false, timeout: 20000 },
        )
      },
      geoOptions,
    )
  }, [])

  // Helper function to handle successful geolocation
  const handleSuccessfulGeolocation = async (position) => {
    const { latitude, longitude, accuracy } = position.coords
    console.log("Got current position:", latitude, longitude, "accuracy:", accuracy)

    try {
      // Reverse geocode to get address information
      const response = await fetch(`/api/reverse-geocode?lat=${latitude}&lng=${longitude}`)
      const data = await response.json()

      if (data.status === "OK" && data.results && data.results.length > 0) {
        processGeocodeResults(data.results, latitude, longitude, accuracy)
      } else {
        throw new Error("No results from geocoding service")
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error)
      // Even if geocoding fails, we can still use the coordinates
      fallbackToCoordinatesOnly(latitude, longitude, accuracy)
    }

    setIsGettingLocation(false)
  }

  // Helper function to process geocode results
  const processGeocodeResults = (results, latitude, longitude, accuracy) => {
    const formattedAddress = results[0].formatted_address || "Current Location"
    let city = ""
    let state = ""
    let cityStateFormat = "Current Location"

    // Extract city and state from address components
    const addressComponents = results[0].address_components || []
    for (const component of addressComponents) {
      if (component.types.includes("locality")) {
        city = component.long_name
      } else if (component.types.includes("administrative_area_level_1")) {
        state = component.short_name
      }
    }

    // If we couldn't find a city, try to use neighborhood or sublocality
    if (!city) {
      for (const component of addressComponents) {
        if (component.types.includes("neighborhood") || component.types.includes("sublocality")) {
          city = component.long_name
          break
        }
      }
    }

    // Create city, state format if both are available
    if (city && state) {
      cityStateFormat = `${city}, ${state}`
      // Store this in localStorage for future use
      localStorage.setItem("lastKnownCityState", cityStateFormat)
    }

    // Store the full address information
    const locationDetail = {
      location: "Live Location",
      formattedLocation: cityStateFormat,
      coordinates: { lat: latitude, lng: longitude },
      cityInfo: {
        city: city || "Unknown City",
        state: state || "Unknown State",
        zip: extractZipCode(addressComponents) || "00000",
      },
      address: {
        formattedAddress,
        city,
        state,
        locationString: cityStateFormat,
      },
      isRealTime: true,
      accuracy,
    }

    // Store this for future use
    localStorage.setItem("lastKnownLocation", JSON.stringify(locationDetail))

    // Update the input field with the formatted address
    setLocation(cityStateFormat || formattedAddress)

    // Dispatch events
    window.dispatchEvent(
      new CustomEvent("userLocationUpdated", {
        detail: locationDetail,
      }),
    )

    window.dispatchEvent(
      new CustomEvent("locationUpdated", {
        detail: locationDetail,
      }),
    )
  }

  // Helper function to extract ZIP code from address components
  const extractZipCode = (addressComponents) => {
    for (const component of addressComponents) {
      if (component.types.includes("postal_code")) {
        return component.long_name
      }
    }
    return null
  }

  // Helper function to fall back to coordinates only
  const fallbackToCoordinatesOnly = (latitude, longitude, accuracy) => {
    // Try to get the last known city/state from localStorage
    const lastKnownCityState = localStorage.getItem("lastKnownCityState")

    const locationDetail = {
      location: lastKnownCityState || "Current Location",
      coordinates: { lat: latitude, lng: longitude },
      cityInfo: {
        city: "Unknown City",
        state: "Unknown State",
        zip: "00000",
      },
      isRealTime: true,
      accuracy,
    }

    // Store this for future use
    localStorage.setItem("lastKnownLocation", JSON.stringify(locationDetail))

    // Update the input field
    setLocation(lastKnownCityState || "Current Location")

    // Dispatch events
    window.dispatchEvent(
      new CustomEvent("userLocationUpdated", {
        detail: locationDetail,
      }),
    )

    window.dispatchEvent(
      new CustomEvent("locationUpdated", {
        detail: locationDetail,
      }),
    )
  }

  // Helper function to handle geolocation errors
  const handleGeolocationError = (error) => {
    console.error("Error getting location:", error)

    // Try to use the last known location from localStorage
    const lastLocationStr = localStorage.getItem("lastKnownLocation")
    const lastKnownCityState = localStorage.getItem("lastKnownCityState")

    if (lastLocationStr) {
      try {
        const lastLocation = JSON.parse(lastLocationStr)

        // Dispatch the stored location
        window.dispatchEvent(
          new CustomEvent("userLocationUpdated", {
            detail: lastLocation,
          }),
        )

        window.dispatchEvent(
          new CustomEvent("locationUpdated", {
            detail: lastLocation,
          }),
        )

        // Update the input field
        setLocation(lastKnownCityState || lastLocation.formattedLocation || "Last Known Location")
        setIsGettingLocation(false)
        return
      } catch (e) {
        console.error("Error parsing last known location:", e)
      }
    }

    // If we couldn't use the last known location, show an error
    setLocation("")
    setIsGettingLocation(false)

    let errorMessage = "Could not get your location. "

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage += "Location access was denied. Please check your browser permissions."
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage += "Location information is unavailable. Please try again later."
        break
      case error.TIMEOUT:
        errorMessage += "The request to get your location timed out. Please try again."
        break
      default:
        errorMessage += "An unknown error occurred."
    }

    setLocationError(errorMessage)
  }

  // Add this after the other useEffect blocks
  useEffect(() => {
    // Create a variable to store the last known location data
    let lastKnownLocation: any = null

    // Listen for location updates and store the most recent one
    const handleLocationUpdate = (event: CustomEvent) => {
      lastKnownLocation = event.detail
    }

    // Listen for the request to use the last known location
    const handleUseLastKnown = () => {
      if (lastKnownLocation) {
        // Dispatch the stored location data
        window.dispatchEvent(
          new CustomEvent("locationUpdated", {
            detail: lastKnownLocation,
          }),
        )
      }
    }

    // Add event listeners
    window.addEventListener("userLocationUpdated", handleLocationUpdate as EventListener)
    window.addEventListener("useLastKnownLocation", handleUseLastKnown)

    // Clean up
    return () => {
      window.removeEventListener("userLocationUpdated", handleLocationUpdate as EventListener)
      window.removeEventListener("useLastKnownLocation", handleUseLastKnown)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="location-input">Find Nearby Stores</Label>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="location-input"
              type="text"
              placeholder="Enter your location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className={`flex-1 ${isTracking ? "border-green-500 pr-8" : ""}`}
              ref={inputRef}
              autoComplete="off"
            />
            {isTracking && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1"></div>
              </div>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && (location.length > 0 || recentLocations.length > 0) && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                {/* Recent locations - only show if they match the search or if no search text */}
                {filteredRecentLocations.length > 0 && (
                  <>
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground">Recent Locations</div>
                    <div className="p-1">
                      {filteredRecentLocations.map((recentLoc, index) => (
                        <div
                          key={`recent-${index}`}
                          className="flex items-center px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-muted"
                          onClick={() => handleLocationSelect(recentLoc)}
                        >
                          <MapPin className="mr-2 h-4 w-4 opacity-50" />
                          <span>{recentLoc}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Filtered suggestions */}
                {filteredLocations.length > 0 && (
                  <>
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground">Suggestions</div>
                    <div className="p-1">
                      {filteredLocations.map((loc) => (
                        <div
                          key={loc.value}
                          className="flex items-center px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-muted"
                          onClick={() => handleLocationSelect(loc.label)}
                        >
                          <span>{loc.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <Button type="submit" disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>

        <Button
          variant={isTracking ? "default" : "outline"}
          onClick={isTracking ? stopLocationTracking : handleGetCurrentLocation}
          disabled={isLoading || isGettingLocation}
          className="w-full mt-2.5"
        >
          <MapPin className="h-4 w-4 mr-2" />
          {isLoading || isGettingLocation
            ? "Getting location..."
            : isTracking
              ? "Stop location tracking"
              : "Use my real-time location"}
        </Button>
        {locationError && <div className="text-red-500 text-sm mt-1">{locationError}</div>}
      </div>
    </div>
  )
}
