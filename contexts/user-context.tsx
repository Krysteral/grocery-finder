"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface User {
  id: string
  email: string
}

interface StoredUser extends User {
  passwordHash: string
}

interface UserContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  signup: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser({
          id: parsedUser.id,
          email: parsedUser.email,
        })
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      // Get users from localStorage
      const usersJson = localStorage.getItem("users")
      const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : []

      // Find user by email
      const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

      if (!foundUser) {
        return { success: false, message: "Invalid email/password" }
      }

      // Hash the provided password and compare
      const hashedPassword = await hashPassword(password)

      if (foundUser.passwordHash !== hashedPassword) {
        return { success: false, message: "Invalid email/password" }
      }

      // User authenticated successfully
      const authenticatedUser = {
        id: foundUser.id,
        email: foundUser.email,
      }

      // Store current user in localStorage
      localStorage.setItem("currentUser", JSON.stringify(authenticatedUser))
      setUser(authenticatedUser)

      return { success: true }
    } catch (error) {
      console.error("Login failed:", error)
      return { success: false, message: "An error occurred during login" }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      // Get existing users from localStorage
      const usersJson = localStorage.getItem("users")
      const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : []

      // Check if user already exists
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: "Email already in use" }
      }

      // Hash the password
      const passwordHash = await hashPassword(password)

      // Create new user
      const newUser: StoredUser = {
        id: `user-${Date.now()}`,
        email,
        passwordHash,
      }

      // Add to users array and save to localStorage
      users.push(newUser)
      localStorage.setItem("users", JSON.stringify(users))

      // Log the user in
      const authenticatedUser = {
        id: newUser.id,
        email: newUser.email,
      }

      localStorage.setItem("currentUser", JSON.stringify(authenticatedUser))
      setUser(authenticatedUser)

      return { success: true }
    } catch (error) {
      console.error("Signup failed:", error)
      return { success: false, message: "An error occurred during signup" }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("currentUser")
    setUser(null)
  }

  // Password hashing function
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  return <UserContext.Provider value={{ user, isLoading, login, signup, logout }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
