'use client';

import React from 'react'

const DefaultHeader = ({ content = 'Standard Header', layoutSettings, page }) => {
  const primaryColor = layoutSettings?.primary_color || '#3b82f6';

  return (
    <header
      className="w-full h-full flex items-center justify-center text-white"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="text-xl font-bold">
        {content}
      </div>
    </header>
  )
}

export default DefaultHeader
