"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { savedListsService } from "@/lib/saved-lists-service"
import { useRouter } from "next/navigation"
import { AuthDialog } from "@/components/auth/auth-dialog"

interface SaveListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: any[]
  location: string
  totalCost?: number
  onSuccess?: () => void
}

export function SaveListDialog({ open, onOpenChange, items, location, totalCost = 0, onSuccess }: SaveListDialogProps) {
  const [listName, setListName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const { user } = useUser()
  const { toast } = useToast()
  const router = useRouter()

  // Check authentication when dialog opens
  useEffect(() => {
    if (open && !user) {
      // If dialog is opened but user is not logged in, show auth dialog
      setAuthDialogOpen(true)
      onOpenChange(false) // Close the save dialog
    }
  }, [open, user, onOpenChange])

  const handleSave = async () => {
    if (!user) {
      // Double-check user is logged in
      setAuthDialogOpen(true)
      onOpenChange(false)
      return
    }

    if (!listName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your list",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const savedList = await savedListsService.saveList(user, listName, items, location, totalCost)

      toast({
        title: "Success",
        description: "Your shopping list has been saved",
      })

      onOpenChange(false)
      if (onSuccess) onSuccess()

      // Navigate to the saved list detail page
      router.push(`/saved-lists/${savedList.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your shopping list",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuthSuccess = () => {
    // After successful authentication, reopen the save dialog
    onOpenChange(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Shopping List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="list-name">List Name</Label>
              <Input
                id="list-name"
                placeholder="e.g., Weekly Groceries"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              This list will be saved to your account and you can access it anytime.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Dialog for login/signup */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        defaultTab="login"
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}
