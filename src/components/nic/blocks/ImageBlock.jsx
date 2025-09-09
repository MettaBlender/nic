'use client';

/**
 * Simple image block for content
 * @icon 🖼️
 * @width 3
 * @height 3
 * @options {
 *  imageUrl: "https://images.unsplash.com/photo-1569511502671-8c1bbf96fc8d?q=80&w=1166&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
 * }
 */

import React from 'react'

const ImageBlock = ({ content, alt = 'Image Block' }) => {

  return (
    <div className="w-full h-full flex items-center justify-center">
      {content ? (
        <img
          src={content?.imageUrl}
          alt={alt}
          className="w-full h-full object-cover rounded"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 rounded">
          <div className="text-center">
            <div className="text-4xl mb-2">📷</div>
            <div>Image Block</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageBlock
