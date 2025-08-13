'use client';

import React from 'react'

const NavigationHeader = ({ content = 'Navigation Header' }) => {
  return (
    <header className="w-full h-full bg-gray-800 text-white">
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="text-lg font-bold">
          {content}
        </div>
        <ul className="flex space-x-6">
          <li><a href="#" className="hover:text-gray-300">Home</a></li>
          <li><a href="#" className="hover:text-gray-300">About</a></li>
          <li><a href="#" className="hover:text-gray-300">Services</a></li>
          <li><a href="#" className="hover:text-gray-300">Contact</a></li>
        </ul>
      </nav>
    </header>
  )
}

export default NavigationHeader
