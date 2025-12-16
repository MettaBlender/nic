'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { calculateResponsiveLayout, calculateMinGridRows, getDeviceType } from '@/utils/responsiveLayoutCalculator';

export default function ResponsiveGridClient({
  blocks,
  layoutSettings,
  nicConfig
}) {
  const [deviceType, setDeviceType] = useState('desktop');
  const [responsiveBlocks, setResponsiveBlocks] = useState(blocks);
  const [minRows, setMinRows] = useState(12);
  const [loadedComponents, setLoadedComponents] = useState({});

  // Dynamically load block components
  useEffect(() => {
    const componentMap = {};

    // List of all block types that might be used
    const blockTypes = [...new Set(blocks.map(b => b.block_type))];

    blockTypes.forEach(type => {
      // Dynamically import component based on block type
      componentMap[type] = dynamic(
        () => import(`@/components/nic/blocks/${type}.jsx`)
          .catch(() => import(`@/components/nic/blocks/forms/${type}.jsx`))
          .catch(() => import(`@/components/nic/blocks/media/${type}.jsx`))
          .catch(() => import(`@/components/nic/blocks/test/${type}.jsx`))
          .catch(() => import('@/components/nic/blocks/fallback')),
        {
          ssr: false,
          loading: () => (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-gray-400">Loading...</span>
            </div>
          )
        }
      );
    });

    setLoadedComponents(componentMap);
  }, [blocks]);

  // Detect device type and calculate responsive layout
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      const newDeviceType = getDeviceType(width);

      setDeviceType(newDeviceType);

      // Calculate responsive layout for current device
      const responsive = calculateResponsiveLayout(blocks, newDeviceType);
      setResponsiveBlocks(responsive);

      // Calculate minimum rows needed
      const rows = calculateMinGridRows(responsive);
      setMinRows(rows);
    }

    // Initial calculation
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [blocks]);

  // Get grid configuration based on device
  const getGridConfig = () => {
    switch (deviceType) {
      case 'mobile':
        return { columns: 4, gap: 8, rowHeight: 50 };
      case 'tablet':
        return { columns: 8, gap: 12, rowHeight: 55 };
      default:
        return { columns: 12, gap: 16, rowHeight: 60 };
    }
  };

  const gridConfig = getGridConfig();

  return (
    <div
      className="w-full h-full relative"
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${minRows}, minmax(${gridConfig.rowHeight}px, auto))`,
        gridTemplateColumns: `repeat(${gridConfig.columns}, minmax(0, 1fr))`,
        gap: `${gridConfig.gap}px`,
        padding: '16px'
      }}
    >
      {responsiveBlocks.map((block) => {
        const Component = loadedComponents[block.block_type];

        if (!Component) {
          return (
            <div
              key={block.id}
              className="text-red-500 p-2 border border-red-300 rounded bg-red-50 flex items-center justify-center"
              style={{
                gridColumn: `${(block.responsive_col || 0) + 1} / span ${block.responsive_width || 2}`,
                gridRow: `${(block.responsive_row || 0) + 1} / span ${block.responsive_height || 1}`,
                zIndex: block.z_index || 1
              }}
            >
              <div className="text-center text-xs">
                <div className="font-bold">Unbekannter Block: {block.block_type}</div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={block.id}
            className="rounded-md overflow-hidden"
            style={{
              gridColumn: `${(block.responsive_col || 0) + 1} / span ${block.responsive_width || 2}`,
              gridRow: `${(block.responsive_row || 0) + 1} / span ${block.responsive_height || 1}`,
              backgroundColor: block.background_color || 'transparent',
              color: block.text_color || '#000000',
              zIndex: block.z_index || 1
            }}
          >
            <div className="w-full h-full relative">
              <Component
                content={
                  block.content &&
                  typeof block.content === 'object' &&
                  Object.keys(block.content).length > 0
                    ? block.content
                    : (typeof block.content === 'string' ? block.content : '')
                }
                block_type={block.block_type}
                editable={false}
              />
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {responsiveBlocks.length === 0 && (
        <div className="col-span-full flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center text-gray-500">
            <p>Diese Seite ist noch in Bearbeitung.</p>
          </div>
        </div>
      )}
    </div>
  );
}
