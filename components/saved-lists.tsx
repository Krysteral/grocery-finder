"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/user-context"
import { savedListsService, type SavedList } from "@/lib/saved-lists-service"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Trash2, ShoppingBag } from "lucide-react"

export function SavedLists() {
  const [savedLists, setSavedLists] = useState<SavedList[]>([])
  const { user } = useUser()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      const lists = savedListsService.getSavedLists(user)
      setSavedLists(lists)
    } else {
      setSavedLists([])
    }
  }, [user])

  const handleDeleteList = (listId: string) => {
    if (!user) return

    try {
      savedListsService.deleteList(user, listId)
      setSavedLists(savedLists.filter((list) => list.id !== listId))
      toast({
        title: "Success",
        description: "Shopping list deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete shopping list",
        variant: "destructive",
      })
    }
  }

  const handleLoadList = (list: SavedList) => {
    // Add items and location to URL
    const params = new URLSearchParams()
    params.set("location", list.location)
    params.set("items", JSON.stringify(list.items))
    router.push(`?${params.toString()}`)
    router.refresh()

    toast({
      title: "Success",
      description: "Shopping list loaded successfully",
    })
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Shopping Lists</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Please log in to view your saved shopping lists</p>
        </CardContent>
      </Card>
    )
  }

  if (savedLists.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Shopping Lists</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">You don't have any saved shopping lists yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Shopping Lists</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {savedLists.map((list) => (
            <div key={list.id} className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <h3 className="font-medium">{list.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {list.items.length} items • {new Date(list.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleLoadList(list)}>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Load
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDeleteList(list.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
