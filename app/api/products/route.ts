import { NextResponse } from "next/server"
import { groceryItems } from "@/lib/grocery-items"

// Generate mock inventory
function generateMockInventory() {
  const inventory = {}
  const storeIds = ["store1", "store2", "store3", "store4", "store5", "store6", "store7"]

  // For each store
  storeIds.forEach((storeId) => {
    inventory[storeId] = {}

    // For each grocery item
    groceryItems.forEach((item) => {
      // 90% chance of item being available
      const isAvailable = Math.random() < 0.9

      // Generate a random price between $0.99 and $15.99
      const basePrice = (Math.floor(Math.random() * 1500) + 99) / 100

      // Add some price variation between stores (±20%)
      const priceVariation = 0.8 + Math.random() * 0.4 // 0.8 to 1.2
      const price = Math.round(basePrice * priceVariation * 100) / 100

      inventory[storeId][item.value] = {
        available: isAvailable,
        price: isAvailable ? price : 0,
      }
    })
  })

  return inventory
}

// Generate mock inventory once
const mockInventory = generateMockInventory()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get("storeId")
  const productName = searchParams.get("productName")

  if (!storeId || !productName) {
    return NextResponse.json({ error: "Missing storeId or productName" }, { status: 400 })
  }

  // Get product from mock inventory
  const storeInventory = mockInventory[storeId] || {}
  const normalizedProductName = productName.toLowerCase()
  const product = storeInventory[normalizedProductName] || { available: false }

  return NextResponse.json({
    product: {
      available: product.available,
      price: product.price,
      store_id: storeId,
    },
  })
}
