import type { User } from "@/contexts/user-context"

export interface SavedListItem {
  name: string
  quantity: number
  price?: number
}

export interface SavedList {
  id: string
  name: string
  userId: string
  items: SavedListItem[]
  location: string
  createdAt: string
  totalCost: number
}

// In a real app, this would be an API call to a database
// For demo purposes, we'll use localStorage
export const savedListsService = {
  getSavedLists: (user: User): SavedList[] => {
    try {
      const savedListsJson = localStorage.getItem(`savedLists-${user.id}`)
      return savedListsJson ? JSON.parse(savedListsJson) : []
    } catch (error) {
      console.error("Failed to get saved lists:", error)
      return []
    }
  },

  getSavedListById: (user: User, listId: string): SavedList | null => {
    try {
      const savedLists = savedListsService.getSavedLists(user)
      return savedLists.find((list) => list.id === listId) || null
    } catch (error) {
      console.error("Failed to get saved list:", error)
      return null
    }
  },

  saveList: (user: User, listName: string, items: any[], location: string, totalCost = 0): SavedList => {
    try {
      const savedLists = savedListsService.getSavedLists(user)

      // Calculate total cost if not provided
      let calculatedTotalCost = totalCost
      if (totalCost === 0 && items.length > 0) {
        calculatedTotalCost = items.reduce((sum, item) => {
          const itemCost = (item.price || 0) * (item.quantity || 1)
          return sum + itemCost
        }, 0)
      }

      const newList: SavedList = {
        id: `list-${Date.now()}`,
        name: listName,
        userId: user.id,
        items,
        location,
        createdAt: new Date().toISOString(),
        totalCost: calculatedTotalCost,
      }

      savedLists.push(newList)
      localStorage.setItem(`savedLists-${user.id}`, JSON.stringify(savedLists))

      return newList
    } catch (error) {
      console.error("Failed to save list:", error)
      throw error
    }
  },

  deleteList: (user: User, listId: string): void => {
    try {
      const savedLists = savedListsService.getSavedLists(user)
      const updatedLists = savedLists.filter((list) => list.id !== listId)
      localStorage.setItem(`savedLists-${user.id}`, JSON.stringify(updatedLists))
    } catch (error) {
      console.error("Failed to delete list:", error)
      throw error
    }
  },
}
