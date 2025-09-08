/**
 * Einfacher Text Block für Inhalte
 * @icon 📝
 * @width 3
 * @height 2
 * @options {
 *  text: "text1"
 * }
 */

'use client';

import React, { useState, useRef, useEffect } from 'react'

const Text = ({ content = '', onContentChange, editable = false, block_type = 'Text' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [textContent, setTextContent] = useState(content);
  const textRef = useRef(null);

  // Besserer Default-Content basierend auf Block-Typ
  const getDefaultContent = () => {
    if (content && content.trim()) return content;

    switch (block_type) {
      case 'Text':
        return editable ? 'Neuer Text Block - Doppelklick zum Bearbeiten' : 'Text Block';
      case 'Heading':
        return editable ? 'Neue Überschrift - Doppelklick zum Bearbeiten' : 'Überschrift';
      case 'Paragraph':
        return editable ? 'Neuer Absatz Text - Doppelklick zum Bearbeiten' : 'Absatz Text';
      default:
        return editable ? `${block_type} Block - Doppelklick zum Bearbeiten` : `${block_type} Block`;
    }
  };

  const displayContent = textContent || getDefaultContent();

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
    setTextContent((prev) => ({ ...prev, text: e.target.value }));
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
          value={textContent.text}
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
          <span style={{
            color: (!textContent.text || !textContent?.text?.trim()) ? '#9ca3af' : 'inherit',
            fontStyle: (!textContent.text || !textContent?.text?.trim()) ? 'italic' : 'normal',
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