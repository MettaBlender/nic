import React from 'react'

/**
 * Test Block for @options functionality
 * @icon 🧪
 * @width 3
 * @height 2
 * @options {
 *  text: "Lorem ipsum dolor sit amet",
 *  background_color: "#ffffff",
 *  title: "Test Title",
 *  show_border: true,
 *  padding: 16,
 *  link_url: "https://example.com",
 *  description: "This is a longer description that should be displayed in a textarea field due to its length."
 * }
 */

const TestOptionsBlock = ({ content }) => {
  // Parse content to object if it's a string
  let contentObj = {};
  try {
    if (typeof content === 'string') {
      contentObj = JSON.parse(content);
    } else if (typeof content === 'object' && content !== null) {
      contentObj = content;
    }
  } catch (error) {
    console.warn('Could not parse content in TestOptionsBlock:', error);
    contentObj = { text: content || 'Test Block' };
  }

  const {
    text = 'Default text',
    background_color = '#ffffff',
    title = 'Default Title',
    show_border = false,
    padding = 16,
    link_url = '',
    description = ''
  } = contentObj;

  const blockStyle = {
    backgroundColor: background_color,
    padding: `${padding}px`,
    border: show_border ? '2px solid #ddd' : 'none',
    borderRadius: '8px'
  };

  return (
    <div className='w-full h-full p-2' style={blockStyle}>
      <div className='text-lg font-bold mb-2 text-gray-800'>
        🧪 {title}
      </div>

      <div className='text-sm text-gray-600 mb-2'>
        {text}
      </div>

      {description && (
        <div className='text-xs text-gray-500 mb-2 italic'>
          {description}
        </div>
      )}

      {link_url && (
        <div className='text-xs'>
          <a href={link_url} className='text-blue-500 hover:text-blue-700 underline' target='_blank' rel='noopener noreferrer'>
            Link: {link_url}
          </a>
        </div>
      )}

      {/* Debug Info */}
      <div className='text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200'>
        <strong>Debug:</strong> Border: {show_border ? 'Yes' : 'No'}, Padding: {padding}px
      </div>
    </div>
  );
};

export default TestOptionsBlock;
