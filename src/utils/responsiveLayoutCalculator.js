/**
 * Smart Responsive Layout Calculator
 * Converts desktop layouts to tablet and mobile layouts intelligently
 */

const GRID_CONFIGS = {
  desktop: { columns: 12, minBlockWidth: 2, maxBlockWidth: 12 },
  tablet: { columns: 8, minBlockWidth: 2, maxBlockWidth: 8 },
  mobile: { columns: 4, minBlockWidth: 2, maxBlockWidth: 4 }
};

/**
 * Check if position is available in the grid
 */
function isPositionAvailable(col, row, width, height, occupiedCells) {
  for (let r = row; r < row + height; r++) {
    for (let c = col; c < col + width; c++) {
      const key = `${r},${c}`;
      if (occupiedCells.has(key)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Mark cells as occupied
 */
function occupyCells(col, row, width, height, occupiedCells) {
  for (let r = row; r < row + height; r++) {
    for (let c = col; c < col + width; c++) {
      occupiedCells.add(`${r},${c}`);
    }
  }
}

/**
 * Find next available position in grid
 */
function findNextAvailablePosition(width, height, occupiedCells, startRow, targetColumns) {
  let currentRow = startRow;

  // Try up to 100 rows (should be more than enough)
  for (let row = currentRow; row < currentRow + 100; row++) {
    for (let col = 0; col <= targetColumns - width; col++) {
      if (isPositionAvailable(col, row, width, height, occupiedCells)) {
        return { col, row };
      }
    }
  }

  // Fallback: place at bottom
  return { col: 0, row: currentRow + 100 };
}

/**
 * Calculate responsive width based on original width and target device
 */
function calculateResponsiveWidth(originalWidth, sourceColumns, targetColumns, blockType) {
  // Scale proportionally
  let newWidth = Math.round((originalWidth / sourceColumns) * targetColumns);

  // Constrain to grid limits
  const config = GRID_CONFIGS[targetColumns === 8 ? 'tablet' : 'mobile'];
  newWidth = Math.max(config.minBlockWidth, Math.min(newWidth, config.maxBlockWidth));

  // Mobile: prefer full width for most block types
  if (targetColumns === 4) {
    const fullWidthTypes = ['Text', 'Image', 'Video', 'Container', 'ContactForm', 'Newsletter', 'Gallery'];
    if (fullWidthTypes.includes(blockType)) {
      return 4;
    }
    // Buttons and small blocks can be narrower
    if (newWidth < 4 && blockType === 'Button') {
      return Math.min(newWidth, 4);
    }
  }

  // Tablet: ensure reasonable widths
  if (targetColumns === 8) {
    // Avoid too narrow blocks
    if (newWidth < 3 && blockType !== 'Button') {
      newWidth = Math.min(4, targetColumns);
    }
  }

  return newWidth;
}

/**
 * Convert desktop layout to responsive layout for target device
 */
export function calculateResponsiveLayout(blocks, targetDevice = 'desktop') {
  if (targetDevice === 'desktop') {
    // No conversion needed for desktop
    return blocks.map(block => ({
      ...block,
      responsive_col: block.grid_col,
      responsive_row: block.grid_row,
      responsive_width: block.grid_width,
      responsive_height: block.grid_height
    }));
  }

  const targetColumns = GRID_CONFIGS[targetDevice].columns;
  const sourceColumns = GRID_CONFIGS.desktop.columns;

  // Sort blocks by position (row first, then column)
  const sortedBlocks = [...blocks].sort((a, b) => {
    const rowDiff = (a.grid_row || 0) - (b.grid_row || 0);
    if (rowDiff !== 0) return rowDiff;
    return (a.grid_col || 0) - (b.grid_col || 0);
  });

  const occupiedCells = new Set();
  const responsiveBlocks = [];

  for (const block of sortedBlocks) {
    const originalWidth = block.grid_width || 2;
    const originalHeight = block.grid_height || 1;

    // Calculate new width
    let newWidth = calculateResponsiveWidth(
      originalWidth,
      sourceColumns,
      targetColumns,
      block.block_type
    );

    // Height adjustment for mobile
    let newHeight = originalHeight;
    if (targetDevice === 'mobile' && originalHeight > 4) {
      // Reduce very tall blocks slightly on mobile
      newHeight = Math.ceil(originalHeight * 0.9);
    }

    // Find next available position
    let currentRow = 0;

    // Try to maintain relative vertical position
    const relativeRow = Math.floor((block.grid_row || 0) * 0.8);
    currentRow = relativeRow;

    // Ensure width fits in grid
    if (newWidth > targetColumns) {
      newWidth = targetColumns;
    }

    const position = findNextAvailablePosition(
      newWidth,
      newHeight,
      occupiedCells,
      currentRow,
      targetColumns
    );

    // Mark cells as occupied
    occupyCells(position.col, position.row, newWidth, newHeight, occupiedCells);

    responsiveBlocks.push({
      ...block,
      responsive_col: position.col,
      responsive_row: position.row,
      responsive_width: newWidth,
      responsive_height: newHeight
    });
  }

  return responsiveBlocks;
}

/**
 * Calculate the minimum grid rows needed for blocks
 */
export function calculateMinGridRows(blocks) {
  if (!blocks || blocks.length === 0) return 1;

  let maxRow = 0;
  for (const block of blocks) {
    const blockEndRow = (block.responsive_row || block.grid_row || 0) +
                       (block.responsive_height || block.grid_height || 1);
    maxRow = Math.max(maxRow, blockEndRow);
  }

  return Math.max(maxRow, 1);
}

/**
 * Get device type from window width (for client-side)
 */
export function getDeviceType(width) {
  if (width <= 768) return 'mobile';
  if (width <= 1024) return 'tablet';
  return 'desktop';
}
