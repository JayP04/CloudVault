'use client'

import { useState, useEffect } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Download from 'yet-another-react-lightbox/plugins/download'

export default function PhotoGallery({ files }) {
  const [imageUrls, setImageUrls] = useState({})
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [allSlides, setAllSlides] = useState([])
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState(null)

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
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
    
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(file)
    return groups
  }, {})

  // Sort dates descending (newest first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    return new Date(b) - new Date(a)
  })

  // Check if file is video
  function isVideo(file) {
    return file.mime_type.startsWith('video/')
  }

  // Open video in modal
  function openVideo(file) {
    setCurrentVideo({
      url: imageUrls[file.id],
      filename: file.original_filename,
      mimeType: file.mime_type
    })
    setVideoModalOpen(true)
  }

  // Close video modal
  function closeVideo() {
    setVideoModalOpen(false)
    setCurrentVideo(null)
  }

  // Open image lightbox (only for images)
  function openLightbox(file) {
    // Filter only images for lightbox
    const imageFiles = files.filter(f => !isVideo(f))
    const index = imageFiles.findIndex(f => f.id === file.id)
    
    const slides = imageFiles.map(f => ({
      src: imageUrls[f.id] || '',
      download: imageUrls[f.id] || '',
    }))
    
    setAllSlides(slides)
    setLightboxIndex(index)
  }

  // Handle click on file
  function handleFileClick(file) {
    if (isVideo(file)) {
      openVideo(file)
    } else {
      openLightbox(file)
    }
  }

  return (
    <>
      <div className="space-y-6">
        {sortedDates.map(dateKey => {
          const filesForDate = groupedByDate[dateKey]
          
          return (
            <div key={dateKey}>
              {/* Date Header - Sticky */}
              <div className="sticky top-0 bg-gray-50 py-3 z-10 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">
                  {dateKey}
                </h3>
              </div>
              
              {/* Photo Grid */}
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 pt-2">
                {filesForDate.map(file => (
                  <div
                    key={file.id}
                    onClick={() => handleFileClick(file)}
                    className="cursor-pointer group aspect-square bg-gray-200 relative overflow-hidden"
                  >
                    {imageUrls[file.id] ? (
                      <>
                        {isVideo(file) ? (
                          <>
                            <video
                              src={imageUrls[file.id]}
                              className="w-full h-full object-cover pointer-events-none"
                              preload="metadata"
                            />
                            {/* Video play icon overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all">
                              <svg 
                                className="w-12 h-12 text-white opacity-80"
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            </div>
                          </>
                        ) : (
                          <img
                            src={imageUrls[file.id]}
                            alt={file.original_filename}
                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          />
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Image Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={allSlides}
        plugins={[Zoom, Download]}
      />

      {/* Video Modal */}
      {videoModalOpen && currentVideo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={closeVideo}
        >
          <div className="relative w-full h-full max-w-7xl max-h-screen p-4">
            {/* Close button */}
            <button
              onClick={closeVideo}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Download button */}
            <a
              href={currentVideo.url}
              download={currentVideo.filename}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 right-20 z-10 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>

            {/* Video player */}
            <div 
              className="flex items-center justify-center w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={currentVideo.url}
                controls
                autoPlay
                className="max-w-full max-h-full"
                style={{ maxHeight: '90vh' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Filename */}
            <div className="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded">
              {currentVideo.filename}
            </div>
          </div>
        </div>
      )}
    </>
  )
}