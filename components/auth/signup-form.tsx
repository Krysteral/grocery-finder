"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Check, X } from "lucide-react"

interface SignupFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface PasswordValidation {
  minLength: boolean
  hasLowercase: boolean
  hasUppercase: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

export function SignupForm({ onSuccess, onCancel }: SignupFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validation, setValidation] = useState<PasswordValidation>({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecial: false,
  })
  const [passwordsMatch, setPasswordsMatch] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmTouched, setConfirmTouched] = useState(false)

  const { signup } = useUser()
  const { toast } = useToast()

  // Validate password in real-time
  useEffect(() => {
    setValidation({
      minLength: password.length >= 8 && password.length <= 50,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    })
  }, [password])

  // Check if passwords match
  useEffect(() => {
    setPasswordsMatch(password === confirmPassword && password !== "")
  }, [password, confirmPassword])

  const isPasswordValid = Object.values(validation).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (!isPasswordValid) {
      setError("Password does not meet all requirements")
      return
    }

    if (!passwordsMatch) {
      setError("Passwords do not match")
      return
    }

    try {
      setIsLoading(true)
      const result = await signup(email, password)

      if (result.success) {
        toast({
          title: "Success",
          description: "Your account has been created successfully",
        })
        if (onSuccess) onSuccess()
      } else {
        setError(result.message || "Failed to create account")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setPasswordTouched(true)}
          required
        />

        {passwordTouched && (
          <div className="mt-2 text-sm space-y-1">
            <p className="font-medium">Password requirements:</p>
            <ul className="space-y-1">
              <li className="flex items-center">
                {validation.minLength ? (
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <X className="h-4 w-4 mr-2 text-destructive" />
                )}
                <span className={validation.minLength ? "text-green-600" : "text-destructive"}>
                  Between 8 and 50 characters
                </span>
              </li>
              <li className="flex items-center">
                {validation.hasLowercase ? (
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <X className="h-4 w-4 mr-2 text-destructive" />
                )}
                <span className={validation.hasLowercase ? "text-green-600" : "text-destructive"}>
                  At least one lowercase letter
                </span>
              </li>
              <li className="flex items-center">
                {validation.hasUppercase ? (
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <X className="h-4 w-4 mr-2 text-destructive" />
                )}
                <span className={validation.hasUppercase ? "text-green-600" : "text-destructive"}>
                  At least one uppercase letter
                </span>
              </li>
              <li className="flex items-center">
                {validation.hasNumber ? (
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <X className="h-4 w-4 mr-2 text-destructive" />
                )}
                <span className={validation.hasNumber ? "text-green-600" : "text-destructive"}>
                  At least one number
                </span>
              </li>
              <li className="flex items-center">
                {validation.hasSpecial ? (
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <X className="h-4 w-4 mr-2 text-destructive" />
                )}
                <span className={validation.hasSpecial ? "text-green-600" : "text-destructive"}>
                  At least one special character
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onFocus={() => setConfirmTouched(true)}
          required
        />

        {confirmTouched && confirmPassword && (
          <div className="mt-1 flex items-center text-sm">
            {passwordsMatch ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-green-600">Passwords match</span>
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2 text-destructive" />
                <span className="text-destructive">Passwords do not match</span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center text-destructive text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" className="w-full" disabled={isLoading || !isPasswordValid || !passwordsMatch}>
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
