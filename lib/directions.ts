import type { google } from "google-maps"

declare global {
  interface Window {
    google: any
  }
}

// Define the types for the directions response
export interface RouteStep {
  instruction: string
  distance: string
  duration: string
}

export interface RouteInfo {
  startAddress: string
  endAddress: string
  distance: string
  duration: string
  steps: RouteStep[]
}

export interface DirectionsResult {
  routes: RouteInfo[]
  totalDistance: string
  totalDuration: string
  rawResponse: any
}

// Function to get directions to a single store
export async function getDirectionsToStore(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: any = window.google.maps.TravelMode.DRIVING,
): Promise<DirectionsResult> {
  return new Promise((resolve, reject) => {
    const directionsService = new window.google.maps.DirectionsService()

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: travelMode,
      },
      (response: any, status: any) => {
        if (status === "OK") {
          const route = response.routes[0]
          const leg = route.legs[0]

          const routeInfo: RouteInfo = {
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            distance: leg.distance.text,
            duration: leg.duration.text,
            steps: leg.steps.map((step: any) => ({
              instruction: step.instructions,
              distance: step.distance.text,
              duration: step.duration.text,
            })),
          }

          resolve({
            routes: [routeInfo],
            totalDistance: leg.distance.text,
            totalDuration: leg.duration.text,
            rawResponse: response,
          })
        } else {
          reject(new Error(`Directions request failed: ${status}`))
        }
      },
    )
  })
}

// Function to get directions to multiple stores
export async function getDirectionsToMultipleStores(
  origin: { lat: number; lng: number },
  destinations: { lat: number; lng: number }[],
  returnToStart = true,
  travelMode: any = window.google.maps.TravelMode.DRIVING,
  optimizeWaypoints = true,
): Promise<DirectionsResult> {
  return new Promise((resolve, reject) => {
    if (destinations.length === 0) {
      reject(new Error("No destinations provided"))
      return
    }

    const directionsService = new window.google.maps.DirectionsService()

    // Log the input parameters for debugging
    console.log("Directions request:", {
      origin,
      destinations: destinations.map((d) => `${d.lat},${d.lng}`),
      returnToStart,
      travelMode,
      optimizeWaypoints,
    })

    // Handle the case of a single destination
    if (destinations.length === 1) {
      directionsService.route(
        {
          origin: origin,
          destination: destinations[0],
          travelMode: travelMode,
        },
        (response: any, status: any) => {
          if (status === "OK") {
            const route = response.routes[0]
            const leg = route.legs[0]

            const routeInfo: RouteInfo = {
              startAddress: leg.start_address,
              endAddress: leg.end_address,
              distance: leg.distance.text,
              duration: leg.duration.text,
              steps: leg.steps.map((step: any) => ({
                instruction: step.instructions,
                distance: step.distance.text,
                duration: step.duration.text,
              })),
            }

            resolve({
              routes: [routeInfo],
              totalDistance: leg.distance.text,
              totalDuration: leg.duration.text,
              rawResponse: response,
            })
          } else {
            reject(new Error(`Directions request failed: ${status}`))
          }
        },
      )
      return
    }

    // For multiple destinations, we need to handle the route differently
    // The final destination should be the origin if returnToStart is true,
    // otherwise it should be the last destination
    const finalDestination = returnToStart ? origin : destinations[destinations.length - 1]

    // All destinations except the last one become waypoints
    // If returnToStart is true, all destinations become waypoints
    const waypointDestinations = returnToStart ? destinations : destinations.slice(0, -1)

    const waypoints = waypointDestinations.map((dest) => ({
      location: new window.google.maps.LatLng(dest.lat, dest.lng),
      stopover: true,
    }))

    console.log("Directions request config:", {
      origin: `${origin.lat},${origin.lng}`,
      destination: returnToStart ? `${origin.lat},${origin.lng}` : `${finalDestination.lat},${finalDestination.lng}`,
      waypoints: waypoints.map((wp) => `${wp.location.lat()},${wp.location.lng()}`),
      optimizeWaypoints,
      travelMode,
    })

    directionsService.route(
      {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: returnToStart
          ? new window.google.maps.LatLng(origin.lat, origin.lng)
          : new window.google.maps.LatLng(finalDestination.lat, finalDestination.lng),
        waypoints: waypoints,
        optimizeWaypoints: optimizeWaypoints,
        travelMode: travelMode,
      },
      (response: any, status: any) => {
        if (status === "OK") {
          const route = response.routes[0]
          const legs = route.legs

          // Log the response for debugging
          console.log("Directions response:", {
            status,
            routeLegs: legs.length,
            waypoint_order: route.waypoint_order,
            overview_path_length: route.overview_path ? route.overview_path.length : 0,
          })

          // Extract route information for each leg
          const routeInfos: RouteInfo[] = legs.map((leg: any) => ({
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            distance: leg.distance.text,
            duration: leg.duration.text,
            steps: leg.steps.map((step: any) => ({
              instruction: step.instructions,
              distance: step.distance.text,
              duration: step.duration.text,
            })),
          }))

          // Calculate total distance and duration
          let totalDistanceValue = 0
          let totalDurationValue = 0

          legs.forEach((leg: any) => {
            totalDistanceValue += leg.distance.value
            totalDurationValue += leg.duration.value
          })

          // Format total distance and duration
          const totalDistance = formatDistance(totalDistanceValue)
          const totalDuration = formatDuration(totalDurationValue)

          resolve({
            routes: routeInfos,
            totalDistance,
            totalDuration,
            rawResponse: response,
          })
        } else {
          console.error("Directions API error:", status)
          reject(new Error(`Directions request failed: ${status}`))
        }
      },
    )
  })
}

// Helper function to format distance
function formatDistance(meters: number): string {
  const miles = meters * 0.000621371
  return miles < 0.1 ? `${Math.round(miles * 5280)} ft` : `${miles.toFixed(1)} mi`
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours} hr ${minutes} min`
  } else {
    return `${minutes} min`
  }
}

// Helper function to render directions on a map
export function renderDirectionsOnMap(
  map: google.maps.Map,
  directionsResult: any,
  options: {
    suppressMarkers?: boolean
    polylineOptions?: google.maps.PolylineOptions
  } = {},
): google.maps.DirectionsRenderer {
  const directionsRenderer = new window.google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: options.suppressMarkers || false,
    polylineOptions: options.polylineOptions || {
      strokeColor: "#4285F4",
      strokeWeight: 5,
      strokeOpacity: 0.7,
    },
  })

  directionsRenderer.setDirections(directionsResult)
  return directionsRenderer
}
