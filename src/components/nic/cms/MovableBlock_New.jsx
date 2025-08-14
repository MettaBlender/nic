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
      width: containerSize.width,
      height: containerSize.height
    });
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

      {/* Moveable Controls - Aktiv wenn Edit Mode UND selektiert */}
      {target && containerSizeLocal.width > 0 && mode === 'edit' && isSelected && (
        <Moveable
          target={target}
          draggable={true}
          resizable={true}
          rotatable={true}
          snappable={true}
          throttleDrag={0}
          throttleResize={1}
          throttleRotate={0}
          origin={false}
          bounds={{
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            position: "css",
          }}
          onDragStart={({ set, clientX, clientY }) => {
            dragStartPos.current = { x: clientX, y: clientY };
            const currentX = (frame.translate[0] * containerSizeLocal.width) / 100;
            const currentY = (frame.translate[1] * containerSizeLocal.height) / 100;
            set([currentX, currentY]);
          }}
          onDrag={({ target, clientX, clientY }) => {
            const deltaX = (clientX - dragStartPos.current.x) * 5;
            const deltaY = (clientY - dragStartPos.current.y) * 5;

            const newX = (frame.translate[0] * containerSizeLocal.width) / 100 + deltaX;
            const newY = (frame.translate[1] * containerSizeLocal.height) / 100 + deltaY;

            const relativePosition = toRelativePosition(
              newX,
              newY,
              containerSizeLocal.width,
              containerSizeLocal.height
            );

            const relativeX = Math.max(0, Math.min(100 - (frame.width || 20), relativePosition.x));
            const relativeY = Math.max(0, Math.min(100 - (frame.height || 20), relativePosition.y));

            setFrame(prev => ({
              ...prev,
              translate: [relativeX, relativeY]
            }));

            target.style.left = `${relativeX}%`;
            target.style.top = `${relativeY}%`;

            dragStartPos.current = { x: clientX, y: clientY };
          }}
          onDragEnd={updateElement}
          onResizeStart={({ setOrigin, dragStart }) => {
            isResizing.current = true;
            setOrigin(['%', '%']);
            if (dragStart) {
              dragStart.set([
                (frame.translate[0] * containerSizeLocal.width) / 100,
                (frame.translate[1] * containerSizeLocal.height) / 100
              ]);
            }
          }}
          onResize={({ target, width, height, drag }) => {
            if (!isResizing.current) return;

            const newWidth = Math.max(5, Math.min(95, (width / containerSizeLocal.width) * 100));
            const newHeight = Math.max(5, Math.min(95, (height / containerSizeLocal.height) * 100));

            const relativePosition = toRelativePosition(
              drag.beforeTranslate[0],
              drag.beforeTranslate[1],
              containerSizeLocal.width,
              containerSizeLocal.height
            );

            const relativeX = Math.max(0, Math.min(100 - newWidth, relativePosition.x));
            const relativeY = Math.max(0, Math.min(100 - newHeight, relativePosition.y));

            setFrame(prev => ({
              ...prev,
              width: newWidth,
              height: newHeight,
              translate: [relativeX, relativeY]
            }));

            target.style.width = `${newWidth}%`;
            target.style.height = `${newHeight}%`;
            target.style.left = `${relativeX}%`;
            target.style.top = `${relativeY}%`;
          }}
          onResizeEnd={() => {
            isResizing.current = false;
            updateElement();
          }}
          onRotateStart={({ set }) => {
            set(frame.rotate);
          }}
          onRotate={({ target, beforeRotate }) => {
            setFrame(prev => ({
              ...prev,
              rotate: beforeRotate || 0
            }));
            target.style.transform = `rotate(${beforeRotate || 0}deg) scale(${frame.scale[0] || 1}, ${frame.scale[1] || 1})`;
          }}
          onRotateEnd={updateElement}
          onClick={() => {
            if (onSelect) {
              onSelect(block);
            }
          }}
        />
      )}

      {/* Moveable Controls - Free Mode (nur Drag ohne Selektion erforderlich) */}
      {target && containerSizeLocal.width > 0 && mode === 'free' && (
        <Moveable
          target={target}
          draggable={true}
          resizable={false}
          rotatable={false}
          snappable={true}
          throttleDrag={0}
          origin={false}
          dragArea={true}
          bounds={{
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            position: "css",
          }}
          onDragStart={({ set, clientX, clientY }) => {
            dragStartPos.current = { x: clientX, y: clientY };
            const currentX = (frame.translate[0] * containerSizeLocal.width) / 100;
            const currentY = (frame.translate[1] * containerSizeLocal.height) / 100;
            set([currentX, currentY]);
          }}
          onDrag={({ target, clientX, clientY }) => {
            const deltaX = (clientX - dragStartPos.current.x) * 5;
            const deltaY = (clientY - dragStartPos.current.y) * 5;

            const newX = (frame.translate[0] * containerSizeLocal.width) / 100 + deltaX;
            const newY = (frame.translate[1] * containerSizeLocal.height) / 100 + deltaY;

            const relativePosition = toRelativePosition(
              newX,
              newY,
              containerSizeLocal.width,
              containerSizeLocal.height
            );

            const relativeX = Math.max(0, Math.min(100 - (frame.width || 20), relativePosition.x));
            const relativeY = Math.max(0, Math.min(100 - (frame.height || 20), relativePosition.y));

            setFrame(prev => ({
              ...prev,
              translate: [relativeX, relativeY]
            }));

            target.style.left = `${relativeX}%`;
            target.style.top = `${relativeY}%`;

            dragStartPos.current = { x: clientX, y: clientY };
          }}
          onDragEnd={updateElement}
        />
      )}
    </>
  );
};

export default MovableBlock;
