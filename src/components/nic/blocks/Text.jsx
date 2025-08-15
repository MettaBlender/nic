/**
 * Einfacher Text Block für Inhalte
 * @icon 📝
 */

'use client';

import React, { useState, useRef, useEffect } from 'react'

const Text = ({ content = 'Text Block', onContentChange, editable = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [textContent, setTextContent] = useState(content);
  const textRef = useRef(null);

  useEffect(() => {
    setTextContent(content);
  }, [content]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (editable) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onContentChange && textContent !== content) {
      onContentChange(textContent);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setTextContent(content);
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
          placeholder="Text eingeben..."
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-center break-words relative">
          {textContent || 'Text Block'}
          {editable && (
            <div className="absolute inset-0 opacity-0 hover:opacity-20 bg-blue-500 transition-opacity pointer-events-none" />
          )}
        </div>
      )}
    </div>
  )
}

export default Text