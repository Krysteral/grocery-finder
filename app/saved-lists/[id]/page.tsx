"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { useUser } from "@/contexts/user-context"
import { savedListsService, type SavedList } from "@/lib/saved-lists-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, ShoppingBag, Printer, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SavedListDetailPage() {
  const [savedList, setSavedList] = useState<SavedList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const listId = params.id as string

  useEffect(() => {
    const loadSavedList = () => {
      if (!user) {
        setSavedList(null)
        setIsLoading(false)
        return
      }

      try {
        const list = savedListsService.getSavedListById(user, listId)
        setSavedList(list)
      } catch (error) {
        console.error("Failed to load saved list:", error)
        toast({
          title: "Error",
          description: "Failed to load the shopping list",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSavedList()
  }, [user, listId, toast])

  const handleLoadList = () => {
    if (!savedList) return

    // Add items and location to URL
    const params = new URLSearchParams()
    params.set("location", savedList.location)
    params.set("items", JSON.stringify(savedList.items))
    router.push(`/?${params.toString()}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Calculate subtotal for an item
  const calculateSubtotal = (item: any) => {
    if (item.price && item.quantity) {
      return (item.price * item.quantity).toFixed(2)
    }
    return "N/A"
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Header />

      <div className="mb-2">
        <Button variant="ghost" onClick={() => router.push("/saved-lists")} className="pl-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Saved Lists
        </Button>
      </div>

      {isLoading ? (
        <div className="p-4 border rounded-lg animate-pulse bg-muted/50">Loading list details...</div>
      ) : !user ? (
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please log in to view this shopping list.</p>
          </CardContent>
        </Card>
      ) : !savedList ? (
        <Card>
          <CardHeader>
            <CardTitle>List Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The shopping list you're looking for doesn't exist or has been deleted.
            </p>
            <Button className="mt-4" onClick={() => router.push("/saved-lists")}>
              View All Lists
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{savedList.name}</h1>
            <p className="text-muted-foreground mt-1">Created on {formatDate(savedList.createdAt)}</p>
            {savedList.location && (
              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                <span>Location: {savedList.location}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 mb-6">
            <Button onClick={handleLoadList}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Load List
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print List
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>
                Total: <span className="font-semibold">${savedList.totalCost.toFixed(2)}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    {savedList.items.some((item) => item.storeName) && <TableHead>Store</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedList.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.price ? `$${item.price.toFixed(2)}` : "N/A"}</TableCell>
                      <TableCell className="text-right">{item.price ? `$${calculateSubtotal(item)}` : "N/A"}</TableCell>
                      {savedList.items.some((item) => item.storeName) && (
                        <TableCell>{item.storeName || "N/A"}</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}
