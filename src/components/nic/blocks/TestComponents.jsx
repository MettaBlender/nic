import React from 'react'

/**
 * Test Block Component
 * @icon 🧪
 * @description Test component for grid system
 * @options {
 *  title: "test title",
 *  description: "This is a test description",
 * }
 */

const TestComponents = ({ content, block, ...props }) => {
  // Handle different content types
  const renderContent = () => {
    if (!content) {
      return <div className="text-gray-500">Test Block - Kein Inhalt</div>;
    }

    // If content is an object with title/description
    if (typeof content === 'object' && content.title) {
      return (
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-blue-600">{content.title}</h3>
          {content.description && (
            <p className="text-gray-700">{content.description}</p>
          )}
        </div>
      );
    }

    // Fallback for any other content type
    return (
      <div className="text-gray-500">
        Test Block - Unbekannter Content-Typ: {typeof content}
      </div>
    );
  };

  return (
    <div className="p-4 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg">
      <div className="text-xs text-blue-500 mb-2">🧪 TEST COMPONENT</div>
      {renderContent()}
      {block && (
        <div className="text-xs text-gray-400 mt-2">
          Block ID: {block.id} | Type: {block.block_type}
        </div>
      )}
    </div>
  );
};

export default TestComponents;