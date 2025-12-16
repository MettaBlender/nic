/**
 * Automatic Responsive Layout Generator for NIC CMS
 *
 * Automatically adapts block positions and sizes for different devices
 */

/**
 * Grid configuration for different devices
 */
export const RESPONSIVE_GRIDS = {
  desktop: {
    columns: 12,
    minBlockWidth: 2,
    maxBlockWidth: 12,
    rowHeight: 60,
    gap: 16
  },
  tablet: {
    columns: 8,
    minBlockWidth: 2,
    maxBlockWidth: 8,
    rowHeight: 50,
    gap: 12
  },
  mobile: {
    columns: 4,
    minBlockWidth: 2,
    maxBlockWidth: 4,
    rowHeight: 40,
    gap: 8
  }
};

/**
 * Block priority for automatic layout
 * Higher priority blocks are placed first
 */
const BLOCK_PRIORITIES = {
  'header': 100,
  'navigation': 95,
  'hero': 90,
  'title': 85,
  'subtitle': 80,
  'Text': 70,
  'Image': 65,
  'Video': 60,
  'Button': 55,
  'Container': 50,
  'Gallery': 45,
  'ContactForm': 40,
  'Newsletter': 35,
  'default': 30
};

/**
 * Get block priority based on type and content
 */
function getBlockPriority(block) {
  // Check block_type
  if (BLOCK_PRIORITIES[block.block_type]) {
    return BLOCK_PRIORITIES[block.block_type];
  }

  // Check content for semantic hints
  const content = JSON.stringify(block.content || '').toLowerCase();
  if (content.includes('header') || content.includes('headline')) return 90;
  if (content.includes('title')) return 85;
  if (content.includes('hero')) return 88;
  if (content.includes('footer')) return 20;

  // Use z_index as fallback
  return block.z_index || BLOCK_PRIORITIES.default;
}

/**
 * Parse responsive sizes from block metadata
 * Supports @device syntax like @mobile, @tablet, @desktop
 */
function getResponsiveSizes(block, componentDef) {
  const sizes = {
    desktop: {},
    tablet: {},
    mobile: {}
  };

  // Check if block has responsive_sizes stored
  if (block.responsive_sizes) {
    return block.responsive_sizes;
  }

  // Parse from component definition if available
  if (componentDef && componentDef.metadata) {
    const metadata = componentDef.metadata;

    // Parse @width@device and @height@device
    Object.keys(metadata).forEach(key => {
      const match = key.match(/^(width|height)@(mobile|tablet|desktop)$/);
      if (match) {
        const [, dimension, device] = match;
        sizes[device][dimension] = parseInt(metadata[key], 10);
      }
    });

    // Also check for regular @width and @height (default for desktop)
    if (metadata.width) sizes.desktop.width = parseInt(metadata.width, 10);
    if (metadata.height) sizes.desktop.height = parseInt(metadata.height, 10);
  }

  return sizes;
}

/**
 * Calculate responsive block dimensions
 */
function calculateResponsiveSize(block, targetDevice, sourceDevice = 'desktop', componentDef = null) {
  const sourceGrid = RESPONSIVE_GRIDS[sourceDevice];
  const targetGrid = RESPONSIVE_GRIDS[targetDevice];

  // First, check if block has explicit responsive sizes defined
  const responsiveSizes = getResponsiveSizes(block, componentDef);
  if (responsiveSizes[targetDevice] && (responsiveSizes[targetDevice].width || responsiveSizes[targetDevice].height)) {
    return {
      width: responsiveSizes[targetDevice].width || block.grid_width || 4,
      height: responsiveSizes[targetDevice].height || block.grid_height || 2
    };
  }

  // Get original dimensions
  const originalWidth = block.grid_width || Math.round(block.width / (100 / sourceGrid.columns));
  const originalHeight = block.grid_height || Math.max(1, Math.round(block.height / 10));

  // Scale width proportionally
  let newWidth = Math.round((originalWidth / sourceGrid.columns) * targetGrid.columns);

  // Constrain to device limits
  newWidth = Math.max(targetGrid.minBlockWidth, Math.min(newWidth, targetGrid.maxBlockWidth));

  // For mobile, prefer full width for certain block types
  if (targetDevice === 'mobile') {
    const fullWidthTypes = ['Text', 'Image', 'Video', 'Container', 'ContactForm', 'Newsletter'];
    if (fullWidthTypes.includes(block.block_type)) {
      newWidth = targetGrid.columns;
    }
  }

  // For tablet, prefer wider blocks
  if (targetDevice === 'tablet') {
    if (newWidth < targetGrid.columns / 2 && block.block_type !== 'Button') {
      newWidth = Math.min(targetGrid.columns, Math.round(newWidth * 1.5));
    }
  }

  // Height usually stays the same or slightly reduced
  let newHeight = originalHeight;
  if (targetDevice === 'mobile' && originalHeight > 6) {
    newHeight = Math.ceil(originalHeight * 0.8);
  }

  return {
    width: newWidth,
    height: newHeight
  };
}

/**
 * Automatic layout algorithm - places blocks in grid
 */
function autoPlaceBlocks(blocks, deviceType) {
  const grid = RESPONSIVE_GRIDS[deviceType];
  const placedBlocks = [];

  // Create grid map to track occupied cells
  const gridMap = [];
  let maxRows = 20; // Start with reasonable size

  for (let row = 0; row < maxRows; row++) {
    gridMap[row] = new Array(grid.columns).fill(false);
  }

  // Sort blocks by priority (highest first), then by original position
  const sortedBlocks = [...blocks].sort((a, b) => {
    const priorityDiff = getBlockPriority(b) - getBlockPriority(a);
    if (priorityDiff !== 0) return priorityDiff;

    // If same priority, maintain original order (top to bottom, left to right)
    const aRow = a.grid_row || 0;
    const bRow = b.grid_row || 0;
    if (aRow !== bRow) return aRow - bRow;

    const aCol = a.grid_col || 0;
    const bCol = b.grid_col || 0;
    return aCol - bCol;
  });

  // Place each block
  sortedBlocks.forEach(block => {
    const size = calculateResponsiveSize(block, deviceType);

    // Find first available position
    let placed = false;
    for (let row = 0; row < maxRows && !placed; row++) {
      for (let col = 0; col <= grid.columns - size.width && !placed; col++) {
        // Check if space is available
        let available = true;

        for (let r = row; r < row + size.height && r < maxRows; r++) {
          for (let c = col; c < col + size.width; c++) {
            if (gridMap[r] && gridMap[r][c]) {
              available = false;
              break;
            }
          }
          if (!available) break;
        }

        if (available) {
          // Mark cells as occupied
          for (let r = row; r < row + size.height; r++) {
            // Extend grid if needed
            if (r >= maxRows) {
              maxRows = r + 10;
              for (let i = gridMap.length; i < maxRows; i++) {
                gridMap[i] = new Array(grid.columns).fill(false);
              }
            }
            for (let c = col; c < col + size.width; c++) {
              gridMap[r][c] = true;
            }
          }

          // Create positioned block
          placedBlocks.push({
            ...block,
            grid_col: col,
            grid_row: row,
            grid_width: size.width,
            grid_height: size.height,
            // Convert back to percentage for compatibility
            position_x: (col / grid.columns) * 100,
            position_y: row * 5, // Approximate percentage
            width: (size.width / grid.columns) * 100,
            height: size.height * 5
          });

          placed = true;
        }
      }
    }

    // If not placed (shouldn't happen), place at bottom
    if (!placed) {
      const row = maxRows;
      placedBlocks.push({
        ...block,
        grid_col: 0,
        grid_row: row,
        grid_width: size.width,
        grid_height: size.height,
        position_x: 0,
        position_y: row * 5,
        width: (size.width / grid.columns) * 100,
        height: size.height * 5
      });
    }
  });

  return placedBlocks;
}

/**
 * Generate responsive layouts for all devices
 * Returns layouts for mobile, tablet, and desktop
 */
export function generateResponsiveLayouts(blocks, sourceDevice = 'desktop') {
  const layouts = {};

  // Generate layout for each device
  ['mobile', 'tablet', 'desktop'].forEach(device => {
    if (device === sourceDevice) {
      // Use original layout for source device
      layouts[device] = blocks;
    } else {
      // Auto-generate layout for other devices
      layouts[device] = autoPlaceBlocks(blocks, device);
    }
  });

  return layouts;
}

/**
 * Get blocks for specific device from responsive layouts
 */
export function getBlocksForDevice(blocks, deviceType, responsiveLayouts = null) {
  // If no responsive layouts provided, use original blocks
  if (!responsiveLayouts || !responsiveLayouts[deviceType]) {
    return blocks;
  }

  return responsiveLayouts[deviceType];
}

/**
 * Update single block across all responsive layouts
 */
export function updateBlockInAllLayouts(blockId, updates, responsiveLayouts) {
  const newLayouts = { ...responsiveLayouts };

  Object.keys(newLayouts).forEach(device => {
    newLayouts[device] = newLayouts[device].map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    );
  });

  return newLayouts;
}

/**
 * Check if block needs responsive regeneration
 */
export function needsResponsiveRegeneration(oldBlocks, newBlocks) {
  // If block count changed significantly
  if (Math.abs(oldBlocks.length - newBlocks.length) > 2) {
    return true;
  }

  // If major layout changes detected
  const oldPositions = oldBlocks.map(b => `${b.id}-${b.position_x}-${b.position_y}`).sort().join(',');
  const newPositions = newBlocks.map(b => `${b.id}-${b.position_x}-${b.position_y}`).sort().join(',');

  return oldPositions !== newPositions;
}

/**
 * Smart regeneration - only regenerate what's needed
 */
export function smartRegenerateLayouts(currentLayouts, updatedBlocks, changedDevice) {
  const newLayouts = { ...currentLayouts };

  // Update the changed device
  newLayouts[changedDevice] = updatedBlocks;

  // Regenerate other devices from updated device
  const otherDevices = ['mobile', 'tablet', 'desktop'].filter(d => d !== changedDevice);

  otherDevices.forEach(device => {
    newLayouts[device] = autoPlaceBlocks(updatedBlocks, device);
  });

  return newLayouts;
}

/**
 * Export configuration for storage
 */
export function exportResponsiveConfig(responsiveLayouts, pageId) {
  return {
    pageId,
    timestamp: Date.now(),
    version: '1.0',
    layouts: responsiveLayouts
  };
}

/**
 * Import configuration from storage
 */
export function importResponsiveConfig(config) {
  if (!config || !config.layouts) {
    return null;
  }

  return config.layouts;
}
