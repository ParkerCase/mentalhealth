'use client'

import { useEffect, useRef } from 'react'

interface ReCaptchaWrapperProps {
  onVerify: (token: string) => void
  onExpired: () => void
}

export default function ReCaptchaWrapper({ onVerify, onExpired }: ReCaptchaWrapperProps) {
  const recaptchaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    if (typeof window !== 'undefined' && (window as any).grecaptcha && recaptchaRef.current) {
      (window as any).grecaptcha.render(recaptchaRef.current, {
        sitekey: '6Ld8JZIrAAAAAJg5i9GqRmopMxOf0tgcmloL6xiJ', // Your actual reCAPTCHA site key
        callback: (token: string) => {
          onVerify(token)
        },
        'expired-callback': () => {
          onExpired()
        }
      })
    }
  }, [onVerify, onExpired])

  return (
    <div className="flex justify-center my-4">
      <div ref={recaptchaRef}></div>
    </div>
  )
} 