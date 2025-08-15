/**
 * Grid-Layout Block für strukturierte Inhalte
 * @icon 📐
 */

import React from 'react';

const GridBlock = ({ content = '', onContentChange, editable = false }) => {
  return (
    <div className="w-full h-full min-h-[120px] bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-2 gap-4 h-full">
        <div className="bg-blue-100 rounded flex items-center justify-center text-blue-600 text-sm">
          Grid 1
        </div>
        <div className="bg-green-100 rounded flex items-center justify-center text-green-600 text-sm">
          Grid 2
        </div>
        <div className="bg-purple-100 rounded flex items-center justify-center text-purple-600 text-sm">
          Grid 3
        </div>
        <div className="bg-orange-100 rounded flex items-center justify-center text-orange-600 text-sm">
          Grid 4
        </div>
      </div>
    </div>
  );
};

export default GridBlock;
