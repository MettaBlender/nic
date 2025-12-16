/**
 * GridCanvas - Main component for the grid system
 *
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGridSystem } from '../../../hooks/useGridSystem';
import { useCMS } from '../../../context/CMSContext';
import dynamic from 'next/dynamic';
import { remToPixels } from '@/utils/cmsFunctions';

const GridBlock = ({ block, onUpdate, onDelete, isSelected, onSelect, containerRef, gridSystem, mode, pendingOperations, draftChanges }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const blockRef = useRef(null);
  const {setSelectedBlock, componentFiles} = useCMS();
  const [component, setComponent] = useState(null);

  // Force re-render when block position changes
  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [block.grid_col, block.grid_row, block.grid_width, block.grid_height]);

  // Preload component files
  useEffect(() => {
    const processedCategories = {};

    Object.entries(componentFiles).forEach(([categoryName, components]) => {
      processedCategories[categoryName] = components.map(comp => ({
        ...comp,
        Component: dynamic(() =>
          import(`@/components/nic/blocks/${categoryName === 'root' ? '' : categoryName + '/'}${comp.file}`)
            .catch(() => import('@/components/nic/blocks/fallback')), // Fallback on errors
          {
            ssr: false,
            loading: () => (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '32px',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Loading...</span>
              </div>
            )
          }
        )
      }));
    });

    const allItems = Object.values(processedCategories).flat();
    const filteredComponent= allItems.filter(item => item.name === block.block_type)[0];

    setComponent(filteredComponent || null);
  }, [componentFiles]);


  // Keyboard Navigation
  const handleKeyDown = useCallback((e) => {
    if (!isSelected || mode !== 'move') return;

    // Ensure current position values are valid numbers
    const currentCol = typeof block.grid_col === 'number' && !isNaN(block.grid_col) ? block.grid_col : 0;
    const currentRow = typeof block.grid_row === 'number' && !isNaN(block.grid_row) ? block.grid_row : 0;

    let newCol = currentCol;
    let newRow = currentRow;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newCol = Math.max(0, currentCol - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newCol = currentCol + 1;
        break;
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(0, currentRow - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newRow = currentRow + 1;
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        onDelete(block.id);
        return;
      default:
        return;
    }

    // Check if new position is available and update only primitive values
    if (newCol !== currentCol || newRow !== currentRow) {
      // Auto-wrap if block goes beyond grid boundaries
      const maxColumns = 12; // Desktop grid
      const blockWidth = block.grid_width || 2;

      if (newCol + blockWidth > maxColumns) {
        // Move to next row and align to left
        newCol = 0;
        newRow = newRow + 1;
        console.log(`↩️ Auto-wrap: Block moved to next row (${newCol},${newRow})`);
      }

      console.log(`⌨️ Keyboard move: ${block.id} from (${currentCol},${currentRow}) to (${newCol},${newRow})`);
      onUpdate(block.id, {
        grid_col: newCol,
        grid_row: newRow
      });
    }
  }, [isSelected, block.grid_col, block.grid_row, block.id, onUpdate, onDelete, mode]);

  // Event Listener für Keyboard
  useEffect(() => {
    if (isSelected && mode === 'move') {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSelected, handleKeyDown, mode]);

  const handleMouseDown = useCallback((e) => {
    if (mode !== 'move') return; // Disable dragging when not in move mode
    if (e.target.closest('.block-controls') || e.target.closest('button')) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Ensure current position values are valid numbers
    const currentCol = typeof block.grid_col === 'number' && !isNaN(block.grid_col) ? block.grid_col : 0;
    const currentRow = typeof block.grid_row === 'number' && !isNaN(block.grid_row) ? block.grid_row : 0;

    setIsDragging(true);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      blockCol: currentCol,
      blockRow: currentRow,
      containerRect: rect
    });

    // Start das Grid System Drag
    gridSystem.startDrag({
      id: block.id,
      grid_col: currentCol,
      grid_row: currentRow,
      grid_width: block.grid_width || 2,
      grid_height: block.grid_height || 1,
      block_type: block.block_type
    });

    onSelect(block.id);
  }, [block, onSelect, containerRef, gridSystem]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragStart) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Berechne direkte Mouse-Position im Container
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Konvertiere direkt zu Grid-Position
    const newGridPos = gridSystem.pixelToGrid(currentX, currentY);

    // Update Drop Zone mit aktueller Position
    gridSystem.updateDropZone(newGridPos.col, newGridPos.row);
  }, [isDragging, dragStart, containerRef, gridSystem]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !gridSystem.dropZone) return;

    // Move block to new position if valid
    if (gridSystem.dropZone.valid) {
      // Ensure drop zone values are valid numbers
      let validCol = typeof gridSystem.dropZone.col === 'number' && !isNaN(gridSystem.dropZone.col) ? gridSystem.dropZone.col : 0;
      let validRow = typeof gridSystem.dropZone.row === 'number' && !isNaN(gridSystem.dropZone.row) ? gridSystem.dropZone.row : 0;

      // Auto-wrap if block goes beyond grid boundaries (Desktop: 12 columns)
      const maxColumns = 12; // Desktop grid
      const blockWidth = block.grid_width || 2;

      if (validCol + blockWidth > maxColumns) {
        // Move to next row and align to left
        validCol = 0;
        validRow = validRow + 1;
        console.log(`↩️ Auto-wrap: Block moved to next row (${validCol},${validRow})`);
      }

      console.log(`🖱️ Mouse drop: ${block.id} to (${validCol},${validRow})`);
      onUpdate(block.id, {
        grid_col: validCol,
        grid_row: validRow
      });
    }

    setIsDragging(false);
    setDragStart(null);
    gridSystem.endDrag();
  }, [isDragging, gridSystem, onUpdate, block.id, block.grid_width]);  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Recalculate block style whenever block position changes
  const blockStyle = React.useMemo(() => {
    // Check if this block has pending changes
    const hasPendingChanges =
      block.id.toString().startsWith('temp_') || // New block not yet saved
      (typeof pendingOperations !== 'undefined' && pendingOperations instanceof Map && pendingOperations.has(block.id)) || // In pendingOperations
      (Array.isArray(draftChanges) && draftChanges.some(draft => draft.blockId === block.id)); // In draftChanges

    // Check if block exceeds grid boundaries
    const maxColumns = 12; // Desktop grid
    const blockWidth = block.grid_width || 2;
    const exceedsGrid = (block.grid_col || 0) + blockWidth > maxColumns;

    return {
      ...gridSystem.getBlockStyle(block),
      cursor: mode !== 'move' ? 'default' : (isDragging ? 'grabbing' : 'grab'),
      opacity: isDragging ? 0.7 : 1,
      border: exceedsGrid
        ? '2px solid #ef4444' // Red border for out-of-bounds
        : (isSelected && mode !== 'preview')
          ? '2px solid #3b82f6'
          : hasPendingChanges
            ? '2px solid #f59e0b'
            : '1px solid rgba(0,0,0,0.1)',
      boxShadow: exceedsGrid
        ? '0 0 0 2px rgba(239, 68, 68, 0.3)' // Red shadow for warning
        : (isSelected && mode !== 'preview')
          ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
          : hasPendingChanges
            ? '0 0 0 2px rgba(245, 158, 11, 0.2)'
            : 'none',
      outline: 'none', // Remove default focus outline
      zIndex: isDragging ? 1000 : (block.z_index || 1)
    };
  }, [block, gridSystem, mode, isDragging, isSelected, pendingOperations, draftChanges]);

  // Check if block exceeds grid
  const maxColumns = 12;
  const blockWidth = block.grid_width || 2;
  const exceedsGrid = (block.grid_col || 0) + blockWidth > maxColumns;

  return (
    <div
      ref={blockRef}
      style={blockStyle}
      onMouseDown={mode !== 'move' ? undefined : handleMouseDown}
      className="grid-block"
      data-block-id={block.id}
      tabIndex={isSelected ? 0 : -1} // Make focusable when selected
      onClick={() => {setSelectedBlock(block)}}
      title={exceedsGrid ? `⚠️ Block überschreitet Grid-Grenzen! Wird auf Tablet/Mobile umgebrochen.` : ''}
    >
      {/* Warning badge for out-of-bounds blocks */}
      {exceedsGrid && mode !== 'preview' && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: '#ef4444',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
          zIndex: 1001,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          ⚠️ Grid
        </div>
      )}

      {/* Block Content */}
      <div style={{
        width: '100%',
        height: '100%',
        padding: '0px',
        overflow: 'hidden'
      }}>
        {component ? (
          <React.Suspense fallback={<div className="animate-pulse bg-gray-200 h-full rounded"></div>}>
            <component.Component
              content={block.content || ''}
              block_type={block.block_type || ''}
              background_color={block.background_color || 'transparent'}
              text_color={block.text_color || '#000000'}
              editable={true}
              onContentChange={(newContent) => onUpdate(block.id, { content: newContent })}
            />
          </React.Suspense>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            fontSize: '14px',
            padding: '8px',
            textAlign: 'center'
          }}>
            <div>
              <div className="font-bold">Komponente "{String(block.block_type)}" nicht gefunden</div>
              <div className="text-xs mt-1">Debug: Content = "{String(block.content)}"</div>
              <div className="text-xs">Type = "{String(block.block_type)}"</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const GridCanvas = () => {
  const {
    blocks,
    updateBlock,
    deleteBlock,
    createBlock,
    mode,
    layoutSettings,
    getCurrentDeviceBlocks,
    deviceSize,
    autoResponsiveEnabled,
    pendingOperations,
    draftChanges
  } = useCMS();

  // Always use blocks directly - responsive layouts are for viewing only, not editing
  // When editing, always show and modify the actual desktop blocks
  const displayBlocks = blocks;

  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // Status für Speicher-Feedback
  const containerRef = useRef(null);

  const {setSelectedBlock: setSelectedBlockCMS, selectedBlock: selectedBlockCMS, loadComponents, sidebarOpen} = useCMS();

  useEffect(() => {
    // Calculate container size based on device and mode
    let width = window.innerWidth;

    if (mode === 'preview') {
      width = window.innerWidth - remToPixels(1);
    } else {
      // Adjust for sidebar
      const sidebarWidth = sidebarOpen ? 21 : 5;
      const detailSidebarWidth = selectedBlockCMS != null ? 24 : 0;
      width = window.innerWidth - remToPixels(sidebarWidth + detailSidebarWidth);
    }

    // Adjust width for device simulation
    if (autoResponsiveEnabled && mode !== 'preview') {
      if (deviceSize === 'mobile') {
        width = Math.min(width, 375); // Max mobile width
      } else if (deviceSize === 'tablet') {
        width = Math.min(width, 768); // Max tablet width
      }
    }

    setContainerSize({ width, height: 800 });
  }, [mode, selectedBlockCMS, sidebarOpen, deviceSize, autoResponsiveEnabled]);

  // Improved update function with immediate UI update
  const handleUpdateBlock = useCallback((id, data) => {
    setSaveStatus('Änderung...');

    try {
      // Immediate UI update - adds to pending changes
      updateBlock(id, data);

      // Force re-render by updating selected block if it's the one being updated
      if (selectedBlock?.id === id) {
        setSelectedBlock(prev => prev ? { ...prev, ...data } : prev);
      }

      setSaveStatus('✓ Geändert');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error updating block:', error);
      setSaveStatus('✗ Error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  }, [updateBlock, selectedBlock]);

  // Improved delete function with feedback
  const handleDeleteBlock = useCallback((id) => {
    setSaveStatus('Markiere zum Löschen...');

    try {
      deleteBlock(id);
      setSelectedBlock(null);
      setSelectedBlockCMS(null);
      setSaveStatus('✓ Zum Löschen markiert');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error deleting block:', error);
      setSaveStatus('✗ Error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  }, [deleteBlock, setSelectedBlockCMS]);
  useEffect(() => {
    if (displayBlocks.length > 0) {
      let needsUpdate = false;
      const fixedBlocks = displayBlocks.map((block, index) => {
        const currentCol = typeof block.grid_col === 'number' && !isNaN(block.grid_col) ? block.grid_col : 0;
        const currentRow = typeof block.grid_row === 'number' && !isNaN(block.grid_row) ? block.grid_row : Math.floor(index / 4);

        if (currentCol !== block.grid_col || currentRow !== block.grid_row) {
          needsUpdate = true;
          handleUpdateBlock(block.id, {
            grid_col: currentCol,
            grid_row: currentRow,
            grid_width: typeof block.grid_width === 'number' && !isNaN(block.grid_width) ? block.grid_width : 2,
            grid_height: typeof block.grid_height === 'number' && !isNaN(block.grid_height) ? block.grid_height : 1
          });
        }
        return block;
      });
    }
  }, [displayBlocks.length]); // Only run when blocks array length changes

  const {
    getGridContainerStyle,
    getDropZoneStyle,
    pixelToGrid,
    updateDropZone,
    endDrag,
    isDragging,
    dropZone,
    addRows,
    startDrag,
    getBlockStyle,
    deleteLastRow
  } = useGridSystem(containerSize, layoutSettings);

  // Create gridSystem object to pass to components
  const gridSystem = {
    getBlockStyle,
    pixelToGrid,
    updateDropZone,
    endDrag,
    startDrag,
    dropZone,
    isDragging
  };

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle canvas click (deselect blocks)
  const handleCanvasClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      setSelectedBlock(null);
    }
  }, []);

  // Handle drop from sidebar mit verbesserter Collision Detection
  const handleDrop = useCallback((e) => {
    e.preventDefault();

    const blockData = e.dataTransfer.getData('application/json');
    if (!blockData) return;

    const newBlock = JSON.parse(blockData);
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridPos = pixelToGrid(x, y);

    // Ensure grid position values are valid numbers
    const validCol = typeof gridPos.col === 'number' && !isNaN(gridPos.col) ? Math.max(0, gridPos.col) : 0;
    const validRow = typeof gridPos.row === 'number' && !isNaN(gridPos.row) ? Math.max(0, gridPos.row) : 0;

    // Collision Detection
    const blockWidth = newBlock.grid_width || 2;
    const blockHeight = newBlock.grid_height || 1;

    const isPositionFree = (col, row) => {
      return !blocks.some(existingBlock => {
        const exCol = existingBlock.grid_col || 0;
        const exRow = existingBlock.grid_row || 0;
        const exWidth = existingBlock.grid_width || 2;
        const exHeight = existingBlock.grid_height || 1;

        // Prüfe Überlappung
        return !(col + blockWidth <= exCol || col >= exCol + exWidth ||
                 row + blockHeight <= exRow || row >= exRow + exHeight);
      });
    };

    let finalCol = validCol;
    let finalRow = validRow;

    // Wenn Position nicht frei ist, finde nächste freie Position
    if (!isPositionFree(validCol, validRow)) {
      let found = false;

      // Versuche Positionen in der Nähe
      for (let rowOffset = 0; rowOffset < 5 && !found; rowOffset++) {
        for (let colOffset = -2; colOffset <= 2 && !found; colOffset++) {
          const newCol = Math.max(0, Math.min(12 - blockWidth, validCol + colOffset));
          const newRow = validRow + rowOffset;

          if (isPositionFree(newCol, newRow)) {
            finalCol = newCol;
            finalRow = newRow;
            found = true;
          }
        }
      }

      // Fallback: neue Zeile am Ende
      if (!found) {
        finalCol = 0;
        finalRow = Math.max(...blocks.map(b => (b.grid_row || 0) + (b.grid_height || 1)), 0);
      }
    }

    // Validate and auto-wrap if needed
    const maxColumns = 12; // Desktop grid
    if (finalCol + blockWidth > maxColumns) {
      finalCol = 0;
      finalRow = finalRow + 1;
      console.log(`↩️ Auto-wrap on create: Block moved to next row (${finalCol},${finalRow})`);
    }

    // Erstelle Block mit optimaler Position und Standard-Content
    const blockWithPosition = {
      block_type: newBlock.block_type,
      content: newBlock.options || {},
      grid_col: finalCol,
      grid_row: finalRow,
      grid_width: blockWidth,
      grid_height: blockHeight,
      background_color: newBlock.background_color || 'transparent',
      text_color: newBlock.text_color || '#000000',
      z_index: newBlock.z_index || 1,
    };

    // Add block via context
    const result = createBlock(blockWithPosition);
    if (!result) {
      console.warn('Block konnte nicht erstellt werden - Fallback verhindert');
    }
  }, [pixelToGrid, createBlock, displayBlocks]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();

    if (isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridPos = pixelToGrid(x, y);
    updateDropZone(gridPos.col, gridPos.row);
  }, [isDragging, pixelToGrid, updateDropZone]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflow: 'auto',
      position: 'relative'
    }}>
      {/* Grid Toolbar */}
      {mode !== 'preview' && <div className='bg-background sticky top-0 z-100 border-b border-accent px-2 py-6 flex gap-3 items-center'>
        <button
          onClick={() => addRows(1)}
          className='bg-accent/10 hover:bg-background text-white ring ring-accent rounded-md px-4 py-2 cursor-pointer'
        >
          + Add Row
        </button>
        <button
          onClick={() => deleteLastRow()}
          className='bg-accent/10 hover:bg-background text-white ring ring-accent rounded-md px-4 py-2 cursor-pointer'
        >
          - Delete last row
        </button>

        <button
          onClick={() => {
            if (confirm('Delete all blocks? This action cannot be undone.')) {
              blocks.forEach(block => {
                handleDeleteBlock(block.id);
              });
            }
          }}
          className='bg-accent/10 hover:bg-accent-red/20 text-foreground ring ring-accent hover:ring-accent-red cursor-pointer rounded-md px-4 py-2'
        >
          Delete all
        </button>

        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Grid: {Math.floor(containerSize.width / 100)} x {Math.floor(containerSize.height / 100)}
          {(() => {
            // Count blocks that exceed grid
            const maxColumns = 12;
            const outOfBoundsBlocks = displayBlocks.filter(b =>
              (b.grid_col || 0) + (b.grid_width || 2) > maxColumns
            );

            if (outOfBoundsBlocks.length > 0) {
              return (
                <span style={{ marginLeft: '16px', color: '#ef4444', fontWeight: 'bold' }}>
                  | ⚠️ {outOfBoundsBlocks.length} Block{outOfBoundsBlocks.length > 1 ? 's' : ''} außerhalb Grid
                </span>
              );
            }
            return null;
          })()}
          {selectedBlock && (() => {
            const selectedBlockData = blocks.find(b => b.id === selectedBlock);
            if (!selectedBlockData) return null;

            // Ensure values are valid numbers, provide fallbacks
            const col = typeof selectedBlockData.grid_col === 'number' && !isNaN(selectedBlockData.grid_col)
              ? selectedBlockData.grid_col
              : 0;
            const row = typeof selectedBlockData.grid_row === 'number' && !isNaN(selectedBlockData.grid_row)
              ? selectedBlockData.grid_row
              : 0;

            return (
              <span style={{ marginLeft: '16px', color: '#3b82f6' }}>
                | Ausgewählt: Position ({col}, {row}) | Block-ID: {String(selectedBlockData.id)}
              </span>
            );
          })()}
          {saveStatus && (
            <span style={{
              marginLeft: '16px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: saveStatus.includes('✓') ? '#10b981' : saveStatus.includes('✗') ? '#ef4444' : '#f59e0b',
              color: 'white'
            }}>
              {saveStatus}
            </span>
          )}
        </div>
      </div>}

      {/* Grid Container */}
      <div className={`
        ${autoResponsiveEnabled && deviceSize !== 'desktop' ? 'flex justify-center items-start' : ''}
      `}>
        {/* Device Frame für Mobile/Tablet */}
        {autoResponsiveEnabled && deviceSize !== 'desktop' && (
          <div className={`
            ${deviceSize === 'mobile' ? 'max-w-[375px]' : 'max-w-[768px]'}
            w-full border-4 rounded-lg shadow-2xl bg-white
            ${deviceSize === 'mobile' ? 'border-gray-800' : 'border-gray-600'}
            relative overflow-hidden
          `}>
            {/* Device Notch/Camera für Mobile */}
            {deviceSize === 'mobile' && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-gray-800 rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-12 h-1 bg-gray-700 rounded"></div>
              </div>
            )}

            {/* Content */}
            <div
              ref={containerRef}
              style={{...getGridContainerStyle(), margin: 0}}
              onClick={handleCanvasClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {/* Render Blocks */}
              {displayBlocks?.map((block) => (
                <GridBlock
                  key={block.id}
                  block={block}
                  onUpdate={handleUpdateBlock}
                  onDelete={handleDeleteBlock}
                  isSelected={selectedBlock === block.id}
                  onSelect={mode === 'preview' ? () => {} : setSelectedBlock}
                  containerRef={containerRef}
                  gridSystem={gridSystem}
                  mode={mode}
                  pendingOperations={pendingOperations}
                  draftChanges={draftChanges}
                />
              ))}

              {/* Drop Zone */}
              <div style={getDropZoneStyle()} className="drop-zone" />
            </div>

            {/* Device Home Button für Mobile */}
            {deviceSize === 'mobile' && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full"></div>
            )}
          </div>
        )}

        {/* Normal Desktop View */}
        {(!autoResponsiveEnabled || deviceSize === 'desktop') && (
          <div
            ref={containerRef}
            style={getGridContainerStyle()}
            onClick={handleCanvasClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {/* Render Blocks */}
            {displayBlocks?.map((block) => (
              <GridBlock
                key={block.id}
                block={block}
                onUpdate={handleUpdateBlock}
                onDelete={handleDeleteBlock}
                isSelected={selectedBlock === block.id}
                onSelect={mode === 'preview' ? () => {} : setSelectedBlock}
                containerRef={containerRef}
                gridSystem={gridSystem}
                mode={mode}
                pendingOperations={pendingOperations}
                draftChanges={draftChanges}
              />
            ))}

            {/* Drop Zone */}
            <div style={getDropZoneStyle()} className="drop-zone" />
          </div>
        )}
      </div>
    </div>
  );
};

export default GridCanvas;
