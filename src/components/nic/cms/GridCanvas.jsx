/**
 * GridCanvas - Hauptkomponente für das Grid-System
 *
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGridSystem } from '../../../hooks/useGridSystem';
import { useCMS } from '../../../context/CMSContext';
import dynamic from 'next/dynamic';
import { remToPixels } from '@/utils/cmsFunctions';

const GridBlock = ({ block, onUpdate, onDelete, isSelected, onSelect, containerRef, gridSystem, mode }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const blockRef = useRef(null);
  const {setSelectedBlock, componentFiles} = useCMS();
  const [component, setComponent] = useState(null);

  // Preload component files
  useEffect(() => {
    const processedCategories = {};

    Object.entries(componentFiles).forEach(([categoryName, components]) => {
      processedCategories[categoryName] = components.map(comp => ({
        ...comp,
        Component: dynamic(() =>
          import(`@/components/nic/blocks/${categoryName === 'root' ? '' : categoryName + '/'}${comp.file}`)
            .catch(() => import('@/components/nic/blocks/fallback')), // Fallback bei Fehlern
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
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Lädt...</span>
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

    // Prüfe ob neue Position verfügbar ist und aktualisiere nur primitive Werte
    if (newCol !== currentCol || newRow !== currentRow) {
      console.log(`Moving block ${String(block.id)} from (${currentCol}, ${currentRow}) to (${newCol}, ${newRow})`);
      onUpdate(block.id, {
        grid_col: newCol,
        grid_row: newRow
      });
    }
  }, [isSelected, block.grid_col, block.grid_row, block.id, onUpdate, onDelete]);

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
    console.log(`Start dragging block ${String(block.id)} from (${currentCol}, ${currentRow})`);
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
      const validCol = typeof gridSystem.dropZone.col === 'number' && !isNaN(gridSystem.dropZone.col) ? gridSystem.dropZone.col : 0;
      const validRow = typeof gridSystem.dropZone.row === 'number' && !isNaN(gridSystem.dropZone.row) ? gridSystem.dropZone.row : 0;

      console.log(`Mouse drop: Moving block ${String(block.id)} to (${validCol}, ${validRow})`);
      onUpdate(block.id, {
        grid_col: validCol,
        grid_row: validRow
      });
    }

    setIsDragging(false);
    setDragStart(null);
    gridSystem.endDrag();
  }, [isDragging, gridSystem, onUpdate, block.id]);  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const blockStyle = {
    ...gridSystem.getBlockStyle(block),
    cursor: mode !== 'move' ? 'default' : (isDragging ? 'grabbing' : 'grab'),
    opacity: isDragging ? 0.7 : 1,
    border: (isSelected && mode !== 'preview') ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.1)',
    boxShadow: (isSelected && mode !== 'preview') ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
    outline: 'none', // Remove default focus outline
    zIndex: isDragging ? 1000 : (block.z_index || 1)
  };

  return (
    <div
      ref={blockRef}
      style={blockStyle}
      onMouseDown={mode !== 'move' ? undefined : handleMouseDown}
      className="grid-block"
      data-block-id={block.id}
      tabIndex={isSelected ? 0 : -1} // Make focusable when selected
      onClick={() => {setSelectedBlock(block)}}
    >
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
  const { blocks, updateBlock, deleteBlock, createBlock, mode } = useCMS();
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // Status für Speicher-Feedback
  const containerRef = useRef(null);

  const {setSelectedBlock: setSelectedBlockCMS, selectedBlock: selectedBlockCMS, loadComponents, sidebarOpen} = useCMS();

  useEffect(() => {
    if (mode === 'preview') {
      setContainerSize({ width: window.innerWidth - remToPixels(1), height: window.innerHeight });
    } else {
      if(selectedBlockCMS != null) {
        setContainerSize({ width: window.innerWidth - remToPixels(sidebarOpen ? 45 : 29), height: 800 });
      } else {
        setContainerSize({ width: window.innerWidth - remToPixels(sidebarOpen ? 21 : 5), height: 800 });
      }
    }
  }, [mode, selectedBlockCMS, sidebarOpen]);

  // Improved update function with save feedback
  const handleUpdateBlock = useCallback((id, data) => {
    setSaveStatus('Speichere...');
    console.log(`Updating block ${String(id)} with data:`, data);

    try {
      updateBlock(id, data);
      setSaveStatus('✓ Gespeichert');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error updating block:', error);
      setSaveStatus('✗ Fehler beim Speichern');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  }, [updateBlock]);

  // Improved delete function with feedback
  const handleDeleteBlock = useCallback((id) => {
    setSaveStatus('Lösche...');
    console.log(`Deleting block ${String(id)}`);

    try {
      deleteBlock(id);
      setSelectedBlock(null);
      setSelectedBlockCMS(null);
      setSaveStatus('✓ Gelöscht');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error deleting block:', error);
      setSaveStatus('✗ Fehler beim Löschen');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  }, [deleteBlock]);
  useEffect(() => {
    if (blocks.length > 0) {
      let needsUpdate = false;
      const fixedBlocks = blocks.map((block, index) => {
        const currentCol = typeof block.grid_col === 'number' && !isNaN(block.grid_col) ? block.grid_col : 0;
        const currentRow = typeof block.grid_row === 'number' && !isNaN(block.grid_row) ? block.grid_row : Math.floor(index / 4);

        if (currentCol !== block.grid_col || currentRow !== block.grid_row) {
          needsUpdate = true;
          console.log(`Fixing block ${String(block.id)}: grid_col=${block.grid_col} -> ${currentCol}, grid_row=${block.grid_row} -> ${currentRow}`);
          handleUpdateBlock(block.id, {
            grid_col: currentCol,
            grid_row: currentRow,
            grid_width: typeof block.grid_width === 'number' && !isNaN(block.grid_width) ? block.grid_width : 2,
            grid_height: typeof block.grid_height === 'number' && !isNaN(block.grid_height) ? block.grid_height : 1
          });
        }
        return block;
      });

      if (needsUpdate) {
        console.log('Fixed blocks with invalid grid positions');
      }
    }
  }, [blocks.length]); // Only run when blocks array length changes

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
    getBlockStyle
  } = useGridSystem(containerSize);

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

    // Block über Context hinzufügen
    createBlock(blockWithPosition);
    console.log(`✅ Block hinzugefügt: ${newBlock.block_type} an Position (${finalCol}, ${finalRow})`);
  }, [pixelToGrid, createBlock, blocks]);

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
          + Zeile hinzufügen
        </button>
        <button
          onClick={async () => {
            console.log('🔄 Refreshing components...');
            try {
              await loadComponents();
              alert(`✅ Komponenten neu geladen!`);
            } catch (error) {
              console.error('❌ Error refreshing components:', error);
              alert('❌ Fehler beim Neuladen der Komponenten');
            }
          }}
          className='bg-accent/10 hover:bg-background text-white ring ring-accent cursor-pointer rounded-md px-4 py-2'
        >
          🔄 Komponenten neu laden
        </button>

        <button
          onClick={() => {
            if (confirm('Alle Blöcke löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
              console.log('Clearing all blocks...');
              blocks.forEach(block => {
                handleDeleteBlock(block.id);
              });
            }
          }}
          className='bg-accent/10 hover:bg-accent-red/20 text-foreground ring ring-accent hover:ring-accent-red cursor-pointer rounded-md px-4 py-2'
        >
          Alle löschen
        </button>

        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Grid: {Math.floor(containerSize.width / 100)} x {Math.floor(containerSize.height / 100)}
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
      <div
        ref={containerRef}
        style={getGridContainerStyle()}
        onClick={handleCanvasClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Render Blocks */}
        {blocks?.map((block) => (
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
          />
        ))}

        {/* Drop Zone */}
        <div style={getDropZoneStyle()} className="drop-zone" />
      </div>
    </div>
  );
};

export default GridCanvas;
