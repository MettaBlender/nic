/**
 * Grid System Hook für NIC CMS
 *
 * Verwaltet das Grid-Layout, Drag & Drop und Block-Positionierung
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import nicConfig from '../../nic.config.js';
import { useCMS } from '@/context/CMSContext.js';

export const useGridSystem = (containerSize = { width: 1200, height: 800 }) => {
  const [gridConfig, setGridConfig] = useState(nicConfig.grid);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('desktop');
  const [gridRows, setGridRows] = useState(nicConfig.grid.minRows);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [dropZone, setDropZone] = useState(null);
  const {currentPage, setCurrentPage} = useCMS();
  const {mode} = useCMS();

  // Berechne Grid-Dimensionen basierend auf Container-Größe
  const calculateGridDimensions = useCallback(() => {
    const config = nicConfig.grid.breakpoints[currentBreakpoint] || nicConfig.grid;
    const columns = config.columns;
    const gap = nicConfig.grid.gap;

    const cellWidth = (containerSize.width - (gap * (columns + 1))) / columns;
    const cellHeight = config.rowHeight;

    return {
      columns,
      rows: currentPage.rows,
      cellWidth,
      cellHeight,
      gap,
      totalWidth: containerSize.width,
      totalHeight: (cellHeight * currentPage.rows) + (gap * (currentPage.rows + 1))
    };
  }, [containerSize, currentBreakpoint, currentPage.rows]);

  // Ermittle aktuellen Breakpoint
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const breakpoints = nicConfig.grid.breakpoints;

      if (width <= breakpoints.mobile.maxWidth) {
        setCurrentBreakpoint('mobile');
      } else if (width <= breakpoints.tablet.maxWidth) {
        setCurrentBreakpoint('tablet');
      } else {
        setCurrentBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  // Konvertiere Pixel-Position zu Grid-Position
  const pixelToGrid = useCallback((x, y) => {
    const { cellWidth, cellHeight, gap } = calculateGridDimensions();

    const col = Math.floor((x + gap) / (cellWidth + gap));
    const row = Math.floor((y + gap) / (cellHeight + gap));

    return {
      col: Math.max(0, Math.min(col, gridConfig.columns - 1)),
      row: Math.max(0, row)
    };
  }, [calculateGridDimensions, gridConfig.columns]);

  // Konvertiere Grid-Position zu Pixel-Position
  const gridToPixel = useCallback((col, row) => {
    const { cellWidth, cellHeight, gap } = calculateGridDimensions();

    return {
      x: (col * (cellWidth + gap)) + gap,
      y: (row * (cellHeight + gap)) + gap,
      width: cellWidth,
      height: cellHeight
    };
  }, [calculateGridDimensions]);

  // Berechne Block-Dimensionen in Pixeln
  const getBlockPixelSize = useCallback((gridWidth, gridHeight) => {
    const { cellWidth, cellHeight, gap } = calculateGridDimensions();

    return {
      width: (gridWidth * cellWidth) + ((gridWidth - 1) * gap),
      height: (gridHeight * cellHeight) + ((gridHeight - 1) * gap)
    };
  }, [calculateGridDimensions]);

  // Prüfe ob eine Position verfügbar ist
  const isPositionAvailable = useCallback((col, row, width, height, blocks, excludeId = null) => {
    const { columns } = calculateGridDimensions();

    // Prüfe Grid-Grenzen
    if (col < 0 || row < 0 || col + width > columns) {
      return false;
    }

    // Prüfe Kollisionen mit anderen Blöcken
    for (const block of blocks) {
      if (block.id === excludeId) continue;

      const blockEndCol = block.grid_col + block.grid_width;
      const blockEndRow = block.grid_row + block.grid_height;
      const newEndCol = col + width;
      const newEndRow = row + height;

      // Prüfe Überlappung
      if (!(newEndCol <= block.grid_col || col >= blockEndCol ||
            newEndRow <= block.grid_row || row >= blockEndRow)) {
        return false;
      }
    }

    return true;
  }, [calculateGridDimensions]);

  // Finde nächste verfügbare Position
  const findAvailablePosition = useCallback((width, height, blocks, preferredCol = 0, preferredRow = 0) => {
    const { columns } = calculateGridDimensions();

    // Versuche zuerst die bevorzugte Position
    if (isPositionAvailable(preferredCol, preferredRow, width, height, blocks)) {
      return { col: preferredCol, row: preferredRow };
    }

    // Suche von oben nach unten, links nach rechts
    for (let row = 0; row < currentPage.rows + 10; row++) {
      for (let col = 0; col <= columns - width; col++) {
        if (isPositionAvailable(col, row, width, height, blocks)) {
          // Erweitere Grid wenn nötig
          if (row + height > currentPage.rows) {
            setCurrentPage(prev => ({ ...prev, rows: row + height }));
          }
          return { col, row };
        }
      }
    }

    // Fallback: Füge am Ende hinzu
    const newRow = currentPage.rows;
    setCurrentPage(prev => ({ ...prev, rows: newRow + height }));
    return { col: 0, row: newRow };
  }, [calculateGridDimensions, currentPage.rows, isPositionAvailable]);

  // Erweitere Grid um Reihen
  const addRows = useCallback((count = 1) => {
    setCurrentPage(prev => ({ ...prev, rows: prev.rows + count }));
  }, []);

  // Drag & Drop Funktionen
  const startDrag = useCallback((block, sourceType = 'grid') => {
    setIsDragging(true);
    setDraggedBlock({ ...block, sourceType });
  }, []);

  const updateDropZone = useCallback((col, row) => {
    if (!draggedBlock) return;

    const width = draggedBlock.grid_width || nicConfig.defaultBlockSizes[draggedBlock.block_type]?.width || 1;
    const height = draggedBlock.grid_height || nicConfig.defaultBlockSizes[draggedBlock.block_type]?.height || 1;

    setDropZone({
      col,
      row,
      width,
      height,
      valid: isPositionAvailable(col, row, width, height, [], draggedBlock.id)
    });
  }, [draggedBlock, isPositionAvailable]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    setDraggedBlock(null);
    setDropZone(null);
  }, []);

  // Style-Generator für Grid-Container
  const getGridContainerStyle = useCallback(() => {
    const { totalWidth, totalHeight } = calculateGridDimensions();

    if( mode === "preview") {
      return {
        position: 'relative',
        width: `${totalWidth}px`,
        height: `${totalHeight}px`,
        backgroundColor: '#ffffff',
      };
    } else {
      return {
        position: 'relative',
        width: `${totalWidth}px`,
        height: `${totalHeight}px`,
        backgroundColor: '#ffffff',
        backgroundImage: nicConfig.visual.showGridLines ? `
        linear-gradient(to right, ${nicConfig.visual.gridLineColor} 1px, transparent 1px),
        linear-gradient(to bottom, ${nicConfig.visual.gridLineColor} 1px, transparent 1px)
        ` : 'none',
        backgroundSize: nicConfig.visual.showGridLines ? `${calculateGridDimensions().cellWidth + nicConfig.grid.gap}px ${calculateGridDimensions().cellHeight + nicConfig.grid.gap}px` : '100% 100%',
        backgroundPosition: nicConfig.visual.showGridLines ? `4px 4px` : '0 0'
      };
    }
  }, [calculateGridDimensions, mode]);

  // Style-Generator für Grid-Blöcke
  const getBlockStyle = useCallback((block) => {
    const position = gridToPixel(block.grid_col, block.grid_row);
    const size = getBlockPixelSize(block.grid_width, block.grid_height);

    return {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      backgroundColor: block.background_color || 'transparent',
      color: block.text_color || '#000000',
      borderRadius: '6px',
      overflow: 'hidden',
      zIndex: block.z_index || 1,
      border: nicConfig.visual.showBlockOutlines ? '1px solid rgba(0,0,0,1)' : 'none',
      transition: isDragging ? 'none' : 'all 0.2s ease'
    };
  }, [gridToPixel, getBlockPixelSize, isDragging]);

  // Style-Generator für Drop-Zone
  const getDropZoneStyle = useCallback(() => {
    if (!dropZone) return { display: 'none' };

    const position = gridToPixel(dropZone.col, dropZone.row);
    const size = getBlockPixelSize(dropZone.width, dropZone.height);

    return {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      backgroundColor: dropZone.valid ? nicConfig.visual.dropZoneColor : 'rgba(239, 68, 68, 0.3)',
      border: `2px dashed ${dropZone.valid ? '#10b981' : '#ef4444'}`,
      borderRadius: '6px',
      pointerEvents: 'none',
      zIndex: 1000
    };
  }, [dropZone, gridToPixel, getBlockPixelSize]);

  return {
    // Grid-Konfiguration
    gridConfig: calculateGridDimensions(),
    currentBreakpoint,
    gridRows: currentPage.rows,

    // Utility-Funktionen
    pixelToGrid,
    gridToPixel,
    getBlockPixelSize,
    isPositionAvailable,
    findAvailablePosition,
    addRows,

    // Drag & Drop
    isDragging,
    draggedBlock,
    dropZone,
    startDrag,
    updateDropZone,
    endDrag,

    // Style-Generatoren
    getGridContainerStyle,
    getBlockStyle,
    getDropZoneStyle
  };
};
