/**
 * Bildergalerie Block für mehrere Bilder
 * @icon 🖼️
 */

import React from 'react';

const GalleryBlock = ({ content = '', onContentChange, editable = false }) => {
  return (
    <div className="w-full h-full min-h-[120px] bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-3 gap-2 h-full">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs"
          >
            Bild {i}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryBlock;
