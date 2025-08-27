import React from 'react'

/**
 * Einfacher Test Block von Aaron
 * @icon 😉
 * @width 2
 * @height 1
 */

const TestAaron = ({ content, block, ...props }) => {
  return (
    <div className='bg-black text-white w-full h-full p-4 rounded-lg'>
      <div className="text-xs text-gray-300 mb-2">🚀 TestAaron Block</div>
      <div className="text-lg font-bold">
        Aaron's Test Block
      </div>
      {block && (
        <div className="text-xs text-gray-400 mt-2">
          ID: {block.id} | Type: {block.block_type}
        </div>
      )}
    </div>
  )
}

export default TestAaron