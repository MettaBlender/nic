'use client';

import React from 'react'

const DefaultFooter = ({ content = 'Standard Footer' }) => {
  return (
    <footer className="w-full h-full flex items-center justify-center bg-gray-700 text-white">
      <div className="text-center">
        <p>{content}</p>
        <p className="text-sm mt-2">© 2025 All rights reserved</p>
      </div>
    </footer>
  )
}

export default DefaultFooter
