"use client"

import { useState, useEffect } from "react"
import { UserMenu } from "@/components/auth/user-menu"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { NewSearchDialog } from "@/components/new-search-dialog"
import { useSearchParams } from "next/navigation"

export function Header() {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [currentItems, setCurrentItems] = useState<any[]>([])
  const [currentLocation, setCurrentLocation] = useState("")
  const searchParams = useSearchParams()

  // Update current items and location whenever they change in URL
  useEffect(() => {
    const itemsParam = searchParams.get("items")
    const locationParam = searchParams.get("location")

    // Only update items if the parameter exists and is different from current state
    if (itemsParam) {
      try {
        const parsedItems = JSON.parse(itemsParam)
        // Use functional update to avoid dependency on currentItems
        setCurrentItems((prevItems) => {
          // Only update if different
          if (JSON.stringify(prevItems) !== JSON.stringify(parsedItems)) {
            return parsedItems
          }
          return prevItems
        })
      } catch (e) {
        console.error("Failed to parse items from URL:", e)
      }
    } else if (currentItems.length > 0) {
      // Only clear if we have items
      setCurrentItems([])
    }

    // Only update location if different
    if (locationParam !== currentLocation) {
      setCurrentLocation(locationParam || "")
    }
  }, [searchParams, currentLocation])

  const handleNewSearch = () => {
    // Check if there are search results or items in the shopping list
    const hasItems = currentItems.length > 0
    const hasLocation = !!currentLocation

    if (hasItems || hasLocation) {
      // Show confirmation dialog
      setConfirmDialogOpen(true)
    } else {
      // If nothing to clear, just reset
      clearSearchAndList()
    }
  }

  const clearSearchAndList = () => {
    // Clear search results and store results and shopping list
    // Create a new URL with no parameters
    window.history.replaceState({}, "", "/")

    // Clear localStorage
    localStorage.removeItem("groceryItems")

    // Trigger a custom event to notify components that search has been reset
    const event = new CustomEvent("searchReset")
    window.dispatchEvent(event)

    // Trigger a custom event to notify shopping list to clear
    const clearEvent = new CustomEvent("clearShoppingList")
    window.dispatchEvent(clearEvent)
  }

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <Link href="/" className="text-2xl font-bold hover:text-primary transition-colors">
          Grocery Store Finder
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleNewSearch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            New Search
          </Button>
          <div className="flex-shrink-0">
            <UserMenu />
          </div>
        </div>
      </header>

      <NewSearchDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={clearSearchAndList}
        items={currentItems}
        location={currentLocation}
      />
    </>
  )
}
