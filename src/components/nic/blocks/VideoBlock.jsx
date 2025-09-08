'use client';

import React from 'react'

/**
 * Test Block Component
 * @icon 🎥
 * @description Test component for grid system
 * @options {
 *  videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
 * }
 */

const VideoBlock = ({ content, title = 'Video Block' }) => {

  return (
    <div className="w-full h-full">
      {content.videoUrl ? (
        <video
          src={content.videoUrl}
          controls
          className="w-full h-full object-cover rounded"
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white rounded">
          <div className="text-center">
            <div className="text-4xl mb-2">▶️</div>
            <div>{title}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoBlock
