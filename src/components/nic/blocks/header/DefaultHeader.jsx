'use client';

import React from 'react'

const DefaultHeader = ({ content = 'Standard Header' }) => {
  return (
    <header className="w-full h-full flex items-center justify-center bg-blue-600 text-white">
      <div className="text-xl font-bold">
        {content}
      </div>
    </header>
  )
}

export default DefaultHeader
