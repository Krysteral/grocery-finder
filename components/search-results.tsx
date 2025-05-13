"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Check,
  X,
  MapPin,
  Store,
  Printer,
  AlertCircle,
  Clock,
  Fuel,
  Car,
  Save,
  ChevronDown,
  ChevronUp,
  Navigation,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { searchItemsInStores, findCheapestStore, findCheapestCombination } from "@/lib/api"
import { Button } from "@/components/ui/button"
import PrintableShoppingList from "./printable-shopping-list"
import { Separator } from "@/components/ui/separator"
import { useUser } from "@/contexts/user-context"
import { AuthDialog } from "./auth/auth-dialog"
import { SaveListDialog } from "./save-list-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { groceryItems } from "@/lib/grocery-items"

interface ItemResult {
  itemName: string
  quantity: number
  stores: {
    storeId: string
    storeName: string
    available: boolean
    price?: number
  }[]
}

interface CheapestStoreResult {
  storeId: string
  storeName: string
  storeAddress: string
  totalCost: number
  items: {
    name: string
    quantity: number
    price: number
    subtotal: number
    available: boolean
    unit?: string
  }[]
  distanceFromUser: number
  travelTime: string
  gasCost: number
}

interface CheapestCombinationResult {
  totalCost: number
  stores: {
    storeId: string
    storeName: string
    storeAddress: string
    items: {
      name: string
      quantity: number
      price: number
      subtotal: number
      unit?: string
    }[]
    subtotal: number
    distanceFromUser: number
    travelTime: string
    gasCost: number
  }[]
  unavailableItems: {
    name: string
    quantity: number
    quantity: number
  }[]
  travelInfo: {
    totalDistance: number
    totalTravelTime: string
    totalGasCost: number
  }
}

export function SearchResults() {
  // Function to generate a random tax rate between 5-9%
  const getRandomTaxRate = () => {
    return (Math.floor(Math.random() * 5) + 5) / 100 // Random between 0.05 (5%) and 0.09 (9%)
  }
  const [taxRate, setTaxRate] = useState(getRandomTaxRate())
  const searchParams = useSearchParams()
  const location = searchParams.get("location")
  const itemsParam = searchParams.get("items")
  const [results, setResults] = useState<ItemResult[]>([])
  const [cheapestStore, setCheapestStore] = useState<CheapestStoreResult | null>(null)
  const [cheapestCombination, setCheapestCombination] = useState<CheapestCombinationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPrintableList, setShowPrintableList] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all-results")
  const [printData, setPrintData] = useState<any>(null)
  const { user } = useUser()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [saveListDialogOpen, setSaveListDialogOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Helper function to toggle item expansion
  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  // Helper function to combine duplicate items
  const combineItemsByName = (items: any[]) => {
    if (!items || !Array.isArray(items)) return []

    const combinedItemsMap = new Map()

    items.forEach((item) => {
      const itemName = item.name.toLowerCase()

      if (combinedItemsMap.has(itemName)) {
        // If item with same name exists, add quantities
        const existingItem = combinedItemsMap.get(itemName)
        existingItem.quantity += item.quantity

        // If the item has a price, update the subtotal
        if (existingItem.price && item.price) {
          existingItem.subtotal = existingItem.price * existingItem.quantity
        }
      } else {
        // Otherwise add as new item
        const newItem = { ...item }

        // Calculate subtotal if price exists
        if (newItem.price) {
          newItem.subtotal = newItem.price * newItem.quantity
        }

        combinedItemsMap.set(itemName, newItem)
      }
    })

    return Array.from(combinedItemsMap.values())
  }

  // Extract the searchItems function to a new function that takes parameters
  const searchItemsWithData = async (locationValue: string, itemsData: any[]) => {
    if (!locationValue || !itemsData || itemsData.length === 0) return

    try {
      setLoading(true)
      setError(null)

      // Get all search results
      try {
        const searchResults = await searchItemsInStores(locationValue, itemsData, 100)
        setResults(searchResults)
      } catch (searchError) {
        console.error("Failed to search items in stores:", searchError)
        setError("There was an error searching for items in stores.")
      }

      // Find cheapest single store
      try {
        const cheapestStoreResult = await findCheapestStore(locationValue, combineItemsByName(itemsData), 100)
        setCheapestStore(cheapestStoreResult)
      } catch (storeError) {
        console.error("Failed to find cheapest store:", storeError)
        // Don't set error here, just leave cheapestStore as null
      }

      // Find cheapest combination of stores
      try {
        const cheapestCombinationResult = await findCheapestCombination(
          locationValue,
          combineItemsByName(itemsData),
          100,
        )
        setCheapestCombination(cheapestCombinationResult)
      } catch (combinationError) {
        console.error("Failed to find cheapest combination:", combinationError)
        // Don't set error here, just leave cheapestCombination as null
      }
    } catch (error) {
      console.error("Failed to search items:", error)
      setError("There was an error searching for items. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Update the existing useEffect to use the extracted function
  useEffect(() => {
    if (location && itemsParam) {
      try {
        const items = JSON.parse(itemsParam)
        searchItemsWithData(location, items)
        // Set a new random tax rate when searching
        setTaxRate(getRandomTaxRate())
      } catch (parseError) {
        console.error("Failed to parse items parameter:", parseError)
        setError("Invalid items parameter. Please try adding items again.")
      }
    }
  }, [location, itemsParam])

  useEffect(() => {
    const handleShoppingListUpdate = (event: any) => {
      // When shopping list is updated, search items again
      const newItems = event.detail.items
      const newLocation = event.detail.location

      if (newItems && newItems.length > 0 && newLocation) {
        searchItemsWithData(newLocation, newItems)
      }
    }

    // Listen for the custom event
    window.addEventListener("shoppingListUpdated", handleShoppingListUpdate)

    // Clean up
    return () => {
      window.removeEventListener("shoppingListUpdated", handleShoppingListUpdate)
    }
  }, [])

  useEffect(() => {
    const handleSearchReset = () => {
      // Clear search results when search is reset
      setResults([])
      setCheapestStore(null)
      setCheapestCombination(null)
      setError(null)
    }

    // Listen for the custom event
    window.addEventListener("searchReset", handleSearchReset)

    // Clean up
    return () => {
      window.removeEventListener("searchReset", handleSearchReset)
    }
  }, [])

  const handlePrintSingleStore = () => {
    if (!cheapestStore) return

    const itemCost = cheapestStore.totalCost
    const taxCost = itemCost * taxRate
    const gasCost = cheapestStore.gasCost * 2
    const totalWithTaxAndGas = itemCost + taxCost + gasCost

    // Format the single store data to match the expected format for PrintableShoppingList
    const singleStorePrintData = {
      storeGroups: [
        {
          storeId: cheapestStore.storeId,
          storeName: cheapestStore.storeName,
          storeAddress: cheapestStore.storeAddress,
          items: cheapestStore.items
            .filter((item) => item.available)
            .map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
            })),
          subtotal: cheapestStore.totalCost,
          distanceFromUser: cheapestStore.distanceFromUser,
          travelTime: cheapestStore.travelTime,
          gasCost: cheapestStore.gasCost,
          taxCost: taxCost,
        },
      ],
      totalCost: itemCost,
      taxCost: taxCost,
      totalWithGas: totalWithTaxAndGas,
      travelInfo: {
        totalDistance: cheapestStore.distanceFromUser * 2, // Round trip
        totalTravelTime: cheapestStore.travelTime,
        totalGasCost: gasCost,
      },
    }

    setPrintData(singleStorePrintData)
    setShowPrintableList(true)
  }

  const handlePrintMultiStore = () => {
    if (!cheapestCombination) return

    const itemCost = cheapestCombination.totalCost
    const taxCost = itemCost * taxRate
    const gasCost = cheapestCombination.travelInfo.totalGasCost
    const totalWithTaxAndGas = itemCost + taxCost + gasCost

    const multiStorePrintData = {
      storeGroups: cheapestCombination.stores,
      totalCost: itemCost,
      taxCost: taxCost,
      totalWithGas: totalWithTaxAndGas,
      travelInfo: cheapestCombination.travelInfo,
    }

    setPrintData(multiStorePrintData)
    setShowPrintableList(true)
  }

  const handleSaveList = () => {
    if (!user) {
      setAuthDialogOpen(true)
      return
    }

    // Get the total cost based on the active tab
    let totalCost = 0
    if (activeTab === "cheapest-store" && cheapestStore) {
      totalCost = cheapestStore.totalCost
    } else if (activeTab === "cheapest-combination" && cheapestCombination) {
      totalCost = cheapestCombination.totalCost
    }

    setSaveListDialogOpen(true)
  }

  const getItemsFromActiveTab = () => {
    if (!itemsParam) return []

    try {
      const parsedItems = JSON.parse(itemsParam)

      // If we're on the cheapest store tab and have price data, add it to the items
      if (activeTab === "cheapest-store" && cheapestStore) {
        const itemsWithPrices = cheapestStore.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit,
        }))

        return combineItemsByName(itemsWithPrices)
      }

      // If we're on the cheapest combination tab, add price data from all stores
      if (activeTab === "cheapest-combination" && cheapestCombination) {
        const itemsWithPrices = []
        cheapestCombination.stores.forEach((store) => {
          store.items.forEach((item) => {
            itemsWithPrices.push({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              storeName: store.storeName,
              unit: item.unit,
            })
          })
        })

        return combineItemsByName(itemsWithPrices)
      }

      return combineItemsByName(parsedItems)
    } catch {
      return []
    }
  }

  if (!itemsParam) {
    return (
      <div className="p-6 border rounded-lg text-center text-muted-foreground">
        Add items to your shopping list and click "Find Items"
      </div>
    )
  }

  if (loading) {
    return <div className="p-4 border rounded-lg animate-pulse bg-muted/50">Searching for your items...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (results.length === 0) {
    return (
      <div className="p-6 border rounded-lg text-center text-muted-foreground">
        No results found. Try different items or a different location.
      </div>
    )
  }

  // If showing printable list, render that instead of tabs
  if (showPrintableList && printData) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowPrintableList(false)} className="mb-4">
          ← Back to Results
        </Button>
        <PrintableShoppingList
          storeGroups={printData.storeGroups}
          totalCost={printData.totalCost}
          travelInfo={printData.travelInfo}
          totalWithGas={printData.totalWithGas}
          taxCost={printData.taxCost}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all-results" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-results">All Results</TabsTrigger>
          <TabsTrigger value="cheapest-store">Single Store</TabsTrigger>
          <TabsTrigger value="cheapest-combination">Multi-Store</TabsTrigger>
        </TabsList>

        <TabsContent value="all-results" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Item Availability</CardTitle>
              <CardDescription>
                Showing availability and prices for {results.length} items across all stores
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="p-3">
                          <Collapsible
                            open={expandedItems[result.itemName]}
                            onOpenChange={() => toggleItemExpansion(result.itemName)}
                          >
                            <CollapsibleTrigger className="flex w-full justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{result.itemName}</span>
                                <span className="text-xs text-muted-foreground">Qty: {result.quantity}</span>
                              </div>
                              {expandedItems[result.itemName] ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="mt-2 space-y-1 pl-4">
                                {result.stores.map((store, storeIndex) => (
                                  <div key={storeIndex} className="flex justify-between items-center py-1 text-sm">
                                    <div className="flex items-center gap-2">
                                      {store.available ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <X className="h-4 w-4 text-destructive" />
                                      )}
                                      <span>{store.storeName}</span>
                                    </div>
                                    <div>
                                      {store.available && store.price && (
                                        <Badge variant="outline">${store.price.toFixed(2)}</Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cheapest-store" className="mt-4">
          {cheapestStore ? (
            <Card data-total-cost={cheapestStore.totalCost}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  {cheapestStore.storeName}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {cheapestStore.storeAddress}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Items:</h3>
                  <div className="border rounded-md max-h-[200px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left text-xs font-medium text-muted-foreground">Item Name</th>
                          <th className="p-2 text-left text-xs font-medium text-muted-foreground">Unit</th>
                          <th className="p-2 text-right text-xs font-medium text-muted-foreground">Unit Price</th>
                          <th className="p-2 text-center text-xs font-medium text-muted-foreground">Qty</th>
                          <th className="p-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {combineItemsByName(cheapestStore.items).map((item, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="p-2">
                              <span className="font-medium">{item.name}</span>
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {item.unit ||
                                groceryItems.find(
                                  (gi) => gi.value === item.name.toLowerCase() || gi.label === item.name,
                                )?.unit ||
                                "-"}
                            </td>
                            <td className="p-2 text-right">
                              <span className="text-sm">${item.price.toFixed(2)}</span>
                            </td>
                            <td className="p-2 text-center">
                              <span className="text-sm">{item.quantity}</span>
                            </td>
                            <td className="p-2 text-right">
                              <span className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <div>
                    <span className="font-medium">Item Cost:</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold">${cheapestStore.totalCost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <span className="font-medium">Tax ({(taxRate * 100).toFixed(1)}%):</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">${(cheapestStore.totalCost * taxRate).toFixed(2)}</span>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-2">
                  <h3 className="font-medium">Travel Information:</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border rounded-md p-3 flex flex-col items-center justify-center text-center">
                      <Car className="h-5 w-5 mb-1 text-muted-foreground" />
                      <div className="text-sm font-medium">{cheapestStore.distanceFromUser.toFixed(1)} miles</div>
                      <div className="text-xs text-muted-foreground">from your location</div>
                    </div>
                    <div className="border rounded-md p-3 flex flex-col items-center justify-center text-center">
                      <Clock className="h-5 w-5 mb-1 text-muted-foreground" />
                      <div className="text-sm font-medium">{cheapestStore.travelTime}</div>
                      <div className="text-xs text-muted-foreground">travel time</div>
                    </div>
                    <div className="border rounded-md p-3 flex flex-col items-center justify-center text-center">
                      <Fuel className="h-5 w-5 mb-1 text-muted-foreground" />
                      <div className="text-sm font-medium">${(cheapestStore.gasCost * 2).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">round trip gas cost</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <div>
                    <span className="font-medium">Total Cost:</span>
                    <div className="text-xs text-muted-foreground">Items + Tax + Gas</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold">
                      $
                      {(
                        cheapestStore.totalCost +
                        cheapestStore.totalCost * taxRate +
                        cheapestStore.gasCost * 2
                      ).toFixed(2)}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      ${cheapestStore.totalCost.toFixed(2)} items + ${(cheapestStore.totalCost * taxRate).toFixed(2)}{" "}
                      tax + ${(cheapestStore.gasCost * 2).toFixed(2)} gas
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex-1" onClick={handlePrintSingleStore}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print List
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleSaveList}>
                    <Save className="h-4 w-4 mr-2" />
                    Save List
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 mt-2 sm:mt-0"
                    onClick={() => {
                      // Use the same approach as the Single Store Directions button
                      // This directly updates the state in the parent component
                      if (cheapestStore) {
                        // Create a custom event that matches what store-results.tsx is using
                        const event = new CustomEvent("getDirections", {
                          detail: {
                            storeId: cheapestStore.storeId,
                          },
                        })
                        window.dispatchEvent(event)

                        // Also dispatch a UI event to switch to the map tab if needed
                        const mapEvent = new CustomEvent("switchToMapTab")
                        window.dispatchEvent(mapEvent)
                      }
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-6 border rounded-lg text-center text-muted-foreground">
              No store has all your items available.
            </div>
          )}
        </TabsContent>

        <TabsContent value="cheapest-combination" className="mt-4">
          {cheapestCombination ? (
            <Card data-total-cost={cheapestCombination.totalCost}>
              <CardHeader>
                <CardTitle>Cheapest Multi-Store Option</CardTitle>
                <CardDescription>
                  {(cheapestStore?.totalCost || 0) - cheapestCombination.totalCost > 0 ? (
                    <span className="font-semibold text-green-600">
                      Save ${((cheapestStore?.totalCost || 0) - cheapestCombination.totalCost).toFixed(2)}{" "}
                      <span className="font-normal text-muted-foreground">compared to shopping at a single store</span>
                    </span>
                  ) : (
                    <span>No savings compared to shopping at a single store</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-[300px] overflow-y-auto space-y-3">
                  {cheapestCombination.stores.map((store, storeIndex) => (
                    <div key={storeIndex} className="border rounded-md overflow-hidden">
                      <div className="bg-muted p-2 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{store.storeName}</h3>
                          <p className="text-xs text-muted-foreground">{store.storeAddress}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="inline-flex items-center">
                              <Car className="h-3 w-3 mr-1" />
                              {store.distanceFromUser.toFixed(1)} miles
                            </span>
                            <span className="mx-1">•</span>
                            <span className="inline-flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {store.travelTime}
                            </span>
                          </p>
                        </div>
                        <Badge variant="outline">${store.subtotal.toFixed(2)}</Badge>
                      </div>
                      <div className="max-h-[150px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50 sticky top-0">
                            <tr>
                              <th className="p-2 text-left text-xs font-medium text-muted-foreground">Item Name</th>
                              <th className="p-2 text-left text-xs font-medium text-muted-foreground">Unit</th>
                              <th className="p-2 text-right text-xs font-medium text-muted-foreground">Unit Price</th>
                              <th className="p-2 text-center text-xs font-medium text-muted-foreground">Qty</th>
                              <th className="p-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {combineItemsByName(store.items).map((item, itemIndex) => (
                              <tr key={itemIndex} className="border-b last:border-0">
                                <td className="p-2">
                                  <span>{item.name}</span>
                                </td>
                                <td className="p-2 text-sm text-muted-foreground">
                                  {item.unit ||
                                    groceryItems.find(
                                      (gi) => gi.value === item.name.toLowerCase() || gi.label === item.name,
                                    )?.unit ||
                                    "-"}
                                </td>
                                <td className="p-2 text-right">
                                  <span className="text-sm">${item.price.toFixed(2)}</span>
                                </td>
                                <td className="p-2 text-center">
                                  <span className="text-sm">{item.quantity}</span>
                                </td>
                                <td className="p-2 text-right">
                                  <span className="text-sm font-medium">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                {cheapestCombination.unavailableItems.length > 0 && (
                  <div className="border border-destructive/20 rounded-md p-3 bg-destructive/5">
                    <h3 className="font-medium text-destructive mb-2">Unavailable Items:</h3>
                    <ul className="space-y-1">
                      {cheapestCombination.unavailableItems.map((item, index) => (
                        <li key={index} className="text-sm">
                          {item.name} (Qty: {item.quantity})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between items-center pt-2 border-t">
                  <div>
                    <span className="font-medium">Item Cost:</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold">${cheapestCombination.totalCost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <span className="font-medium">Tax ({(taxRate * 100).toFixed(1)}%):</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">${(cheapestCombination.totalCost * taxRate).toFixed(2)}</span>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-2">
                  <h3 className="font-medium">Travel Information:</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border rounded-md p-3 flex flex-col items-center justify-center text-center">
                      <Car className="h-5 w-5 mb-1 text-muted-foreground" />
                      <div className="text-sm font-medium">
                        {cheapestCombination.travelInfo.totalDistance.toFixed(1)} miles
                      </div>
                      <div className="text-xs text-muted-foreground">total distance</div>
                    </div>
                    <div className="border rounded-md p-3 flex flex-col items-center justify-center text-center">
                      <Clock className="h-5 w-5 mb-1 text-muted-foreground" />
                      <div className="text-sm font-medium">{cheapestCombination.travelInfo.totalTravelTime}</div>
                      <div className="text-xs text-muted-foreground">total travel time</div>
                    </div>
                    <div className="border rounded-md p-3 flex flex-col items-center justify-center text-center">
                      <Fuel className="h-5 w-5 mb-1 text-muted-foreground" />
                      <div className="text-sm font-medium">
                        ${cheapestCombination.travelInfo.totalGasCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">total gas cost</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <div>
                    <span className="font-medium">Total Cost:</span>
                    <div className="text-xs text-muted-foreground">Items + Tax + Gas</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold">
                      $
                      {(
                        cheapestCombination.totalCost +
                        cheapestCombination.totalCost * taxRate +
                        cheapestCombination.travelInfo.totalGasCost
                      ).toFixed(2)}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      ${cheapestCombination.totalCost.toFixed(2)} items + $
                      {(cheapestCombination.totalCost * taxRate).toFixed(2)} tax + $
                      {cheapestCombination.travelInfo.totalGasCost.toFixed(2)} gas
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex-1" onClick={handlePrintMultiStore}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print List
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleSaveList}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Lists
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 mt-2 sm:mt-0"
                    onClick={() => {
                      // Use multi-store directions instead of single store
                      if (cheapestCombination && cheapestCombination.stores.length > 0) {
                        // Get all store IDs from the cheapest combination
                        const storeIds = cheapestCombination.stores.map((store) => store.storeId)

                        console.log("Getting directions to multiple stores:", storeIds)

                        // Create a custom event for multi-store directions
                        const event = new CustomEvent("getMultiStoreDirections", {
                          detail: {
                            storeIds: storeIds,
                            fromSearchResults: true,
                            hideMap: true, // Add this flag to indicate we don't need another map
                          },
                        })
                        window.dispatchEvent(event)

                        // Also dispatch a UI event to switch to the map tab
                        const mapEvent = new CustomEvent("switchToMapTab")
                        window.dispatchEvent(mapEvent)
                      }
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-6 border rounded-lg text-center text-muted-foreground">
              Could not find a combination of stores for your items.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Auth Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={() => setSaveListDialogOpen(true)}
      />

      {/* Save List Dialog */}
      <SaveListDialog
        open={saveListDialogOpen}
        onOpenChange={setSaveListDialogOpen}
        items={getItemsFromActiveTab()}
        location={location || ""}
        totalCost={activeTab === "cheapest-store" ? cheapestStore?.totalCost : cheapestCombination?.totalCost}
      />
    </div>
  )
}
