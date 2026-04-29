"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, CheckCircle2 } from "lucide-react"

interface CaptchaGateProps {
  onVerified: () => void
}

export function CaptchaGate({ onVerified }: CaptchaGateProps) {
  const [isChecked, setIsChecked] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const handleCheck = async (checked: boolean) => {
    if (checked && !isVerified) {
      setIsChecked(true)
      setIsVerifying(true)
      
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setIsVerifying(false)
      setIsVerified(true)
    }
  }

  const handleContinue = () => {
    if (isVerified) {
      onVerified()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-3 bg-primary" />
          <span className="text-xl font-semibold text-foreground tracking-tight">
            HPE Image Builder
          </span>
        </div>

        {/* Captcha Card */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium text-foreground">Security Verification</h2>
          </div>

          <p className="text-muted-foreground text-sm mb-6">
            Please verify that you are human to access the Image Builder platform.
          </p>

          {/* Captcha Checkbox */}
          <div className="border border-border rounded-md p-4 bg-muted/30 mb-6">
            <div className="flex items-center gap-3">
              {isVerified ? (
                <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                </div>
              ) : (
                <Checkbox
                  id="captcha"
                  checked={isChecked}
                  onCheckedChange={handleCheck}
                  disabled={isVerifying}
                  className="h-6 w-6 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              )}
              <div className="flex-1">
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">Verifying...</span>
                  </div>
                ) : isVerified ? (
                  <span className="text-sm text-primary font-medium">Verification successful</span>
                ) : (
                  <label htmlFor="captcha" className="text-sm text-foreground cursor-pointer">
                    I am not a robot
                  </label>
                )}
              </div>
              <div className="flex flex-col items-end">
                <svg viewBox="0 0 64 64" className="h-8 w-8 text-muted-foreground/50">
                  <path
                    fill="currentColor"
                    d="M32 0C14.327 0 0 14.327 0 32s14.327 32 32 32 32-14.327 32-32S49.673 0 32 0zm0 58C17.64 58 6 46.36 6 32S17.64 6 32 6s26 11.64 26 26-11.64 26-26 26z"
                  />
                  <path
                    fill="currentColor"
                    d="M32 12c-11.046 0-20 8.954-20 20s8.954 20 20 20 20-8.954 20-20-8.954-20-20-20zm0 36c-8.837 0-16-7.163-16-16s7.163-16 16-16 16 7.163 16 16-7.163 16-16 16z"
                  />
                </svg>
                <span className="text-[10px] text-muted-foreground/50">reCAPTCHA</span>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!isVerified}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Continue to Image Builder
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Protected by reCAPTCHA and the HPE{" "}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          {" "}and{" "}
          <a href="#" className="text-primary hover:underline">Terms of Service</a>
          {" "}apply.
        </p>
      </div>
    </div>
  )
}
