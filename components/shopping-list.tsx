"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { groceryItems, getAllCategories, isItemAvailable } from "@/lib/grocery-items"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Update the ShoppingItem interface to include unit

interface ShoppingItem {
  id: string
  name: string
  quantity: number
  unit?: string
}

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [newItem, setNewItem] = useState("")
  const [newQuantity, setNewQuantity] = useState(1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [itemNotFound, setItemNotFound] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const categories = getAllCategories()

  // Close suggestions when clicking outside
  useEffect(() => {
    // Load items from localStorage on component mount
    const storedItems = localStorage.getItem("groceryItems")
    if (storedItems) {
      try {
        const parsedItems = JSON.parse(storedItems)
        setItems(parsedItems)
      } catch (e) {
        console.error("Failed to parse items from localStorage:", e)
      }
    }

    // Also check URL parameters
    const itemsParam = searchParams.get("items")
    if (itemsParam) {
      try {
        const parsedItems = JSON.parse(itemsParam)
        setItems(parsedItems)
      } catch (e) {
        console.error("Failed to parse items from URL:", e)
      }
    }
  }, [])

  useEffect(() => {
    const handleShoppingListUpdate = (event: any) => {
      const updatedItems = event.detail.items
      if (updatedItems && Array.isArray(updatedItems)) {
        console.log("Shopping list updated from event:", updatedItems)
        setItems(updatedItems)
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

  // Add a new useEffect to listen for the clearShoppingList event
  // Add this after the other useEffect hooks

  useEffect(() => {
    const handleClearShoppingList = () => {
      // Clear the shopping list
      setItems([])
      setNewItem("")
      setNewQuantity(1)
    }

    // Listen for the custom event
    window.addEventListener("clearShoppingList", handleClearShoppingList)

    // Clean up
    return () => {
      window.removeEventListener("clearShoppingList", handleClearShoppingList)
    }
  }, [])

  const addItem = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newItem.trim()) {
      toast({
        title: "Error",
        description: "Please enter an item name",
        variant: "destructive",
      })
      return
    }

    // Check if the item is available in our database
    if (!isItemAvailable(newItem.trim())) {
      setItemNotFound(true)
      return
    }

    // Validate quantity
    if (newQuantity <= 0 || !Number.isInteger(newQuantity) || newQuantity > 100) {
      toast({
        title: "Invalid Input",
        description: "Please enter a positive whole number between 1 and 100 for quantity.",
        variant: "destructive",
      })
      return
    }

    setItemNotFound(false)

    // Find the item in the grocery items to get its unit
    const groceryItem = groceryItems.find(
      (item) =>
        item.label.toLowerCase() === newItem.trim().toLowerCase() ||
        item.value.toLowerCase() === newItem.trim().toLowerCase(),
    )

    const item: ShoppingItem = {
      id: Date.now().toString(),
      name: newItem.trim(),
      quantity: newQuantity,
      unit: groceryItem?.unit || "",
    }

    setItems([...items, item])
    setNewItem("")
    setNewQuantity(1)
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const adjustQuantity = (id: string, adjustment: number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(1, Math.min(100, item.quantity + adjustment))
          return { ...item, quantity: newQuantity }
        }
        return item
      }),
    )
  }

  const handleSearch = () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to your shopping list first",
        variant: "destructive",
      })
      return
    }

    const location = searchParams.get("location")
    if (!location) {
      toast({
        title: "Error",
        description: "Please enter a location first",
        variant: "destructive",
      })
      return
    }

    // Update URL params without refreshing the page
    const params = new URLSearchParams(window.location.search)
    params.set("items", JSON.stringify(combinedItems))

    // Use history.replaceState to update URL without navigation
    window.history.replaceState({}, "", `?${params.toString()}`)

    // Store items in localStorage for persistence
    localStorage.setItem("groceryItems", JSON.stringify(combinedItems))

    // Trigger a custom event to notify other components that items have been updated
    const event = new CustomEvent("shoppingListUpdated", {
      detail: { items: combinedItems, location },
    })
    window.dispatchEvent(event)

    toast({
      title: "Success",
      description: "Searching for your items...",
    })
  }

  const handleItemSelect = (selectedItem: string) => {
    setNewItem(selectedItem)
    setItemNotFound(false)
    setShowSuggestions(false)
  }

  // Filter grocery items based on user input
  const getFilteredItemsByCategory = () => {
    const searchTerm = newItem.toLowerCase()
    const result = {}

    categories.forEach((category) => {
      const filteredItems = groceryItems.filter(
        (item) =>
          item.category === category &&
          (item.label.toLowerCase().includes(searchTerm) || item.value.toLowerCase().includes(searchTerm)),
      )

      if (filteredItems.length > 0) {
        result[category] = filteredItems
      }
    })

    return result
  }

  const filteredItemsByCategory = getFilteredItemsByCategory()
  const hasResults = Object.keys(filteredItemsByCategory).length > 0

  // Combine duplicate items by name
  const combinedItems = items.reduce((acc: ShoppingItem[], item) => {
    const existingItem = acc.find((i) => i.name.toLowerCase() === item.name.toLowerCase())

    if (existingItem) {
      // If item with same name exists, add quantities
      existingItem.quantity += item.quantity
    } else {
      // Otherwise add as new item
      acc.push({ ...item })
    }

    return acc
  }, [])

  const getTotalCostFromSearchResults = () => {
    // Try to get the total cost from the search results
    const searchResultsElement = document.querySelector("[data-total-cost]")
    if (searchResultsElement) {
      const totalCost = searchResultsElement.getAttribute("data-total-cost")
      return totalCost ? Number.parseFloat(totalCost) : 0
    }
    return 0
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addItem} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="item-name">Item Name & Quantity</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="item-name"
                placeholder="e.g., Milk, Bread, Eggs"
                value={newItem}
                onChange={(e) => {
                  setNewItem(e.target.value)
                  setItemNotFound(false)
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full"
                autoComplete="off"
                ref={inputRef}
              />
              {showSuggestions && newItem.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {hasResults ? (
                    <div>
                      {Object.entries(filteredItemsByCategory).map(([category, items]) => (
                        <div key={category}>
                          <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted">{category}</div>
                          <ul className="py-1">
                            {items.map((item: any) => (
                              <li
                                key={item.value}
                                className="px-4 py-2 hover:bg-muted cursor-pointer"
                                onClick={() => handleItemSelect(item.label)}
                              >
                                {item.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      No matching items found in our database
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center border rounded-md w-32">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-r-none"
                onClick={() => setNewQuantity(Math.max(1, newQuantity - 1))}
                disabled={newQuantity <= 1}
              >
                <span className="text-lg">-</span>
                <span className="sr-only">Decrease quantity</span>
              </Button>
              <Input
                id="quantity"
                type="text"
                inputMode="numeric"
                value={newQuantity === 0 ? "" : newQuantity}
                onChange={(e) => {
                  const value = e.target.value

                  // Allow empty input
                  if (value === "") {
                    setNewQuantity(0)
                    return
                  }

                  // Only allow numeric input
                  if (!/^\d+$/.test(value)) {
                    return
                  }

                  const numValue = Number.parseInt(value, 10)

                  // Check if the value is within limits
                  if (numValue > 100) {
                    toast({
                      title: "Invalid Input",
                      description: "Quantity cannot exceed 100 units.",
                      variant: "destructive",
                    })
                    return
                  }

                  setNewQuantity(numValue)
                }}
                className="h-10 w-12 text-center border-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-l-none"
                onClick={() => setNewQuantity(newQuantity + 1)}
              >
                <span className="text-lg">+</span>
                <span className="sr-only">Increase quantity</span>
              </Button>
            </div>
          </div>
        </div>

        {itemNotFound && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              "{newItem}" is not available in our store database. Please select an item from the suggestions.
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </form>

      {combinedItems.length > 0 ? (
        <div className="space-y-4">
          <div className="border rounded-lg divide-y">
            {combinedItems.map((item) => (
              <div key={item.id} className="p-3 flex justify-between items-center">
                <div>
                  <span className="font-medium">{item.name}</span>
                  {item.unit && <span className="ml-1 text-xs text-muted-foreground">({item.unit})</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-r-none"
                      onClick={() => adjustQuantity(item.id, -1)}
                      disabled={item.quantity <= 1}
                    >
                      <span className="text-lg">-</span>
                      <span className="sr-only">Decrease quantity</span>
                    </Button>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={item.quantity === 0 ? "" : item.quantity}
                      onChange={(e) => {
                        const value = e.target.value

                        // Allow empty input
                        if (value === "") {
                          setItems(items.map((i) => (i.id === item.id ? { ...i, quantity: 0 } : i)))
                          return
                        }

                        // Only allow numeric input
                        if (!/^\d+$/.test(value)) {
                          return
                        }

                        const numValue = Number.parseInt(value, 10)

                        // Check if the value is within limits
                        if (numValue > 100) {
                          toast({
                            title: "Invalid Input",
                            description: "Quantity cannot exceed 100 units.",
                            variant: "destructive",
                          })
                          return
                        } else {
                          setItems(items.map((i) => (i.id === item.id ? { ...i, quantity: numValue } : i)))
                        }
                      }}
                      className="h-8 w-8 text-center border-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-l-none"
                      onClick={() => {
                        if (item.quantity >= 100) {
                          toast({
                            title: "Invalid Input",
                            description: "Quantity cannot exceed 100 units.",
                            variant: "destructive",
                          })
                          return
                        }
                        adjustQuantity(item.id, 1)
                      }}
                    >
                      <span className="text-lg">+</span>
                      <span className="sr-only">Increase quantity</span>
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Remove {item.name}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSearch} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            Find Items
          </Button>
        </div>
      ) : (
        <div className="p-6 border rounded-lg text-center text-muted-foreground">Your shopping list is empty</div>
      )}
    </div>
  )
}
