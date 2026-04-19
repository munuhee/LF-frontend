"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Shield, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { validateOtp, users } from "@/lib/dummy-data"

export default function VerifyOTPPage() {
  const router = useRouter()
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [error, setError] = useState("")
  const [pendingEmail, setPendingEmail] = useState("")
  const [expectedOtp, setExpectedOtp] = useState("")

  useEffect(() => {
    // Get the email from session storage
    const email = sessionStorage.getItem("pendingAuthEmail")
    if (!email) {
      router.push("/")
      return
    }
    setPendingEmail(email)
    
    // Find the expected OTP for display hint
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (user?.testOtp) {
      setExpectedOtp(user.testOtp)
    }
  }, [router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleVerify = async () => {
    if (otp.length !== 6) return
    
    setIsLoading(true)
    setError("")
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Validate OTP against seeded data
    const user = validateOtp(pendingEmail, otp)
    
    if (!user) {
      setError("Invalid OTP code. Please use the test OTP for your account.")
      setIsLoading(false)
      return
    }
    
    // Clear session storage
    sessionStorage.removeItem("pendingAuthEmail")
    
    // Navigate to dashboard on success
    router.push("/dashboard")
  }

  const handleResend = async () => {
    setCanResend(false)
    setCountdown(60)
    setError("")
    
    // Simulate resend API call
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">L</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-foreground">LabelForge</span>
            <span className="text-sm text-muted-foreground">AI Training Platform</span>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm w-full">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <InputOTP
              value={otp}
              onChange={setOtp}
              maxLength={6}
              className="gap-3"
            >
              <InputOTPGroup className="gap-3">
                <InputOTPSlot index={0} className="h-12 w-12 text-lg border-border bg-secondary/30" />
                <InputOTPSlot index={1} className="h-12 w-12 text-lg border-border bg-secondary/30" />
                <InputOTPSlot index={2} className="h-12 w-12 text-lg border-border bg-secondary/30" />
                <InputOTPSlot index={3} className="h-12 w-12 text-lg border-border bg-secondary/30" />
                <InputOTPSlot index={4} className="h-12 w-12 text-lg border-border bg-secondary/30" />
                <InputOTPSlot index={5} className="h-12 w-12 text-lg border-border bg-secondary/30" />
              </InputOTPGroup>
            </InputOTP>

            {/* Test OTP Hint */}
            {expectedOtp && (
              <div className="w-full p-3 rounded-lg bg-secondary/50 border border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Test OTP: <span className="font-mono font-medium text-foreground">{expectedOtp}</span>
                </p>
              </div>
            )}

            <Button
              onClick={handleVerify}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={otp.length !== 6 || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Verifying...
                </span>
              ) : (
                "Verify Code"
              )}
            </Button>

            <div className="text-center">
              {canResend ? (
                <Button
                  variant="ghost"
                  onClick={handleResend}
                  className="text-primary hover:text-primary/80"
                >
                  Resend Code
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Resend code in{" "}
                  <span className="font-mono text-foreground">{formatTime(countdown)}</span>
                </p>
              )}
            </div>

            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {"Didn't receive the code? Check your spam folder or contact support"}
        </p>
      </div>
    </div>
  )
}
