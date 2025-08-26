import React from 'react';

const CustomBlock = ({ content = {}, ...props }) => {
  const {
    title = 'Custom Block',
    description = 'Dies ist ein custom Block',
    backgroundColor = '#f0f0f0',
    textColor = '#333'
  } = content;

  return (
    <div
      className="custom-block p-6 rounded-lg shadow-md h-full w-full overflow-auto"
      style={{
        backgroundColor: backgroundColor,
        color: textColor,
        minHeight: '120px'
      }}
    >
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-80">{description}</p>
      <div className="mt-4 text-xs opacity-60">
        🎨 Custom Block - Automatisch erkannt
      </div>
    </div>
  );
};

CustomBlock.displayName = 'CustomBlock';

export default CustomBlock;
