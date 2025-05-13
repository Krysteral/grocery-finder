"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/user-context"
import { AuthDialog } from "./auth-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, List } from "lucide-react"
import Link from "next/link"

export function UserMenu() {
  const { user, logout } = useUser()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authDialogTab, setAuthDialogTab] = useState<"login" | "signup">("login")

  const handleAuthClick = () => {
    setAuthDialogTab("login")
    setAuthDialogOpen(true)
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
            <span className="sr-only">User menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>My Account</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/saved-lists" className="flex items-center cursor-pointer">
              <List className="h-4 w-4 mr-2" />
              <span>Saved Lists</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <Button variant="outline" size="icon" className="rounded-full" onClick={handleAuthClick}>
        <User className="h-5 w-5" />
        <span className="sr-only">Login or sign up</span>
      </Button>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} defaultTab={authDialogTab} />
    </>
  )
}
