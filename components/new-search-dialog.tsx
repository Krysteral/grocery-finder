"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SaveListDialog } from "./save-list-dialog"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { AuthDialog } from "@/components/auth/auth-dialog"

interface NewSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  items: any[]
  location: string
}

export function NewSearchDialog({ open, onOpenChange, onConfirm, items, location }: NewSearchDialogProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const { user } = useUser()

  // Get the total cost if available from search params
  const getTotalCost = () => {
    try {
      const totalCostParam = searchParams.get("totalCost")
      return totalCostParam ? Number.parseFloat(totalCostParam) : 0
    } catch (e) {
      return 0
    }
  }

  const handleSaveList = () => {
    if (items.length === 0) {
      toast({
        title: "No items to save",
        description: "Your shopping list is empty.",
        variant: "destructive",
      })
      return
    }

    // Check if user is logged in
    if (!user) {
      // Show auth dialog if not logged in
      setAuthDialogOpen(true)
      onOpenChange(false) // Close the confirmation dialog
      return
    }

    // If logged in, proceed to save dialog
    setSaveDialogOpen(true)
    onOpenChange(false) // Close the confirmation dialog
  }

  const handleCreateNew = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleSaveSuccess = () => {
    // After successfully saving, proceed with creating a new search
    onConfirm()
  }

  const handleAuthSuccess = () => {
    // After successful authentication, open the save dialog
    setSaveDialogOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Search?</DialogTitle>
            <DialogDescription>
              This will clear your current search results and shopping list. Would you like to save your list first?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" className="sm:flex-1" onClick={handleSaveList}>
              Save Current List
            </Button>
            <Button variant="default" className="sm:flex-1" onClick={handleCreateNew}>
              Create New List
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

      {/* Save List Dialog */}
      <SaveListDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        items={items}
        location={location}
        totalCost={getTotalCost()}
        onSuccess={handleSaveSuccess} // Pass the success handler
      />
    </>
  )
}
