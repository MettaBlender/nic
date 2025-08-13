'use client';

import React from 'react'

const VideoBlock = ({ content = '', title = 'Video Block' }) => {
  const videoUrl = content;

  return (
    <div className="w-full h-full">
      {videoUrl ? (
        <video
          src={videoUrl}
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
