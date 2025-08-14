'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Moveable from 'react-moveable';
import { useCMS } from '@/context/CMSContext';
import { Trash2, Palette } from 'lucide-react';
import { HexAlphaColorPicker } from 'react-colorful';

const MovableBlock = ({
  block,
  children,
  onUpdate,
  onDelete,
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
  const elementRef = useRef(null);
  const isResizing = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

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
        className={`absolute p-0 m-0 cursor-pointer ${
          mode === 'edit' && isSelected ? 'shadow-lg border-2 border-blue-500' : 'shadow-md'
        } ${
          mode === 'delete' ? 'hover:bg-red-100' : ''
        } rounded-md overflow-hidden transition-all duration-200`}
        style={{
          left: `${(frame.translate && frame.translate[0]) || 0}%`,
          top: `${(frame.translate && frame.translate[1]) || 0}%`,
          width: `${frame.width || 20}%`,
          height: `${frame.height || 20}%`,
          transform: `rotate(${frame.rotate || 0}deg) scale(${(frame.scale && frame.scale[0]) || 1}, ${(frame.scale && frame.scale[1]) || 1})`,
          backgroundColor: block.background_color || '#ffffff',
          color: block.text_color || '#000000',
          zIndex: block.z_index || 1,
        }}
        onClick={handleElementClick}
      >
        {/* Control Buttons nur bei Selektion im Edit Mode */}
        {isSelected && mode === 'edit' && (
          <div className="absolute -top-8 left-0 flex gap-1 z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              className="w-6 h-6 bg-blue-500 text-white rounded-sm flex items-center justify-center hover:bg-blue-600"
            >
              <Palette size={12} />
            </button>
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
            throttleDrag={1}
            throttleResize={1}
            throttleRotate={1}
            origin={false}
            renderDirections={isSelected ? ["nw", "n", "ne", "w", "e", "sw", "s", "se"] : []}
            onDragStart={({ set }) => {
              console.log('Drag start triggered');
              // Automatisch selektieren beim Drag-Start
              if (onSelect) {
                onSelect(block);
              }
            }}
            onDrag={({ beforeTranslate }) => {
              console.log('Dragging:', beforeTranslate);
              const containerWidth = containerSizeLocal.width || 800;
              const containerHeight = containerSizeLocal.height || 600;

              const newX = Math.max(0, Math.min(100 - (frame.width || 20), (beforeTranslate[0] / containerWidth) * 100));
              const newY = Math.max(0, Math.min(100 - (frame.height || 20), (beforeTranslate[1] / containerHeight) * 100));

              setFrame(prev => ({
                ...prev,
                translate: [newX, newY]
              }));

              if (target) {
                target.style.left = `${newX}%`;
                target.style.top = `${newY}%`;
              }
            }}
            onDragEnd={updateElement}
            onResizeStart={() => {
              console.log('Resize start triggered');
              // Automatisch selektieren beim Resize-Start
              if (onSelect) {
                onSelect(block);
              }
              isResizing.current = true;
            }}
            onResize={({ width, height, drag }) => {
              console.log('Resizing:', width, height);
              if (!isResizing.current) return;

              const containerWidth = containerSizeLocal.width || 800;
              const containerHeight = containerSizeLocal.height || 600;

              const newWidth = Math.max(5, Math.min(95, (width / containerWidth) * 100));
              const newHeight = Math.max(5, Math.min(95, (height / containerHeight) * 100));

              let newX = frame.translate[0] || 0;
              let newY = frame.translate[1] || 0;

              if (drag && drag.beforeTranslate) {
                newX = Math.max(0, Math.min(100 - newWidth, (drag.beforeTranslate[0] / containerWidth) * 100));
                newY = Math.max(0, Math.min(100 - newHeight, (drag.beforeTranslate[1] / containerHeight) * 100));
              }

              setFrame(prev => ({
                ...prev,
                width: newWidth,
                height: newHeight,
                translate: [newX, newY]
              }));

              if (target) {
                target.style.width = `${newWidth}%`;
                target.style.height = `${newHeight}%`;
                target.style.left = `${newX}%`;
                target.style.top = `${newY}%`;
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
