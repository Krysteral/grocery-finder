"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { useUser } from "@/contexts/user-context"
import { savedListsService, type SavedList } from "@/lib/saved-lists-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SavedListsPage() {
  const [savedLists, setSavedLists] = useState<SavedList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const loadSavedLists = () => {
      if (!user) {
        setSavedLists([])
        setIsLoading(false)
        return
      }

      try {
        const lists = savedListsService.getSavedLists(user)
        // Sort by date, newest first
        lists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setSavedLists(lists)
      } catch (error) {
        console.error("Failed to load saved lists:", error)
        toast({
          title: "Error",
          description: "Failed to load your saved lists",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSavedLists()
  }, [user, toast])

  const handleDeleteList = (listId: string, e: React.MouseEvent) => {
    e.stopPropagation()
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

  const handleListClick = (listId: string) => {
    router.push(`/saved-lists/${listId}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getItemCount = (list: SavedList) => {
    return list.items.length
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Header />

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Saved Lists</h1>
      </div>

      {isLoading ? (
        <div className="p-4 border rounded-lg animate-pulse bg-muted/50">Loading saved lists...</div>
      ) : !user ? (
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please log in to view your saved shopping lists.</p>
          </CardContent>
        </Card>
      ) : savedLists.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Saved Lists</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You don't have any saved shopping lists yet.</p>
            <Button className="mt-4" onClick={() => router.push("/")}>
              Create a Shopping List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>List Name</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedLists.map((list) => (
                  <TableRow
                    key={list.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleListClick(list.id)}
                  >
                    <TableCell className="font-medium">{list.name}</TableCell>
                    <TableCell>{formatDate(list.createdAt)}</TableCell>
                    <TableCell className="text-center">{getItemCount(list)}</TableCell>
                    <TableCell className="text-right">${list.totalCost.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={(e) => handleDeleteList(list.id, e)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
