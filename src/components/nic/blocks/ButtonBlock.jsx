'use client';

/**
 * Einfacher Text Block für Inhalte
 * @icon 💡
 * @width 3
 * @height 1
 * @options {
 *  name: "button1"
 * }
 */

import React from 'react'

const ButtonBlock = ({ content, onClick, className = '' }) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <button
        onClick={onClick}
        className={`px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
      >
        {content.name}
      </button>
    </div>
  )
}

export default ButtonBlock
