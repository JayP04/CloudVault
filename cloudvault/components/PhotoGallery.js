'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Download from 'yet-another-react-lightbox/plugins/download'

export default function PhotoGallery({ files }) {
  const [imageUrls, setImageUrls] = useState({})
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const router = useRouter()

  // Load image URLs on mount
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

  // Group files by date
  const groupedByDate = files.reduce((groups, file) => {
    const date = new Date(file.effective_date)
    const dateKey = date.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(file)
    return groups
  }, {})

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    return new Date(b) - new Date(a)
  })

  function isVideo(file) {
    return file.mime_type.startsWith('video/')
  }

  function enterSelectMode() {
    setSelectMode(true)
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedFiles(new Set())
  }

  function toggleSelect(file, event) {
    const newSelected = new Set(selectedFiles)
    
    if (newSelected.has(file.id)) {
      newSelected.delete(file.id)
    } else {
      newSelected.add(file.id)
    }
    
    setSelectedFiles(newSelected)
  }

  function handleClick(file, event) {
    if (selectMode) {
      toggleSelect(file, event)
    }
  }

  function handleDoubleClick(file) {
    if (isVideo(file)) {
      openVideo(file)
    } else {
      openLightbox(file.id)
    }
  }

  function openVideo(file) {
    setCurrentVideo({
      id: file.id,
      url: imageUrls[file.id],
      filename: file.original_filename,
      mimeType: file.mime_type
    })
    setVideoModalOpen(true)
  }

  function closeVideo() {
    setVideoModalOpen(false)
    setCurrentVideo(null)
  }

  function openLightbox(fileId) {
    const imageFiles = files.filter(f => !isVideo(f))
    const index = imageFiles.findIndex(f => f.id === fileId)
    setLightboxIndex(index)
  }

  async function handleDeleteSelected() {
    setDeleting(true)
    
    try {
      const deletePromises = Array.from(selectedFiles).map(fileId =>
        fetch(`/api/files/${fileId}`, { method: 'DELETE' })
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

  const imageFiles = files.filter(f => !isVideo(f))
  const lightboxSlides = imageFiles.map(file => ({
    src: imageUrls[file.id] || '',
    download: `/api/files/${file.id}/download`,
  }))

  return (
    <div className="pb-20 lg:pb-6">
      {/* Header with Select Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Photos</h1>
          <p className="text-sm text-zinc-500 mt-1">{files.length} items</p>
        </div>
        
        {!selectMode && (
          <button
            onClick={enterSelectMode}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Select
          </button>
        )}
      </div>

      {/* Selection Action Bar */}
      {selectMode && (
        <div className="fixed top-0 left-0 lg:left-64 right-0 bg-white border-b border-zinc-200 shadow-sm z-40">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={exitSelectMode}
                className="text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <span className="text-sm font-medium text-zinc-900">
                {selectedFiles.size === 0 ? 'Select items' : `${selectedFiles.size} selected`}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDeleteModalOpen(true)}
                disabled={selectedFiles.size === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-sky-600 rounded-lg hover:from-blue-700 hover:to-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Delete
              </button>
              <button
                disabled={selectedFiles.size === 0}
                className="px-4 py-2 text-sm font-medium text-zinc-400 bg-zinc-100 rounded-lg cursor-not-allowed"
                title="Coming soon"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <div className={`space-y-8 ${selectMode ? 'pt-20' : ''}`}>
        {sortedDates.map(dateKey => {
          const filesForDate = groupedByDate[dateKey]
          
          return (
            <div key={dateKey} className="space-y-3">
              {/* Date Header */}
              <h2 className="text-lg font-semibold text-zinc-900 px-1">
                {dateKey}
              </h2>
              
              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
                {filesForDate.map(file => {
                  const isSelected = selectedFiles.has(file.id)
                  
                  return (
                    <div
                      key={file.id}
                      onClick={(e) => handleClick(file, e)}
                      onDoubleClick={() => handleDoubleClick(file)}
                      className={`group relative aspect-square bg-zinc-100 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'ring-4 ring-blue-500 shadow-lg scale-[0.98]' 
                          : 'hover:shadow-md hover:scale-[1.02]'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      {selectMode && (
                        <div className="absolute top-2 right-2 z-10">
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-md ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-600 scale-110' 
                              : 'bg-white/90 border-white backdrop-blur-sm'
                          }`}>
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Image/Video */}
                      {imageUrls[file.id] ? (
                        <>
                          {isVideo(file) ? (
                            <div className="relative w-full h-full">
                              <video
                                src={imageUrls[file.id]}
                                className="w-full h-full object-cover"
                                preload="metadata"
                              />
                              {/* Video play overlay */}
                              {!selectMode && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                                  <div className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-zinc-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <img
                              src={imageUrls[file.id]}
                              alt={file.original_filename}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-8 h-8 border-3 border-zinc-300 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">
              Move to Trash?
            </h3>
            <p className="text-sm text-zinc-600 mb-6">
              {selectedFiles.size} {selectedFiles.size === 1 ? 'item' : 'items'} will be moved to trash. You can restore within 30 days.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="px-4 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-lg transition-all shadow-sm disabled:opacity-50"
              >
                {deleting ? 'Moving...' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={lightboxSlides}
        plugins={[Zoom, Download]}
        styles={{
          container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' },
        }}
      />

      {/* Video Modal */}
      {videoModalOpen && currentVideo && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center animate-in fade-in duration-200"
          onClick={closeVideo}
        >
          <div className="relative w-full h-full max-w-7xl max-h-screen p-4 lg:p-8">
            <button
              onClick={closeVideo}
              className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div 
              className="flex items-center justify-center w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={currentVideo.url}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-lg shadow-2xl"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}