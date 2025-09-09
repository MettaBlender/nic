/**
 * Image gallery block for multiple images
 * @icon 🖼️
 * @width 4
 * @height 3
 * @options {
 *  images: ["https://images.unsplash.com/photo-1757137910091-1cf071030691?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1689101298132-0edffcc658c9?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1647821172233-d1b0d2926b1e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"]
 * }
 */

import React from 'react';

const GalleryBlock = ({ content, onContentChange, editable = false }) => {
  return (
    <div className="w-full h-full min-h-[120px] bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-3 gap-2 h-full">
        {content?.images?.map((image, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs"
          >
            <img src={image} alt={`Image ${i}`} className="w-full h-full object-cover rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryBlock;
