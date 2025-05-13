// A comprehensive list of grocery items available in our store database
export const groceryItems = [
  // Dairy
  { value: "milk", label: "Milk", category: "Dairy", unit: "gallon", minPrice: 2.99, maxPrice: 5.99 },
  { value: "cheese", label: "Cheese", category: "Dairy", unit: "lb", minPrice: 3.49, maxPrice: 6.49 },
  { value: "yogurt", label: "Yogurt", category: "Dairy", unit: "32 oz", minPrice: 2.99, maxPrice: 5.99 },
  { value: "butter", label: "Butter", category: "Dairy", unit: "lb", minPrice: 3.49, maxPrice: 6.49 },
  { value: "cream", label: "Cream", category: "Dairy", unit: "pint", minPrice: 1.99, maxPrice: 4.99 },
  { value: "sour cream", label: "Sour Cream", category: "Dairy", unit: "16 oz", minPrice: 1.49, maxPrice: 4.49 },
  { value: "cream cheese", label: "Cream Cheese", category: "Dairy", unit: "8 oz", minPrice: 1.99, maxPrice: 4.99 },
  {
    value: "cottage cheese",
    label: "Cottage Cheese",
    category: "Dairy",
    unit: "16 oz",
    minPrice: 2.49,
    maxPrice: 5.49,
  },

  // Produce
  { value: "apples", label: "Apples", category: "Produce", unit: "lb", minPrice: 1.29, maxPrice: 4.29 },
  { value: "bananas", label: "Bananas", category: "Produce", unit: "lb", minPrice: 0.59, maxPrice: 3.59 },
  { value: "oranges", label: "Oranges", category: "Produce", unit: "lb", minPrice: 1.29, maxPrice: 4.29 },
  { value: "grapes", label: "Grapes", category: "Produce", unit: "lb", minPrice: 2.99, maxPrice: 5.99 },
  { value: "strawberries", label: "Strawberries", category: "Produce", unit: "16 oz", minPrice: 2.99, maxPrice: 5.99 },
  { value: "blueberries", label: "Blueberries", category: "Produce", unit: "pint", minPrice: 3.49, maxPrice: 6.49 },
  { value: "lettuce", label: "Lettuce", category: "Produce", unit: "head", minPrice: 1.49, maxPrice: 4.49 },
  { value: "spinach", label: "Spinach", category: "Produce", unit: "10 oz", minPrice: 2.49, maxPrice: 5.49 },
  { value: "tomatoes", label: "Tomatoes", category: "Produce", unit: "lb", minPrice: 1.99, maxPrice: 4.99 },
  { value: "potatoes", label: "Potatoes", category: "Produce", unit: "5 lb bag", minPrice: 3.99, maxPrice: 6.99 },
  { value: "onions", label: "Onions", category: "Produce", unit: "lb", minPrice: 0.99, maxPrice: 3.99 },
  { value: "carrots", label: "Carrots", category: "Produce", unit: "lb", minPrice: 0.99, maxPrice: 3.99 },
  { value: "broccoli", label: "Broccoli", category: "Produce", unit: "bunch", minPrice: 1.99, maxPrice: 4.99 },
  { value: "bell peppers", label: "Bell Peppers", category: "Produce", unit: "each", minPrice: 0.99, maxPrice: 3.99 },
  { value: "cucumbers", label: "Cucumbers", category: "Produce", unit: "each", minPrice: 0.79, maxPrice: 3.79 },
  { value: "avocados", label: "Avocados", category: "Produce", unit: "each", minPrice: 1.29, maxPrice: 4.29 },

  // Meat & Seafood
  { value: "chicken", label: "Chicken", category: "Meat & Seafood", unit: "lb", minPrice: 2.99, maxPrice: 5.99 },
  { value: "beef", label: "Beef", category: "Meat & Seafood", unit: "lb", minPrice: 4.99, maxPrice: 7.99 },
  { value: "pork", label: "Pork", category: "Meat & Seafood", unit: "lb", minPrice: 3.49, maxPrice: 6.49 },
  {
    value: "ground beef",
    label: "Ground Beef",
    category: "Meat & Seafood",
    unit: "lb",
    minPrice: 3.99,
    maxPrice: 6.99,
  },
  { value: "bacon", label: "Bacon", category: "Meat & Seafood", unit: "12 oz", minPrice: 4.99, maxPrice: 7.99 },
  { value: "sausage", label: "Sausage", category: "Meat & Seafood", unit: "lb", minPrice: 3.99, maxPrice: 6.99 },
  { value: "salmon", label: "Salmon", category: "Meat & Seafood", unit: "lb", minPrice: 8.99, maxPrice: 11.99 },
  { value: "tuna", label: "Tuna", category: "Meat & Seafood", unit: "lb", minPrice: 7.99, maxPrice: 10.99 },
  { value: "shrimp", label: "Shrimp", category: "Meat & Seafood", unit: "lb", minPrice: 9.99, maxPrice: 12.99 },

  // Bakery
  { value: "bread", label: "Bread", category: "Bakery", unit: "loaf", minPrice: 2.49, maxPrice: 5.49 },
  { value: "bagels", label: "Bagels", category: "Bakery", unit: "6 pack", minPrice: 3.49, maxPrice: 6.49 },
  { value: "muffins", label: "Muffins", category: "Bakery", unit: "4 pack", minPrice: 3.99, maxPrice: 6.99 },
  { value: "tortillas", label: "Tortillas", category: "Bakery", unit: "10 pack", minPrice: 2.49, maxPrice: 5.49 },
  { value: "rolls", label: "Rolls", category: "Bakery", unit: "8 pack", minPrice: 2.99, maxPrice: 5.99 },
  { value: "cake", label: "Cake", category: "Bakery", unit: "each", minPrice: 12.99, maxPrice: 15.99 },
  { value: "cookies", label: "Cookies", category: "Bakery", unit: "dozen", minPrice: 3.99, maxPrice: 6.99 },
  { value: "pie", label: "Pie", category: "Bakery", unit: "each", minPrice: 7.99, maxPrice: 10.99 },

  // Pantry
  { value: "pasta", label: "Pasta", category: "Pantry", unit: "16 oz", minPrice: 1.29, maxPrice: 4.29 },
  { value: "rice", label: "Rice", category: "Pantry", unit: "2 lb", minPrice: 2.49, maxPrice: 5.49 },
  { value: "cereal", label: "Cereal", category: "Pantry", unit: "18 oz", minPrice: 3.49, maxPrice: 6.49 },
  { value: "flour", label: "Flour", category: "Pantry", unit: "5 lb", minPrice: 2.99, maxPrice: 5.99 },
  { value: "sugar", label: "Sugar", category: "Pantry", unit: "4 lb", minPrice: 2.49, maxPrice: 5.49 },
  { value: "canned soup", label: "Canned Soup", category: "Pantry", unit: "can", minPrice: 1.49, maxPrice: 4.49 },
  { value: "canned beans", label: "Canned Beans", category: "Pantry", unit: "can", minPrice: 0.99, maxPrice: 3.99 },
  {
    value: "canned tomatoes",
    label: "Canned Tomatoes",
    category: "Pantry",
    unit: "can",
    minPrice: 1.29,
    maxPrice: 4.29,
  },
  { value: "canned tuna", label: "Canned Tuna", category: "Pantry", unit: "can", minPrice: 1.49, maxPrice: 4.49 },
  { value: "peanut butter", label: "Peanut Butter", category: "Pantry", unit: "16 oz", minPrice: 2.99, maxPrice: 5.99 },
  { value: "jelly", label: "Jelly", category: "Pantry", unit: "12 oz", minPrice: 2.49, maxPrice: 5.49 },
  { value: "honey", label: "Honey", category: "Pantry", unit: "12 oz", minPrice: 4.99, maxPrice: 7.99 },
  { value: "olive oil", label: "Olive Oil", category: "Pantry", unit: "16 oz", minPrice: 7.99, maxPrice: 10.99 },
  { value: "vegetable oil", label: "Vegetable Oil", category: "Pantry", unit: "32 oz", minPrice: 2.99, maxPrice: 5.99 },
  { value: "vinegar", label: "Vinegar", category: "Pantry", unit: "16 oz", minPrice: 1.99, maxPrice: 4.99 },
  { value: "ketchup", label: "Ketchup", category: "Pantry", unit: "20 oz", minPrice: 2.49, maxPrice: 5.49 },
  { value: "mustard", label: "Mustard", category: "Pantry", unit: "8 oz", minPrice: 1.49, maxPrice: 4.49 },
  { value: "mayonnaise", label: "Mayonnaise", category: "Pantry", unit: "30 oz", minPrice: 3.99, maxPrice: 6.99 },
  { value: "salsa", label: "Salsa", category: "Pantry", unit: "16 oz", minPrice: 2.99, maxPrice: 5.99 },
  { value: "soy sauce", label: "Soy Sauce", category: "Pantry", unit: "10 oz", minPrice: 2.49, maxPrice: 5.49 },

  // Beverages
  { value: "water", label: "Water", category: "Beverages", unit: "24 pack", minPrice: 3.99, maxPrice: 6.99 },
  { value: "milk", label: "Milk", category: "Beverages", unit: "gallon", minPrice: 2.99, maxPrice: 5.99 },
  { value: "juice", label: "Juice", category: "Beverages", unit: "64 oz", minPrice: 2.99, maxPrice: 5.99 },
  { value: "soda", label: "Soda", category: "Beverages", unit: "12 pack", minPrice: 4.99, maxPrice: 7.99 },
  { value: "coffee", label: "Coffee", category: "Beverages", unit: "12 oz", minPrice: 6.99, maxPrice: 9.99 },
  { value: "tea", label: "Tea", category: "Beverages", unit: "20 bags", minPrice: 3.49, maxPrice: 6.49 },
  { value: "beer", label: "Beer", category: "Beverages", unit: "6 pack", minPrice: 8.99, maxPrice: 11.99 },
  { value: "wine", label: "Wine", category: "Beverages", unit: "bottle", minPrice: 9.99, maxPrice: 12.99 },

  // Frozen
  { value: "ice cream", label: "Ice Cream", category: "Frozen", unit: "half gallon", minPrice: 4.49, maxPrice: 7.49 },
  { value: "frozen pizza", label: "Frozen Pizza", category: "Frozen", unit: "each", minPrice: 4.99, maxPrice: 7.99 },
  {
    value: "frozen vegetables",
    label: "Frozen Vegetables",
    category: "Frozen",
    unit: "16 oz",
    minPrice: 1.99,
    maxPrice: 4.99,
  },
  { value: "frozen fruit", label: "Frozen Fruit", category: "Frozen", unit: "16 oz", minPrice: 2.99, maxPrice: 5.99 },
  { value: "frozen meals", label: "Frozen Meals", category: "Frozen", unit: "each", minPrice: 3.49, maxPrice: 6.49 },
  {
    value: "frozen waffles",
    label: "Frozen Waffles",
    category: "Frozen",
    unit: "10 pack",
    minPrice: 2.99,
    maxPrice: 5.99,
  },

  // Snacks
  { value: "chips", label: "Chips", category: "Snacks", unit: "family size", minPrice: 3.49, maxPrice: 6.49 },
  { value: "pretzels", label: "Pretzels", category: "Snacks", unit: "16 oz", minPrice: 2.99, maxPrice: 5.99 },
  { value: "popcorn", label: "Popcorn", category: "Snacks", unit: "6 pack", minPrice: 3.49, maxPrice: 6.49 },
  { value: "crackers", label: "Crackers", category: "Snacks", unit: "box", minPrice: 2.99, maxPrice: 5.99 },
  { value: "nuts", label: "Nuts", category: "Snacks", unit: "16 oz", minPrice: 6.99, maxPrice: 9.99 },
  { value: "granola bars", label: "Granola Bars", category: "Snacks", unit: "8 pack", minPrice: 3.49, maxPrice: 6.49 },
  { value: "chocolate", label: "Chocolate", category: "Snacks", unit: "bar", minPrice: 1.49, maxPrice: 4.49 },
  { value: "candy", label: "Candy", category: "Snacks", unit: "bag", minPrice: 2.49, maxPrice: 5.49 },

  // Household
  {
    value: "paper towels",
    label: "Paper Towels",
    category: "Household",
    unit: "6 rolls",
    minPrice: 7.99,
    maxPrice: 10.99,
  },
  {
    value: "toilet paper",
    label: "Toilet Paper",
    category: "Household",
    unit: "12 rolls",
    minPrice: 8.99,
    maxPrice: 11.99,
  },
  { value: "dish soap", label: "Dish Soap", category: "Household", unit: "25 oz", minPrice: 2.99, maxPrice: 5.99 },
  {
    value: "laundry detergent",
    label: "Laundry Detergent",
    category: "Household",
    unit: "100 oz",
    minPrice: 9.99,
    maxPrice: 12.99,
  },
  {
    value: "trash bags",
    label: "Trash Bags",
    category: "Household",
    unit: "30 count",
    minPrice: 7.99,
    maxPrice: 10.99,
  },
  {
    value: "aluminum foil",
    label: "Aluminum Foil",
    category: "Household",
    unit: "75 sq ft",
    minPrice: 3.99,
    maxPrice: 6.99,
  },
  {
    value: "plastic wrap",
    label: "Plastic Wrap",
    category: "Household",
    unit: "100 sq ft",
    minPrice: 3.49,
    maxPrice: 6.49,
  },
  {
    value: "sandwich bags",
    label: "Sandwich Bags",
    category: "Household",
    unit: "100 count",
    minPrice: 3.99,
    maxPrice: 6.99,
  },

  // Eggs (separate category for the common item)
  { value: "eggs", label: "Eggs", category: "Dairy", unit: "dozen", minPrice: 2.49, maxPrice: 5.49 },
]

// Function to get all available items from the database
export function getAllAvailableItems() {
  return groceryItems
}

// Function to get items by category
export function getItemsByCategory(category: string) {
  return groceryItems.filter((item) => item.category === category)
}

// Function to get all categories
export function getAllCategories() {
  const categories = new Set(groceryItems.map((item) => item.category))
  return Array.from(categories)
}

// Function to check if an item is available in our database
export function isItemAvailable(itemName: string): boolean {
  const normalizedName = itemName.toLowerCase().trim()
  return groceryItems.some((item) => item.value === normalizedName || item.label.toLowerCase() === normalizedName)
}
