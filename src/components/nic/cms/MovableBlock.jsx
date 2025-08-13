'use client';

import React, { useState, useRef, useEffect } from 'react';
import Moveable from 'react-moveable';
import { useCMS } from '@/context/CMSContext';
import { Trash2, Move, RotateCw, Palette } from 'lucide-react';
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
  const [frame, setFrame] = useState({
    translate: [block.position_x || 0, block.position_y || 0],
    rotate: block.rotation || 0,
    scale: [block.scale_x || 1, block.scale_y || 1],
    width: block.width || 20,
    height: block.height || 20
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const elementRef = useRef(null);

  // Mouse Drag State für 'move' Modus
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const lastUpdateTime = useRef(0);

  useEffect(() => {
    if (elementRef.current) {
      setTarget(elementRef.current);
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

  const updateElement = async () => {
    if (onUpdate && frame && frame.translate && frame.scale) {
      await onUpdate(block.id, {
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
  };

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

  // Mouse Drag Handlers für 'move' Modus
  const handleMouseDown = (e) => {
    if (mode !== 'move') return;

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialPos.current = {
      x: frame.translate[0] || 0,
      y: frame.translate[1] || 0
    };

    // Select block when starting to drag
    if (onSelect) {
      onSelect(block);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || (mode !== 'move' && mode !== 'precise')) return;

    e.preventDefault();

    // Throttle updates to 60fps für smoother movement
    const now = Date.now();
    if (now - lastUpdateTime.current < 16) return; // ~60fps
    lastUpdateTime.current = now;

    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;

    // Verschiedene Sensitivitäten je nach Modus
    const sensitivity = mode === 'precise' ? 0.05 : 0.1; // Noch feiner für 'precise' Modus

    // Convert pixel movement to percentage mit sehr reduzierter Sensitivität
    const percentDeltaX = (deltaX / containerSize.width) * 100 * sensitivity;
    const percentDeltaY = (deltaY / containerSize.height) * 100 * sensitivity;

    // Rundung auf 2 Dezimalstellen für präzise Positionierung
    const newX = Math.round(Math.max(0, Math.min(100 - (frame.width || 20), initialPos.current.x + percentDeltaX)) * 100) / 100;
    const newY = Math.round(Math.max(0, Math.min(100 - (frame.height || 20), initialPos.current.y + percentDeltaY)) * 100) / 100;

    setFrame(prev => ({
      ...prev,
      translate: [newX, newY]
    }));
  };  const handleMouseUp = () => {
    if (isDragging && mode === 'move') {
      setIsDragging(false);
      updateElement();
    }
  };

  // Add global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, mode, containerSize.width, containerSize.height, frame.width, frame.height]);

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
        className={`absolute p-0 m-0 ${
          mode === 'move' ? 'cursor-move' : 'cursor-pointer'
        } ${
          mode === 'edit' ? 'shadow-md border-2' : ''
        } ${
          mode === 'free' ? 'shadow-lg border-2 border-green-300 hover:border-green-500' : ''
        } ${
          mode === 'move' ? 'shadow-lg border-2 border-blue-300' : ''
        } ${
          isSelected ? 'border-blue-500' : 'border-transparent'
        } ${
          mode === 'delete' ? 'hover:bg-red-100' : ''
        } ${
          isDragging ? 'shadow-2xl border-blue-500' : ''
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
          userSelect: mode === 'move' ? 'none' : 'auto'
        }}
        onClick={handleElementClick}
        onMouseDown={handleMouseDown}
      >
        {/* Control Buttons */}
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

        {/* Free Mode Overlay */}
        {mode === 'free' && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 backdrop-blur-sm pointer-events-none">
            <RotateCw className="w-6 h-6 text-green-500" />
          </div>
        )}

        {/* Move Mode Overlay */}
        {mode === 'move' && !isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm pointer-events-none">
            <Move className="w-8 h-8 text-blue-500" />
          </div>
        )}

        {/* Dragging Indicator */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm pointer-events-none border-2 border-blue-500 border-dashed">
            <Move className="w-12 h-12 text-blue-600 animate-pulse" />
          </div>
        )}
      </div>

      {/* Moveable Controls - Edit Mode (full controls) */}
      {target && containerSize.width > 0 && mode === 'edit' && isSelected && (
        <Moveable
          target={target}
          draggable={true}
          resizable={true}
          rotatable={true}
          snappable={true}
          throttleDrag={0}
          throttleResize={1}
          throttleRotate={1}
          origin={false}
          onDrag={({ beforeTranslate }) => {
            const newX = Math.max(0, Math.min(100 - (frame.width || 20), (beforeTranslate[0] / containerSize.width) * 100));
            const newY = Math.max(0, Math.min(100 - (frame.height || 20), (beforeTranslate[1] / containerSize.height) * 100));

            setFrame(prev => ({
              ...prev,
              translate: [newX, newY]
            }));

            target.style.left = `${newX}%`;
            target.style.top = `${newY}%`;
          }}
          onDragEnd={updateElement}
          onResize={({ width, height, drag }) => {
            const newWidth = Math.max(5, Math.min(95, (width / containerSize.width) * 100));
            const newHeight = Math.max(5, Math.min(95, (height / containerSize.height) * 100));

            let newX = (frame.translate && frame.translate[0]) || 0;
            let newY = (frame.translate && frame.translate[1]) || 0;

            if (drag && drag.beforeTranslate) {
              newX = Math.max(0, Math.min(100 - newWidth, (drag.beforeTranslate[0] / containerSize.width) * 100));
              newY = Math.max(0, Math.min(100 - newHeight, (drag.beforeTranslate[1] / containerSize.height) * 100));
            }

            setFrame(prev => ({
              ...prev,
              width: newWidth,
              height: newHeight,
              translate: [newX, newY]
            }));

            target.style.width = `${newWidth}%`;
            target.style.height = `${newHeight}%`;
            target.style.left = `${newX}%`;
            target.style.top = `${newY}%`;
          }}
          onResizeEnd={updateElement}
          onRotate={({ beforeRotate }) => {
            setFrame(prev => ({
              ...prev,
              rotate: beforeRotate || 0
            }));
            target.style.transform = `rotate(${beforeRotate || 0}deg)`;
          }}
          onRotateEnd={updateElement}
        />
      )}

      {/* Moveable Controls - Free Mode (drag only, no selection needed) */}
      {target && containerSize.width > 0 && mode === 'free' && (
        <Moveable
          target={target}
          draggable={true}
          resizable={false}
          rotatable={false}
          snappable={true}
          throttleDrag={0}
          origin={false}
          dragArea={true}
          onDrag={({ beforeTranslate }) => {
            const newX = Math.max(0, Math.min(100 - (frame.width || 20), (beforeTranslate[0] / containerSize.width) * 100));
            const newY = Math.max(0, Math.min(100 - (frame.height || 20), (beforeTranslate[1] / containerSize.height) * 100));

            setFrame(prev => ({
              ...prev,
              translate: [newX, newY]
            }));

            target.style.left = `${newX}%`;
            target.style.top = `${newY}%`;
          }}
          onDragEnd={updateElement}
        />
      )}
    </>
  );
};

export default MovableBlock;
