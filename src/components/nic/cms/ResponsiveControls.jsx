/**
 * Responsive Controls Component
 *
 * UI for managing responsive layouts in NIC CMS
 */

'use client';

import React from 'react';
import { useCMS } from '@/context/CMSContext';
import { Monitor, Tablet, Smartphone, Zap, RefreshCw } from 'lucide-react';

export default function ResponsiveControls() {
  const {
    deviceSize,
    switchDevice,
    autoResponsiveEnabled,
    toggleAutoResponsive,
    generateAutoResponsiveLayouts,
    getCurrentGridConfig,
    getCurrentDeviceBlocks,
    blocks
  } = useCMS();

  const gridConfig = getCurrentGridConfig();
  const deviceBlocks = getCurrentDeviceBlocks();
  const hasResponsiveLayout = autoResponsiveEnabled && deviceBlocks.length > 0;
  const blocksReorganized = hasResponsiveLayout &&
    deviceBlocks.some((db, i) => {
      const originalBlock = blocks[i];
      return originalBlock && (
        db.grid_col !== originalBlock.grid_col ||
        db.grid_row !== originalBlock.grid_row ||
        db.grid_width !== originalBlock.grid_width
      );
    });

  const devices = [
    { id: 'mobile', label: 'Mobile', icon: Smartphone, width: '375px', maxWidth: 375, columns: 4 },
    { id: 'tablet', label: 'Tablet', icon: Tablet, width: '768px', maxWidth: 768, columns: 8 },
    { id: 'desktop', label: 'Desktop', icon: Monitor, width: '1200px+', maxWidth: null, columns: 12 }
  ];

  const currentDevice = devices.find(d => d.id === deviceSize);

  return (
    <div className="bg-white border-b border-gray-200 p-3 space-y-3">
      {/* Device Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 mr-2">Ansicht:</span>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {devices.map(device => {
            const Icon = device.icon;
            const isActive = deviceSize === device.id;

            return (
              <button
                key={device.id}
                onClick={() => switchDevice(device.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-md transition-all
                  ${isActive
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
                title={`${device.label} (${device.width})`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{device.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto-Responsive Toggle & Info */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Auto-Responsive Toggle */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={autoResponsiveEnabled}
                onChange={(e) => toggleAutoResponsive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={16} className={autoResponsiveEnabled ? 'text-blue-600' : 'text-gray-400'} />
              <span className="text-sm font-medium text-gray-700">
                Auto-Responsive
              </span>
            </div>
          </label>

          {/* Manual Regenerate Button */}
          {autoResponsiveEnabled && (
            <button
              onClick={generateAutoResponsiveLayouts}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Responsive Layouts neu generieren"
            >
              <RefreshCw size={14} />
              <span>Neu generieren</span>
            </button>
          )}
        </div>

        {/* Grid Info */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 border border-gray-300 rounded grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5">
              <div className="bg-gray-300 rounded-sm"></div>
              <div className="bg-gray-300 rounded-sm"></div>
              <div className="bg-gray-300 rounded-sm"></div>
              <div className="bg-gray-300 rounded-sm"></div>
            </div>
            <span className="font-medium">{gridConfig.columns} Spalten</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>{deviceBlocks.length} Blöcke</span>
          </div>

          {blocksReorganized && (
            <div className="flex items-center gap-1.5 text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              <span className="font-medium">Angepasst</span>
            </div>
          )}
        </div>
      </div>

      {/* Info Message */}
      {autoResponsiveEnabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <Zap size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">
              Auto-Responsive aktiv: {currentDevice?.label}
              {currentDevice?.maxWidth && ` (max. ${currentDevice.maxWidth}px)`}
            </p>
            <p className="text-blue-700">
              Blöcke werden automatisch für {gridConfig.columns} Spalten angepasst.
              {blocksReorganized && ' Layout wurde optimiert.'}
              {' '}Wechseln Sie die Ansicht, um andere Geräte zu sehen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
