/**
 * Fallback component for not found block components
 * @icon ⚠️
 */

import React from 'react';

const FallbackBlock = ({ componentName = 'Unknown Component' }) => {
  return (
    <div className="w-full h-full min-h-[60px] flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center text-gray-500">
        <div className="text-2xl mb-1">⚠️</div>
        <div className="text-sm font-medium">Component not found</div>
        <div className="text-xs">{componentName}</div>
      </div>
    </div>
  );
};

export default FallbackBlock;
