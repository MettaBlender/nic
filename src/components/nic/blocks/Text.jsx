/**
 * Simple text block for content
 * @icon 📝
 * @width 3
 * @height 2
 * @options {
 *  text: "text1"
 * }
 */

'use client';

import React, { useState, useRef, useEffect } from 'react'

const Text = ({ content, onContentChange, editable = false, block_type = 'Text' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [textContent, setTextContent] = useState(content.text);
  const textRef = useRef(null);

  // Better default content based on block type
  const getDefaultContent = () => {
    if (content && content?.text?.trim()) return content.text;

    switch (block_type) {
      case 'Text':
        return editable ? 'New Text Block - Double-click to edit' : 'Text Block';
      case 'Heading':
        return editable ? 'New Heading - Double-click to edit' : 'Heading';
      case 'Paragraph':
        return editable ? 'New Paragraph Text - Double-click to edit' : 'Paragraph Text';
      default:
        return editable ? `${block_type} Block - Double-click to edit` : `${block_type} Block`;
    }
  };

  const displayContent = textContent || getDefaultContent();

  useEffect(() => {
    setTextContent(content.text);
  }, [content.text]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (editable) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onContentChange && textContent !== content.text) {
      onContentChange(textContent);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setTextContent(content.text);
      setIsEditing(false);
    }
  };

  const handleChange = (e) => {
    setTextContent(e.target.value);
  };

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      className="w-full h-full flex items-center justify-center p-2"
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={textRef}
          value={textContent}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full resize-none border-none outline-none bg-transparent text-inherit font-inherit text-center"
          style={{
            fontSize: 'inherit',
            fontFamily: 'inherit',
            color: 'inherit',
            backgroundColor: 'transparent'
          }}
          placeholder="Enter text..."
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-center break-words relative">
          <span style={{
            color: (!textContent || !textContent.trim()) ? '#9ca3af' : 'inherit',
            fontStyle: (!textContent || !textContent.trim()) ? 'italic' : 'normal',
            fontSize: block_type === 'Heading' ? '1.5rem' : '1rem',
            fontWeight: block_type === 'Heading' ? 'bold' : 'normal'
          }}>
            {displayContent}
          </span>
          {editable && (
            <div className="absolute inset-0 opacity-0 hover:opacity-20 bg-blue-500 transition-opacity pointer-events-none" />
          )}
        </div>
      )}
    </div>
  )
}

export default Text