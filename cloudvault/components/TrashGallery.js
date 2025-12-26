'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function TrashGallery({ files }) {
  const [imageUrls, setImageUrls] = useState({})
  const [selectMode, setSelectMode] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null)
  const [restoring, setRestoring] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isSwiping, setIsSwiping] = useState(false)
  
  const router = useRouter()

  // Load image URLs
  useEffect(() => {
    async function loadUrls() {
      const urls = {}
      for (const file of files) {
        try {
          const response = await fetch(`/api/files/${file.id}/download-url`)
          const data = await response.json()
          urls[file.id] = data.url
        } catch (error) {
          console.error(`Failed to load URL for ${file.id}:`, error)
        }
      }
      setImageUrls(urls)
    }
    loadUrls()
  }, [files])

  function isVideo(file) {
    return file.mime_type.startsWith('video/')
  }

  function enterSelectMode() {
    setSelectMode(true)
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedFiles(new Set())
    setLastSelectedIndex(null)
  }

  function toggleSelect(file, index, event) {
    const newSelected = new Set(selectedFiles)
    
    if (event?.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      
      for (let i = start; i <= end; i++) {
        newSelected.add(files[i].id)
      }
    } else {
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id)
      } else {
        newSelected.add(file.id)
      }
    }
    
    setSelectedFiles(newSelected)
    setLastSelectedIndex(index)
  }

  function handleClick(file, index, event) {
    if (selectMode) {
      toggleSelect(file, index, event)
    }
  }

  function handleTouchStart(file, index, event) {
    if (!selectMode) return
    setIsSwiping(true)
    toggleSelect(file, index)
  }

  function handleTouchMove(file, index, event) {
    if (!selectMode || !isSwiping) return
    const newSelected = new Set(selectedFiles)
    newSelected.add(file.id)
    setSelectedFiles(newSelected)
  }

  function handleTouchEnd() {
    setIsSwiping(false)
  }

  async function handleRestore() {
    setRestoring(true)
    
    try {
      const restorePromises = Array.from(selectedFiles).map(fileId =>
        fetch(`/api/files/${fileId}/restore`, { method: 'POST' })
      )
      
      await Promise.all(restorePromises)
      
      exitSelectMode()
      router.refresh()
    } catch (error) {
      console.error('Restore error:', error)
      alert('Failed to restore some files. Please try again.')
    } finally {
      setRestoring(false)
    }
  }

  async function handlePermanentDelete() {
    setDeleting(true)
    
    try {
      const deletePromises = Array.from(selectedFiles).map(fileId =>
        fetch(`/api/files/${fileId}/permanent-delete`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      setDeleteModalOpen(false)
      exitSelectMode()
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete some files. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Action Bar */}
      {selectMode && (
        <div className="sticky top-0 z-20 bg-red-600 text-white shadow-lg mb-6">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={exitSelectMode}
                className="text-white hover:text-red-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <span className="font-medium">
                {selectedFiles.size} selected
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRestore}
                disabled={selectedFiles.size === 0 || restoring}
                className="px-4 py-2 bg-white text-red-600 rounded-md font-medium hover:bg-red-50 disabled:opacity-50"
              >
                {restoring ? 'Restoring...' : 'Restore'}
              </button>
              <button
                onClick={() => setDeleteModalOpen(true)}
                disabled={selectedFiles.size === 0}
                className="px-4 py-2 bg-red-700 text-white rounded-md font-medium hover:bg-red-800 disabled:opacity-50"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Button */}
      {!selectMode && (
        <div className="flex justify-end mb-4">
          <button
            onClick={enterSelectMode}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Select
          </button>
        </div>
      )}

      {/* Grid View */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1">
        {files.map((file, index) => {
          const isSelected = selectedFiles.has(file.id)
          
          return (
            <div
              key={file.id}
              onClick={(e) => handleClick(file, index, e)}
              onTouchStart={(e) => handleTouchStart(file, index, e)}
              onTouchMove={(e) => handleTouchMove(file, index, e)}
              onTouchEnd={handleTouchEnd}
              className={`cursor-pointer group aspect-square bg-gray-200 relative overflow-hidden ${
                isSelected ? 'ring-4 ring-red-500' : ''
              }`}
            >
              {/* Selection Checkbox */}
              {selectMode && (
                <div className="absolute top-2 right-2 z-10">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-red-500 border-red-500' 
                      : 'bg-white/80 border-white'
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              )}

              {/* Days left indicator */}
              {!selectMode && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center">
                  {file.daysLeft > 0 
                    ? `${file.daysLeft}d left`
                    : 'Deletes today'
                  }
                </div>
              )}

              {/* Thumbnail */}
              {imageUrls[file.id] ? (
                isVideo(file) ? (
                  <video
                    src={imageUrls[file.id]}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={imageUrls[file.id]}
                    alt={file.original_filename}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Permanent Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Permanently delete {selectedFiles.size} {selectedFiles.size === 1 ? 'item' : 'items'}?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone. {selectedFiles.size === 1 ? 'This item' : 'These items'} will be permanently deleted from your vault and cannot be recovered.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}