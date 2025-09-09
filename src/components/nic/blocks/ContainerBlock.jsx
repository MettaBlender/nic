'use client';

/**
 * Container block for grouping other blocks
 * @icon 📝
 * @width 3
 * @height 2
 * @options {
 *  html: "<h1>Container Block</h1>"
 * }
 */

import React from 'react'

const ContainerBlock = ({ children, content = 'Container Block' }) => {
  return (
    <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg p-4">
      {children || (
        <div className="w-full h-full flex items-center justify-center text-gray-500">
          {content.html}
        </div>
      )}
    </div>
  )
}

export default ContainerBlock
