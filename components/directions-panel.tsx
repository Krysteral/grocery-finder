"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, FootprintsIcon as Walking, Clock, Navigation, Printer } from "lucide-react"
import type { RouteInfo } from "@/lib/directions"

// Declare google variable to avoid undefined error.
declare global {
  interface Window {
    google: any
  }
}

interface DirectionsPanelProps {
  routes: RouteInfo[]
  totalDistance: string
  totalDuration: string
  onChangeTravelMode: (mode: any) => void
  onClose: () => void
  currentTravelMode?: string
  loading?: boolean
}

export function DirectionsPanel({
  routes,
  totalDistance,
  totalDuration,
  onChangeTravelMode,
  onClose,
  currentTravelMode = "DRIVING",
  loading = false,
}: DirectionsPanelProps) {
  const [travelMode, setTravelMode] = useState<string>(currentTravelMode)

  // Update local state when prop changes
  useEffect(() => {
    setTravelMode(currentTravelMode)
  }, [currentTravelMode])

  const handleTravelModeChange = (mode: string) => {
    setTravelMode(mode)
    // Make sure window.google is available before accessing it
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      onChangeTravelMode(window.google.maps.TravelMode[mode])
    }
  }

  const handlePrintDirections = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Directions</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
          h1 { font-size: 24px; margin-bottom: 16px; }
          h2 { font-size: 18px; margin-top: 24px; margin-bottom: 8px; }
          .leg { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #eee; }
          .step { margin-bottom: 12px; padding-left: 24px; position: relative; }
          .step:before { content: "•"; position: absolute; left: 8px; }
          .summary { margin-top: 32px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Driving Directions</h1>
        ${routes
          .map(
            (route, i) => `
          <div class="leg">
            <h2>Leg ${i + 1}: ${route.startAddress} to ${route.endAddress}</h2>
            <div>Distance: ${route.distance} • Duration: ${route.duration}</div>
            <div>
              ${route.steps
                .map(
                  (step) => `
                <div class="step">
                  <div>${step.instruction}</div>
                  <div>${step.distance} • ${step.duration}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `,
          )
          .join("")}
        <div class="summary">
          <div>Total Distance: ${totalDistance}</div>
          <div>Total Duration: ${totalDuration}</div>
        </div>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(content)
    printWindow.document.close()

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  return (
    <Card className="w-full overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Directions</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrintDirections}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant={travelMode === "DRIVING" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTravelModeChange("DRIVING")}
          >
            <Car className="h-4 w-4 mr-2" />
            Driving
          </Button>
          <Button
            variant={travelMode === "WALKING" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTravelModeChange("WALKING")}
          >
            <Walking className="h-4 w-4 mr-2" />
            Walking
          </Button>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <div className="flex items-center">
            <Navigation className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{totalDistance}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{totalDuration}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0 max-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading directions...</span>
          </div>
        ) : (
          <div className="p-4">
            {routes.map((route, routeIndex) => (
              <div key={routeIndex} className="mb-6 last:mb-0">
                <div className="flex items-center mb-2">
                  <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                    {routeIndex + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{route.startAddress}</div>
                    <div className="text-xs text-muted-foreground">to</div>
                    <div className="text-sm font-medium">{route.endAddress}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{route.distance}</div>
                    <div className="text-xs text-muted-foreground">{route.duration}</div>
                  </div>
                </div>

                <div className="ml-8 border-l pl-4 space-y-3">
                  {route.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="relative">
                      <div className="absolute -left-[17px] top-1 w-3 h-3 bg-muted rounded-full border-2 border-background"></div>
                      <div className="text-sm" dangerouslySetInnerHTML={{ __html: step.instruction }} />
                      <div className="text-xs text-muted-foreground">
                        {step.distance} • {step.duration}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
