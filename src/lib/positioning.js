// Utility-Funktionen für die Positionierung der Blöcke

export const toRelativePosition = (x, y, containerWidth, containerHeight) => {
  return {
    x: (x / containerWidth) * 100,
    y: (y / containerHeight) * 100
  };
};

export const toAbsolutePosition = (xPercent, yPercent, containerWidth, containerHeight) => {
  return {
    x: (xPercent / 100) * containerWidth,
    y: (yPercent / 100) * containerHeight
  };
};

export const clampPosition = (position, minX = 0, minY = 0, maxX = 100, maxY = 100) => {
  return {
    x: Math.max(minX, Math.min(maxX, position.x)),
    y: Math.max(minY, Math.min(maxY, position.y))
  };
};

export const snapToGrid = (position, gridSize = 1) => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
};

export const getRandomPosition = (width = 20, height = 20) => {
  return {
    x: Math.random() * (100 - width),
    y: Math.random() * (100 - height)
  };
};
