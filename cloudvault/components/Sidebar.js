'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Sidebar({ user }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleUpload(files) {
    if (files.length === 0) return
    
    setUploading(true)
    setUploadProgress(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`)
    
    try {
      // Import exifr for EXIF extraction
      const exifr = (await import('exifr')).default
      
      let successCount = 0
      
      for (const file of files) {
        try {
          // Extract EXIF date
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

          setUploadProgress(`Uploading ${file.name}...`)

          // Request signed upload URL
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

          // Upload file to R2
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

          // Confirm upload
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

          successCount++
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
        }
      }

      setUploadProgress(`${successCount} file${successCount > 1 ? 's' : ''} uploaded!`)
      
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(null)
        router.refresh()
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadProgress('Upload failed')
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(null)
      }, 3000)
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(f => 
      f.type.startsWith('image/') || f.type.startsWith('video/')
    )
    
    if (validFiles.length > 0) {
      handleUpload(validFiles)
    }
  }

  const navigation = [
    {
      name: 'Photos',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Trash',
      href: '/trash',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-zinc-200 lg:bg-white relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-blue-500/10 border-4 border-dashed border-blue-500 rounded-lg z-50 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-semibold text-blue-700 mt-4">Drop to upload</p>
            </div>
          </div>
        )}

        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-zinc-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-sky-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gradient">CloudVault</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 shadow-sm'
                    : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <span className={isActive ? 'text-blue-600' : 'text-zinc-400'}>
                  {item.icon}
                </span>
                <span className="ml-3">{item.name}</span>
              </Link>
            )
          })}

          {/* Upload Section */}
          <div className="pt-4">
            <input
              type="file"
              id="sidebar-upload"
              className="hidden"
              multiple
              accept="image/*,video/*"
              disabled={uploading}
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                handleUpload(files)
              }}
            />
            
            <label
              htmlFor="sidebar-upload"
              className={`flex items-center justify-center px-4 py-3 text-sm font-semibold text-white rounded-lg cursor-pointer bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 transition-all shadow-md hover:shadow-lg w-full ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs">{uploadProgress}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload
                </>
              )}
            </label>
            
            <p className="text-xs text-center text-zinc-500 mt-2">
              or drag files here
            </p>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center text-white font-semibold text-sm">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-50">
        <nav className="flex justify-around items-center h-16 px-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 flex-1 py-2 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-zinc-400'
                }`}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            )
          })}
          
          {/* Upload Button */}
          <label
            htmlFor="mobile-upload"
            className="flex flex-col items-center justify-center space-y-1 flex-1 py-2 text-blue-600 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-700 to-sky-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs font-medium">Upload</span>
          </label>
          <input
            type="file"
            id="mobile-upload"
            className="hidden"
            multiple
            accept="image/*,video/*"
            disabled={uploading}
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              handleUpload(files)
            }}
          />
          
          {/* Profile */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center space-y-1 flex-1 py-2 text-zinc-400"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center text-white text-xs font-semibold">
              {user.email[0].toUpperCase()}
            </div>
            <span className="text-xs font-medium">Profile</span>
          </button>
        </nav>
      </div>
    </>
  )
}