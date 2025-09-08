/**
 * Test Block Component
 * @icon 🧪
 * @description Test component for grid system
 * @options {
 *  name: "button1"
 * }
 */

import React from 'react';

const TestBlock = ({ content = 'Test Block', ...props }) => {
  return (
    <div className="w-full h-full bg-blue-100 border-2 border-blue-300 rounded-lg flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-2xl mb-2">🧪</div>
        <div className="font-semibold text-blue-800">Test Block</div>
        <div className="text-sm text-blue-600">{content?.name}</div>
        <div className="text-xs text-gray-500 mt-2">
          Grid: {props.grid_col || 0}, {props.grid_row || 0}
        </div>
      </div>
    </div>
  );
};

export default TestBlock;
