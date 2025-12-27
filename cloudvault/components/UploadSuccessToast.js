'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadSuccessToast({ count }) {
  const [show, setShow] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      setShow(false)
      // Clean up URL
      router.replace('/dashboard')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <p className="font-semibold">
            {count} {count === 1 ? 'photo' : 'photos'} uploaded!
          </p>
          <p className="text-sm text-green-100">Successfully backed up to CloudVault</p>
        </div>
      </div>
    </div>
  )
}