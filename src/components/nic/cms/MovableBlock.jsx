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
  const { mode, containerSize } = useCMS();
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
  }, [block]);

  useEffect(() => {
    setContainerSizeLocal({
      width: containerSize.width || 800,
      height: containerSize.height || 600
    });
    console.log('Container size updated:', containerSize);
  }, [containerSize]);

  const updateElement = useCallback(() => {
    if (onUpdate && frame && frame.translate && frame.scale) {
      onUpdate(block.id, {
        ...block,
        position_x: frame.translate[0] || 0,
        position_y: frame.translate[1] || 0,
        rotation: frame.rotate || 0,
        scale_x: frame.scale[0] || 1,
        scale_y: frame.scale[1] || 1,
        width: frame.width || 20,
        height: frame.height || 20
      });
    }
  }, [block, frame, onUpdate]);

  const handleElementClick = (e) => {
    e.stopPropagation();
    if (mode === 'delete' && onDelete) {
      onDelete(block.id);
    } else if (mode === 'edit' && !isDragging) {
      // Bei normalem Klick: Info-Menü öffnen/schließen
      setShowInfoMenu(!showInfoMenu);
      if (onSelect) {
        onSelect(block);
      }
    } else if (onSelect) {
      onSelect(block);
    }
  };

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
          left: `${(frame.translate && frame.translate[0]) || 0}%`,
          top: `${(frame.translate && frame.translate[1]) || 0}%`,
          width: `${frame.width || 20}%`,
          height: `${frame.height || 20}%`,
          transform: `rotate(${frame.rotate || 0}deg) scale(${(frame.scale && frame.scale[0]) || 1}, ${(frame.scale && frame.scale[1]) || 1})`,
          backgroundColor: block.background_color || '#ffffff',
          color: block.text_color || '#000000',
          zIndex: isDragging ? 1000 : (block.z_index || 1),
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
            draggable={true}
            resizable={isSelected}
            rotatable={isSelected}
            snappable={true}
            throttleDrag={0}
            throttleResize={0}
            throttleRotate={0}
            origin={false}
            renderDirections={isSelected ? ["nw", "n", "ne", "w", "e", "sw", "s", "se"] : []}
            keepRatio={false}
            dragArea={false}
            onDragStart={({ set, clientX, clientY }) => {
              setIsDragging(true);

              // Automatisch selektieren beim Drag-Start
              if (onSelect) {
                onSelect(block);
              }

              // Speichere Maus-Startposition (JAPresentation Style)
              dragStartPos.current = {
                x: clientX,
                y: clientY
              };

              // Setze initiale Position in Pixeln für Moveable
              const containerWidth = containerSizeLocal.width || 800;
              const containerHeight = containerSizeLocal.height || 600;
              const currentX = (frame.translate[0] * containerWidth) / 100;
              const currentY = (frame.translate[1] * containerHeight) / 100;
              set([currentX, currentY]);

              console.log('Drag start at:', clientX, clientY, 'Element at:', currentX, currentY);
            }}
            onDrag={({ target, clientX, clientY }) => {
              // JAPresentation-System: Delta mit verbessertem Multiplikator
              const deltaX = (clientX - dragStartPos.current.x) * 3;
              const deltaY = (clientY - dragStartPos.current.y) * 3;

              const containerWidth = containerSizeLocal.width || 800;
              const containerHeight = containerSizeLocal.height || 600;

              // Berechne neue absolute Position
              const newX = (frame.translate[0] * containerWidth) / 100 + deltaX;
              const newY = (frame.translate[1] * containerHeight) / 100 + deltaY;

              // Konvertiere zu relativer Position
              const relativePosition = toRelativePosition(
                newX,
                newY,
                containerWidth,
                containerHeight
              );

              // Update Frame
              setFrame(prev => ({
                ...prev,
                translate: [relativePosition.x, relativePosition.y]
              }));

              // Update Transform direkt mit smootherer Transition
              target.style.transform = `translate(${relativePosition.x}%, ${relativePosition.y}%) rotate(${frame.rotate}deg) scale(${frame.scale[0]}, ${frame.scale[1]})`;

              // Update dragStartPos für nächsten Frame (wichtig!)
              dragStartPos.current = {
                x: clientX,
                y: clientY
              };

              console.log('Drag delta:', deltaX, deltaY, 'New pos:', relativePosition.x, relativePosition.y);
            }}
            onDragEnd={() => {
              setIsDragging(false);
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

              // JAPresentation Style: Direkte Konvertierung
              const newWidth = (width / containerWidth) * 100;
              const newHeight = (height / containerHeight) * 100;

              const relativePosition = toRelativePosition(
                drag.beforeTranslate[0],
                drag.beforeTranslate[1],
                containerWidth,
                containerHeight
              );

              setFrame(prev => ({
                ...prev,
                width: newWidth,
                height: newHeight,
                translate: [relativePosition.x, relativePosition.y]
              }));

              // Update Transform direkt
              target.style.transform = `translate(${relativePosition.x}%, ${relativePosition.y}%) rotate(${frame.rotate}deg) scale(${frame.scale[0]}, ${frame.scale[1]})`;

              console.log('Resize:', newWidth, newHeight, 'Pos:', relativePosition.x, relativePosition.y);
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
            onRotate={({ beforeRotate }) => {
              console.log('Rotating:', beforeRotate);
              setFrame(prev => ({
                ...prev,
                rotate: beforeRotate || 0
              }));

              if (target) {
                target.style.transform = `rotate(${beforeRotate || 0}deg) scale(${frame.scale[0] || 1}, ${frame.scale[1] || 1})`;
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
