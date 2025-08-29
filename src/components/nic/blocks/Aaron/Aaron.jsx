import React from 'react'

/**
 * Einfacher Text Block für Inhalte
 * @icon 🤣
 * @width 3
 * @height 2
 * @options {
 *  text: "Lorem ipsum dolor sit amet"
 * }
 */

const Aaron = ({content}) => {

  console.log('Aaron content:', content);

  // Parse content zu Objekt falls es ein String ist
  let contentObj = {};
  try {
    if (typeof content === 'string') {
      contentObj = JSON.parse(content);
    } else if (typeof content === 'object' && content !== null) {
      contentObj = content;
    }
  } catch (error) {
    console.warn('Could not parse content in Aaron component:', error);
    contentObj = { text: content || 'Aaron Block' };
  }

  return (
    <div className='w-full h-full bg-white p-4 border border-gray-200 rounded'>
      <div className='text-lg font-semibold text-gray-800 mb-2'>
        🤣 Aaron Component
      </div>
      <div className='text-gray-600'>
        {contentObj.text || 'No text content'}
      </div>
      {/* Debug Info */}
      <div className='text-xs text-gray-400 mt-2'>
        Content: {JSON.stringify(contentObj)}
      </div>
    </div>
  )
}

export default Aaron