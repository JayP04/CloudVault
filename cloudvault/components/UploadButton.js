'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import exifr from 'exifr'

export default function UploadButton() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(null)
  const router = useRouter()

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress('Preparing upload...')

    try {
      // Extract EXIF date if it's an image
      let exifDate = null
      if (file.type.startsWith('image/')) {
        try {
          const exif = await exifr.parse(file)
          if (exif?.DateTimeOriginal) {
            exifDate = new Date(exif.DateTimeOriginal).toISOString()
          }
        } catch (err) {
          console.log('Could not extract EXIF:', err)
        }
      }

      setProgress('Requesting upload URL...')

      // Request signed upload URL from API
      const uploadRequest = await fetch('/api/files/upload-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
          exifDate,
        }),
      })

      if (!uploadRequest.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, fileId, storageKey, metadata } = await uploadRequest.json()

      setProgress('Uploading file...')

      // Upload file directly to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      setProgress('Confirming upload...')

      // Confirm upload with backend
      const confirmResponse = await fetch('/api/files/confirm-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          storageKey,
          metadata,
        }),
      })

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload')
      }

      setProgress('Upload complete!')
      
      // Refresh the page to show new file
      setTimeout(() => {
        router.refresh()
        setUploading(false)
        setProgress(null)
      }, 1000)

    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.message}`)
      setUploading(false)
      setProgress(null)
    }
  }

  return (
    <div>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
        accept="image/*,video/*"
      />
      <label
        htmlFor="file-upload"
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${
          uploading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {uploading ? progress : 'Upload File'}
      </label>
    </div>
  )
}