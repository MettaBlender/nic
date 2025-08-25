'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Moveable from 'react-moveable';
import { useCMS } from '@/context/CMSContext';
import { Trash2, Palette, Info, X, Copy, Eye } from 'lucide-react';
import { HexAlphaColorPicker } from 'react-colorful';
import toRelativePosition from '../../../lib/toRelativePosition';

const MovableBlock = ({
  block,
  children,
  onUpdate,
  onDelete,
  onDuplicate,
  isSelected = false,
  onSelect
}) => {
  const {
    mode,
    containerSize,
    gridEnabled,
    gridSize,
    snapToGrid,
    showGrid,
    snapToElements,
    snapToGridValue,
    getSnapLines,
    blocks,
    activeBlock
  } = useCMS();
  // Container Reference für Drag Area
  const [dragContainer, setDragContainer] = useState(null);

  useEffect(() => {
    // Finde den Editor Container für die Drag Area
    if (typeof window !== 'undefined') {
      // Suche nach dem Container mit der Ref
      const container = document.querySelector('[data-editor-container="true"]');
      if (container) {
        setDragContainer(container);
      } else {
        // Fallback zum body
        setDragContainer(document.body);
      }
    }
  }, []);

  const [target, setTarget] = useState(null);
  const [containerSizeLocal, setContainerSizeLocal] = useState({ width: 0, height: 0 });
  const [frame, setFrame] = useState({
    translate: [block.position_x || 0, block.position_y || 0],
    rotate: block.rotation || 0,
    scale: [block.scale_x || 1, block.scale_y || 1],
    width: block.width || 20,
    height: block.height || 20
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef(null);
  const isResizing = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialElementPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (elementRef.current) {
      setTarget(elementRef.current);
      console.log('Target set:', elementRef.current);
    }
  }, []);

  useEffect(() => {
    setFrame({
      translate: [block.position_x || 0, block.position_y || 0],
      rotate: block.rotation || 0,
      scale: [block.scale_x || 1, block.scale_y || 1],
      width: block.width || 20,
      height: block.height || 20
    });

    // Stelle sicher, dass das Element korrekt positioniert ist - nur Transform verwenden
    if (elementRef.current) {
      const element = elementRef.current;
      element.style.left = '0';
      element.style.top = '0';
      element.style.width = `${block.width || 20}%`;
      element.style.height = `${block.height || 20}%`;
      element.style.transform = `translate(${block.position_x || 0}%, ${block.position_y || 0}%) rotate(${block.rotation || 0}deg) scale(${block.scale_x || 1}, ${block.scale_y || 1})`;
    }
  }, [block]);  useEffect(() => {
    setContainerSizeLocal({
      width: containerSize.width || 800,
      height: containerSize.height || 600
    });
    console.log('Container size updated:', containerSize);
  }, [containerSize]);

  // Improved snap function with collision detection
  const snapPosition = (x, y, width, height) => {
    let snappedX = x;
    let snappedY = y;

    // Grid snapping
    if (snapToGrid && gridEnabled) {
      const containerWidth = containerSizeLocal.width || 800;
      const containerHeight = containerSizeLocal.height || 600;

      snappedX = snapToGridValue(x, gridSize, containerWidth);
      snappedY = snapToGridValue(y, gridSize, containerHeight);
    }

    // Element snapping
    if (snapToElements) {
      const snapDistance = 2; // 2% snap distance
      const snapLines = getSnapLines();

      snapLines.forEach(line => {
        if (line.type === 'vertical') {
          const distance = Math.abs(snappedX - line.pos);
          const rightDistance = Math.abs((snappedX + width) - line.pos);

          if (distance < snapDistance &&
              snappedY < line.range[1] && (snappedY + height) > line.range[0]) {
            snappedX = line.pos;
          } else if (rightDistance < snapDistance &&
                     snappedY < line.range[1] && (snappedY + height) > line.range[0]) {
            snappedX = line.pos - width;
          }
        } else if (line.type === 'horizontal') {
          const distance = Math.abs(snappedY - line.pos);
          const bottomDistance = Math.abs((snappedY + height) - line.pos);

          if (distance < snapDistance &&
              snappedX < line.range[1] && (snappedX + width) > line.range[0]) {
            snappedY = line.pos;
          } else if (bottomDistance < snapDistance &&
                     snappedX < line.range[1] && (snappedX + width) > line.range[0]) {
            snappedY = line.pos - height;
          }
        }
      });
    }

    // Boundary constraints (prevent moving outside container)
    snappedX = Math.max(0, Math.min(100 - width, snappedX));
    snappedY = Math.max(0, Math.min(100 - height, snappedY));

    return { x: snappedX, y: snappedY };
  };

  // Collision detection
  const checkCollision = (x, y, width, height, excludeId) => {
    return blocks.some(otherBlock => {
      if (otherBlock.id === excludeId) return false;

      return !(x >= otherBlock.position_x + otherBlock.width ||
               x + width <= otherBlock.position_x ||
               y >= otherBlock.position_y + otherBlock.height ||
               y + height <= otherBlock.position_y);
    });
  };

  const updateElement = useCallback(() => {
    if (onUpdate && frame && frame.translate && frame.scale) {
      // Stelle sicher, dass die Werte konsistent sind
      const finalData = {
        ...block,
        position_x: Math.round(frame.translate[0] * 100) / 100 || 0,
        position_y: Math.round(frame.translate[1] * 100) / 100 || 0,
        rotation: Math.round(frame.rotate * 100) / 100 || 0,
        scale_x: Math.round(frame.scale[0] * 100) / 100 || 1,
        scale_y: Math.round(frame.scale[1] * 100) / 100 || 1,
        width: Math.round(frame.width * 100) / 100 || 20,
        height: Math.round(frame.height * 100) / 100 || 20
      };

      onUpdate(block.id, finalData);
    }
  }, [block, frame, onUpdate]);

  const handleElementClick = (e) => {
    e.stopPropagation();
    if (mode === 'delete' && onDelete) {
      onDelete(block.id);
    } else if (mode === 'edit' && !isDragging) {
      // Bei normalem Klick: Info-Menü öffnen/schließen oder Element selektieren
      if (isSelected) {
        setShowInfoMenu(!showInfoMenu);
      } else if (onSelect) {
        onSelect(block);
      }
    } else if (onSelect) {
      onSelect(block);
    }
  };

  // Global drag handling für den Container
  useEffect(() => {
    if (!dragContainer || mode !== 'edit') return;

    const handleContainerMouseDown = (e) => {
      // Check if click is in the container but not on any element
      const rect = dragContainer.getBoundingClientRect();
      const isInContainer = e.clientX >= rect.left && e.clientX <= rect.right &&
                          e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (isInContainer && e.target === dragContainer) {
        // Clicking on empty container area should deselect
        if (activeBlock?.id === block.id) {
          // Don't deselect current block, instead prepare for potential drag
          e.preventDefault();
        }
      }
    };

    dragContainer.addEventListener('mousedown', handleContainerMouseDown, { passive: false });

    return () => {
      dragContainer.removeEventListener('mousedown', handleContainerMouseDown);
    };
  }, [dragContainer, mode, activeBlock, block.id]);

  const updateBackgroundColor = async (color) => {
    if (onUpdate) {
      await onUpdate(block.id, {
        ...block,
        background_color: color
      });
    }
  };

  // Hilfsfunktion für relative Positionierung
  const toRelativePosition = (x, y, containerWidth, containerHeight) => {
    return {
      x: (x / containerWidth) * 100,
      y: (y / containerHeight) * 100
    };
  };

  return (
    <>
      {/* Info Menu */}
      {showInfoMenu && mode === 'edit' && (
        <div
          className="absolute z-[1001] bg-white rounded-lg shadow-xl border p-4 min-w-[280px]"
          style={{
            left: `${(frame.translate && frame.translate[0]) || 0}%`,
            top: `${((frame.translate && frame.translate[1]) || 0) - 5}%`,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Block-Informationen</h3>
            <button
              onClick={() => setShowInfoMenu(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium text-gray-600">Typ:</span>
              <span className="text-gray-800">{block.block_type}</span>

              <span className="font-medium text-gray-600">ID:</span>
              <span className="text-gray-800">#{block.id}</span>

              <span className="font-medium text-gray-600">Position:</span>
              <span className="text-gray-800">
                {Math.round(frame.translate[0] * 10) / 10}%, {Math.round(frame.translate[1] * 10) / 10}%
              </span>

              <span className="font-medium text-gray-600">Größe:</span>
              <span className="text-gray-800">
                {Math.round(frame.width * 10) / 10}% × {Math.round(frame.height * 10) / 10}%
              </span>

              <span className="font-medium text-gray-600">Rotation:</span>
              <span className="text-gray-800">{Math.round(frame.rotate)}°</span>

              <span className="font-medium text-gray-600">Z-Index:</span>
              <span className="text-gray-800">{block.z_index}</span>
            </div>

            {block.content && (
              <div className="mt-3 pt-3 border-t">
                <span className="font-medium text-gray-600">Inhalt:</span>
                <div className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-700 max-h-20 overflow-y-auto">
                  {typeof block.content === 'string'
                    ? block.content.substring(0, 100) + (block.content.length > 100 ? '...' : '')
                    : JSON.stringify(block.content).substring(0, 100) + '...'
                  }
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4 pt-3 border-t">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              <Palette size={12} />
              Farbe
            </button>
            {onDuplicate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(block);
                  setShowInfoMenu(false);
                }}
                className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                <Copy size={12} />
                Duplizieren
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete(block.id);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              <Trash2 size={12} />
              Löschen
            </button>
          </div>
        </div>
      )}

      {/* Color Picker Overlay */}
      {showColorPicker && mode === 'edit' && (
        <div
          className="absolute w-64 h-64 z-[1000] bg-white rounded-lg shadow-lg p-4"
          style={{
            left: `${(frame.translate && frame.translate[0]) || 0}%`,
            top: `${(frame.translate && frame.translate[1]) || 0}%`,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Hintergrundfarbe</h3>
            <button
              onClick={() => setShowColorPicker(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <HexAlphaColorPicker
            color={block.background_color}
            onChange={updateBackgroundColor}
            className="w-full h-40"
          />
        </div>
      )}

      <div
        ref={elementRef}
        className={`absolute p-0 m-0 cursor-pointer transition-all duration-200 ease-out group ${
          mode === 'edit' && isSelected ? 'shadow-lg border-2 border-blue-500' : 'shadow-md'
        } ${
          mode === 'delete' ? 'hover:bg-red-100' : ''
        } ${
          isDragging ? 'z-50' : ''
        } rounded-md overflow-hidden`}
        style={{
          left: '0',
          top: '0',
          width: `${frame.width || 20}%`,
          height: `${frame.height || 20}%`,
          transform: `translate(${(frame.translate && frame.translate[0]) || 0}%, ${(frame.translate && frame.translate[1]) || 0}%) rotate(${frame.rotate || 0}deg) scale(${(frame.scale && frame.scale[0]) || 1}, ${(frame.scale && frame.scale[1]) || 1})`,
          backgroundColor: block.background_color || 'transparent',
          color: block.text_color || '#000000',
          zIndex: isDragging ? 1000 : (block.z_index || 1),
          transformOrigin: 'center center'
        }}
        onClick={handleElementClick}
      >
        {/* Quick Action Button - nur wenn nicht bereits ausgewählt */}
        {!isSelected && mode === 'edit' && !showInfoMenu && (
          <div className="absolute -top-6 -right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInfoMenu(true);
                if (onSelect) onSelect(block);
              }}
              className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700 text-xs"
            >
              <Info size={10} />
            </button>
          </div>
        )}

        {/* Control Buttons nur bei Selektion im Edit Mode */}
        {isSelected && mode === 'edit' && (
          <div className="absolute -top-8 left-0 flex gap-1 z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInfoMenu(!showInfoMenu);
              }}
              className={`w-6 h-6 text-white rounded-sm flex items-center justify-center ${
                showInfoMenu ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <Info size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              className="w-6 h-6 bg-green-500 text-white rounded-sm flex items-center justify-center hover:bg-green-600"
            >
              <Palette size={12} />
            </button>
            {onDuplicate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(block);
                }}
                className="w-6 h-6 bg-yellow-500 text-white rounded-sm flex items-center justify-center hover:bg-yellow-600"
              >
                <Copy size={12} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete(block.id);
              }}
              className="w-6 h-6 bg-red-500 text-white rounded-sm flex items-center justify-center hover:bg-red-600"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}

        {/* Block Content */}
        <div className="w-full h-full relative">
          {children}
        </div>

        {/* Delete Mode Overlay */}
        {mode === 'delete' && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
        )}
      </div>

      {/* Moveable Controls - Vereinfacht für bessere Funktionalität */}
      {target && mode === 'edit' && (
        <>
          {console.log('Rendering Moveable for block:', block.id, 'isSelected:', isSelected, 'mode:', mode)}
          <Moveable
            target={target}
            container={dragContainer}
            draggable={true}
            resizable={isSelected}
            rotatable={isSelected}
            snappable={snapToElements || snapToGrid}
            snapThreshold={5}
            snapCenter={true}
            snapVertical={true}
            snapHorizontal={true}
            snapElement={true}
            snapGap={true}
            verticalGuidelines={snapToElements ? blocks.filter(b => b.id !== block.id).map(b => [b.position_x, b.position_x + b.width]).flat() : []}
            horizontalGuidelines={snapToElements ? blocks.filter(b => b.id !== block.id).map(b => [b.position_y, b.position_y + b.height]).flat() : []}
            throttleDrag={1}
            throttleResize={1}
            throttleRotate={1}
            origin={false}
            renderDirections={isSelected ? ["nw", "n", "ne", "w", "e", "sw", "s", "se"] : []}
            keepRatio={false}
            dragArea={true}
            dragTarget={dragContainer}
            passDragArea={true}
            zoom={1}
            edge={false}
            useResizeObserver={true}
            checkInput={false}
            rootContainer={dragContainer || (typeof window !== 'undefined' ? document.body : null)}
            onDragStart={({ set, clientX, clientY }) => {
              setIsDragging(true);

              // Automatisch selektieren beim Drag-Start
              if (onSelect) {
                onSelect(block);
              }

              // Speichere Anfangsposition für Delta-Berechnung
              dragStartPos.current = {
                x: clientX,
                y: clientY
              };

              // Setze initiale Position für Moveable (in Pixeln)
              const containerWidth = containerSizeLocal.width || 800;
              const containerHeight = containerSizeLocal.height || 600;
              const currentX = (frame.translate[0] * containerWidth) / 100;
              const currentY = (frame.translate[1] * containerHeight) / 100;

              // Speichere die initiale Element-Position
              initialElementPos.current = {
                x: frame.translate[0],
                y: frame.translate[1]
              };

              set([currentX, currentY]);
            }}
            onDrag={({ target, translate }) => {
              // Verwende die translate-Werte direkt von Moveable für Konsistenz
              const containerWidth = containerSizeLocal.width || 800;
              const containerHeight = containerSizeLocal.height || 600;

              // Konvertiere Pixel zu Prozent
              let relativeX = (translate[0] / containerWidth) * 100;
              let relativeY = (translate[1] / containerHeight) * 100;

              // Apply snapping
              const snapped = snapPosition(relativeX, relativeY, frame.width, frame.height);
              relativeX = snapped.x;
              relativeY = snapped.y;

              // Update Frame
              setFrame(prev => ({
                ...prev,
                translate: [relativeX, relativeY]
              }));

              // Apply transform - NUR transform verwenden, kein left/top
              if (target) {
                target.style.transform = `translate(${relativeX}%, ${relativeY}%) rotate(${frame.rotate}deg) scale(${frame.scale[0]}, ${frame.scale[1]})`;
                target.style.left = '0';
                target.style.top = '0';
              }
            }}
            onDragEnd={({ target }) => {
              setIsDragging(false);

              // Stelle sicher, dass das finale Transform korrekt ist
              if (target) {
                target.style.transform = `translate(${frame.translate[0]}%, ${frame.translate[1]}%) rotate(${frame.rotate}deg) scale(${frame.scale[0]}, ${frame.scale[1]})`;
                target.style.left = '0';
                target.style.top = '0';
                target.style.willChange = 'auto';
              }

              // Update nur einmal am Ende
              updateElement();
            }}
            onResizeStart={({ setOrigin, dragStart }) => {
              // Automatisch selektieren beim Resize-Start
              if (onSelect) {
                onSelect(block);
              }
              isResizing.current = true;

              // JAPresentation Style
              setOrigin(['%', '%']);
              if (dragStart) {
                const containerWidth = containerSizeLocal.width || 800;
                const containerHeight = containerSizeLocal.height || 600;
                dragStart.set([
                  (frame.translate[0] * containerWidth) / 100,
                  (frame.translate[1] * containerHeight) / 100
                ]);
              }
              console.log('Resize start');
            }}
            onResize={({ target, width, height, drag }) => {
              if (!isResizing.current) return;

              const containerWidth = containerSizeLocal.width || 800;
              const containerHeight = containerSizeLocal.height || 600;

              // Direkte Konvertierung ohne komplexe Berechnungen
              const newWidth = (width / containerWidth) * 100;
              const newHeight = (height / containerHeight) * 100;

              // Position basierend auf Moveable's drag-Werte
              const relativeX = (drag.beforeTranslate[0] / containerWidth) * 100;
              const relativeY = (drag.beforeTranslate[1] / containerHeight) * 100;

              setFrame(prev => ({
                ...prev,
                width: newWidth,
                height: newHeight,
                translate: [relativeX, relativeY]
              }));

              // Direkte Transform-Anwendung
              if (target) {
                target.style.transform = `translate(${relativeX}%, ${relativeY}%) rotate(${frame.rotate}deg) scale(${frame.scale[0]}, ${frame.scale[1]})`;
                target.style.width = `${newWidth}%`;
                target.style.height = `${newHeight}%`;
                target.style.left = '0';
                target.style.top = '0';
              }
            }}
            onResizeEnd={() => {
              console.log('Resize end triggered');
              isResizing.current = false;
              updateElement();
            }}
            onRotateStart={() => {
              console.log('Rotate start triggered');
              // Automatisch selektieren beim Rotate-Start
              if (onSelect) {
                onSelect(block);
              }
            }}
            onRotate={({ target, beforeRotate }) => {
              const normalizedRotation = beforeRotate || 0;

              setFrame(prev => ({
                ...prev,
                rotate: normalizedRotation
              }));

              if (target) {
                target.style.transform = `translate(${frame.translate[0]}%, ${frame.translate[1]}%) rotate(${normalizedRotation}deg) scale(${frame.scale[0] || 1}, ${frame.scale[1] || 1})`;
              }
            }}
            onRotateEnd={updateElement}
          />
        </>
      )}
    </>
  );
};

export default MovableBlock;
