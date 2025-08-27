'use client';

import React from 'react'

const DefaultFooter = ({ content = 'Standard Footer', layoutSettings, page }) => {
  const secondaryColor = layoutSettings?.secondary_color || '#64748b';

  return (
    <footer
      className="w-full h-full flex items-center justify-center text-white"
      style={{ backgroundColor: secondaryColor }}
    >
      <div className="text-center">
        <p>{content}</p>
        <p className="text-sm mt-2">© 2025 All rights reserved</p>
      </div>
    </footer>
  )
}

export default DefaultFooter
