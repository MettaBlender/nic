/**
 * Newsletter signup block
 * @icon 📧
 * @width 2
 * @height 3
 */

import React from 'react';

const NewsletterBlock = ({ content = '', onContentChange, editable = false }) => {
  return (
    <div className="w-full h-full min-h-[100px] bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
      <h3 className="text-lg font-semibold mb-2">Newsletter</h3>
      <p className="text-sm mb-3 opacity-90">Stay up to date!</p>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="Your Email"
          className="flex-1 p-2 rounded text-gray-800 text-sm"
          disabled={!editable}
        />
        <button className="bg-white text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100">
          Subscribe
        </button>
      </div>
    </div>
  );
};

export default NewsletterBlock;
