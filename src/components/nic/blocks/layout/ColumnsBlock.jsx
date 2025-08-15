/**
 * Spalten-Layout Block für flexible Inhalte
 * @icon 📊
 */

import React from 'react';

const ColumnsBlock = ({ content = '', onContentChange, editable = false }) => {
  return (
    <div className="w-full h-full min-h-[100px] bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex gap-4 h-full">
        <div className="flex-1 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-sm">
          Spalte 1
        </div>
        <div className="flex-1 bg-green-100 rounded flex items-center justify-center text-green-600 text-sm">
          Spalte 2
        </div>
        <div className="flex-1 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-sm">
          Spalte 3
        </div>
      </div>
    </div>
  );
};

export default ColumnsBlock;
