'use client';

import React from 'react'

const ButtonBlock = ({ content = 'Button', onClick, className = '' }) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <button
        onClick={onClick}
        className={`px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
      >
        {content}
      </button>
    </div>
  )
}

export default ButtonBlock
