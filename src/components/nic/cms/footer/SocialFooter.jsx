'use client';

import React from 'react'

const SocialFooter = ({ content = 'Social Footer', layoutSettings, page }) => {
  const primaryColor = layoutSettings?.primary_color || '#3b82f6';

  return (
    <footer
      className="w-full h-full text-white"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="text-lg font-semibold mb-4">
          {content}
        </div>
        <div className="flex space-x-4 mb-4">
          <a href="#" className="hover:text-gray-300">Facebook</a>
          <a href="#" className="hover:text-gray-300">Twitter</a>
          <a href="#" className="hover:text-gray-300">Instagram</a>
          <a href="#" className="hover:text-gray-300">LinkedIn</a>
        </div>
        <p className="text-sm">© 2025 All rights reserved</p>
      </div>
    </footer>
  )
}

export default SocialFooter
