/**
 * GridCanvas - Hauptkomponente für das Grid-System
 *
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGridSystem } from '../../../hooks/useGridSystem';
import { useCMS } from '../../../context/CMSContext';
import { resolveComponentSync, preloadCommonComponents, refreshComponents, getDebugInfo } from '@/utils/hybridComponentResolver';

const GridBlock = ({ block, onUpdate, onDelete, isSelected, onSelect, containerRef, gridSystem, mode }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const blockRef = useRef(null);
  const {setSelectedBlock} = useCMS();

  // Lade die Komponente dynamisch
  const Component = resolveComponentSync(block.block_type);

  // Keyboard Navigation
  const handleKeyDown = useCallback((e) => {
    if (!isSelected || mode === 'preview') return;

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
    if (isSelected && mode !== 'preview') {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSelected, handleKeyDown, mode]);

  const handleMouseDown = useCallback((e) => {
    if (mode === 'preview') return; // Disable dragging in preview mode
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
    cursor: mode === 'preview' ? 'default' : (isDragging ? 'grabbing' : 'grab'),
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
      onMouseDown={mode === 'preview' ? undefined : handleMouseDown}
      className="grid-block"
      data-block-id={block.id}
      tabIndex={isSelected ? 0 : -1} // Make focusable when selected
      onClick={() => {setSelectedBlock(block)}}
    >
      {/* Block Controls */}
      {isSelected && mode !== 'preview' && (
        <div className="block-controls" style={{
          position: 'absolute',
          top: '-30px',
          right: '0',
          display: 'flex',
          gap: '4px',
          zIndex: 1001
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '10px',
            whiteSpace: 'nowrap'
          }}>
            ↑↓←→ bewegen | Del löschen
          </div>
          <button
            onClick={() => onDelete(block.id)}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Löschen
          </button>
        </div>
      )}

      {/* Block Content */}
      <div style={{
        width: '100%',
        height: '100%',
        padding: '8px',
        overflow: 'hidden'
      }}>
        {Component ? (
          <Component
            content={block.content || ''}
            block_type={block.block_type || ''}
            background_color={block.background_color || 'transparent'}
            text_color={block.text_color || '#000000'}
            editable={true}
            onContentChange={(newContent) => onUpdate(block.id, { content: newContent })}
          />
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

      {/* Resize Handles
      {isSelected && (
        <>
          <div className="resize-handle resize-se" style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '10px',
            height: '10px',
            background: '#3b82f6',
            cursor: 'se-resize',
            borderRadius: '2px'
          }} />
        </>
      )} */}
    </div>
  );
};

const GridCanvas = () => {
  const { blocks, updateBlock, deleteBlock, createBlock, mode } = useCMS();
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // Status für Speicher-Feedback
  const containerRef = useRef(null);

  const {setSelectedBlock: setSelectedBlockCMS} = useCMS();

  // Preload components on mount
  useEffect(() => {
    preloadCommonComponents();
  }, []);

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

  // Preload components on mount
  useEffect(() => {
    const initializeComponents = async () => {
      console.log('🚀 Initializing GridCanvas components...');
      try {
        await preloadCommonComponents();
        console.log('✅ Common components preloaded successfully');
      } catch (error) {
        console.error('❌ Error preloading components:', error);
      }
    };

    initializeComponents();
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
      content: newBlock.content || (newBlock.block_type === 'Text' ? 'Neuer Text Block' : ''),
      grid_col: finalCol,
      grid_row: finalRow,
      grid_width: blockWidth,
      grid_height: blockHeight,
      background_color: newBlock.background_color || 'transparent',
      text_color: newBlock.text_color || '#000000',
      z_index: newBlock.z_index || 1
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
    <div className="grid-canvas-wrapper" style={{
      width: '100%',
      height: '100%',
      overflow: 'auto',
      position: 'relative'
    }}>
      {/* Grid Toolbar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '8px 16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <button
          onClick={() => addRows(1)}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          + Zeile hinzufügen
        </button>

        {/* <button
          onClick={() => {
            console.log('=== DEBUG: All Blocks ===');
            blocks.forEach((block, i) => {
              console.log(`Block ${i}:`, {
                id: String(block.id),
                type: String(block.block_type),
                content: String(block.content),
                grid_col: block.grid_col,
                grid_row: block.grid_row,
                grid_width: block.grid_width,
                grid_height: block.grid_height
              });
            });
            console.log('=== Component Resolution Test ===');
            const testComponent = resolveComponentSync('Text');
            console.log('Text component resolved to:', testComponent);
            console.log('=== Component Registry Debug ===');
            const debugInfo = getDebugInfo();
            console.log('Debug Info:', debugInfo);
            console.log('=== END DEBUG ===');
          }}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Debug Blocks
        </button> */}

        <button
          onClick={async () => {
            console.log('🔄 Refreshing components...');
            try {
              const components = await refreshComponents();
              console.log('✅ Refreshed components:', components);
              alert(`✅ ${components.length} Komponenten neu geladen!`);
            } catch (error) {
              console.error('❌ Error refreshing components:', error);
              alert('❌ Fehler beim Neuladen der Komponenten');
            }
          }}
          style={{
            background: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          🔄 Komponenten neu laden
        </button>

        <button
          onClick={async () => {
            console.log('📦 Preloading common components...');
            try {
              await preloadCommonComponents();
              console.log('✅ Common components preloaded');
              alert('✅ Häufige Komponenten vorgeladen!');
            } catch (error) {
              console.error('❌ Error preloading components:', error);
              alert('❌ Fehler beim Vorladen der Komponenten');
            }
          }}
          style={{
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          📦 Komponenten vorladen
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
          style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
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
      </div>

      {/* Grid Container */}
      <div
        ref={containerRef}
        style={getGridContainerStyle()}
        onClick={handleCanvasClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="grid-container"
      >
        {/* Render Blocks */}
        {blocks.map((block) => (
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
