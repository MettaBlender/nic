'use client';

import React from 'react'

const ImageBlock = ({ content = '', alt = 'Image Block' }) => {
  const imageUrl = content || '/placeholder-image.svg';

  return (
    <div className="w-full h-full flex items-center justify-center">
      {content ? (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover rounded"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 rounded">
          <div className="text-center">
            <div className="text-4xl mb-2">📷</div>
            <div>Bild Block</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageBlock
