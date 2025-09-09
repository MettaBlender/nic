/**
 * Audio Player Block for music and sounds
 * @icon 🎵
 */

import React from 'react';

const AudioBlock = ({ content = '', onContentChange, editable = false }) => {
  return (
    <div className="w-full h-full min-h-[80px] bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
          🎵
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">Audio Player</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div className="bg-blue-500 h-2 rounded-full w-1/3"></div>
          </div>
        </div>
        <button className="w-8 h-8 bg-blue-500 rounded-full text-white text-sm">
          ▶
        </button>
      </div>
    </div>
  );
};

export default AudioBlock;
