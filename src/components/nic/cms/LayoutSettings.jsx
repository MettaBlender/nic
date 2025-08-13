'use client';

import React, { useState, useEffect } from 'react';
import { useCMS } from '@/context/CMSContext';
import { HexAlphaColorPicker } from 'react-colorful';
import { Palette, Upload, Monitor } from 'lucide-react';

const LayoutSettings = () => {
  const { layoutSettings, updateLayoutSettings } = useCMS();
  const [localSettings, setLocalSettings] = useState(layoutSettings || {
    header_component: 'default',
    footer_component: 'default',
    background_color: '#ffffff',
    background_image: null,
    primary_color: '#3b82f6',
    secondary_color: '#64748b'
  });
  const [activeColorPicker, setActiveColorPicker] = useState(null);

  // Verfügbare Header/Footer Komponenten
  const headerComponents = [
    { value: 'default', label: 'Standard Header', component: 'DefaultHeader' },
    { value: 'navigation', label: 'Navigation Header', component: 'NavigationHeader' }
  ];

  const footerComponents = [
    { value: 'default', label: 'Standard Footer', component: 'DefaultFooter' },
    { value: 'social', label: 'Social Footer', component: 'SocialFooter' }
  ];

  useEffect(() => {
    if (layoutSettings) {
      setLocalSettings(layoutSettings);
    }
  }, [layoutSettings]);

  const handleUpdateSettings = async (updatedSettings) => {
    setLocalSettings(updatedSettings);
    try {
      await updateLayoutSettings(updatedSettings);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Einstellungen:', error);
    }
  };

  const handleColorChange = (key, color) => {
    const updatedSettings = { ...localSettings, [key]: color };
    handleUpdateSettings(updatedSettings);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Hier würden Sie normalerweise das Bild auf den Server hochladen
    // Für dieses Beispiel verwenden wir eine lokale URL
    const imageUrl = URL.createObjectURL(file);
    const updatedSettings = { ...localSettings, background_image: imageUrl };
    handleUpdateSettings(updatedSettings);
  };

  const removeBackgroundImage = () => {
    const updatedSettings = { ...localSettings, background_image: null };
    handleUpdateSettings(updatedSettings);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-800">Layout-Einstellungen</h2>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Header Component Selection */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Header Komponente</h3>
          <select
            value={localSettings.header_component || 'default'}
            onChange={(e) => handleUpdateSettings({ ...localSettings, header_component: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {headerComponents.map((comp) => (
              <option key={comp.value} value={comp.value}>
                {comp.label}
              </option>
            ))}
          </select>
        </div>

        {/* Footer Component Selection */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Footer Komponente</h3>
          <select
            value={localSettings.footer_component || 'default'}
            onChange={(e) => handleUpdateSettings({ ...localSettings, footer_component: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {footerComponents.map((comp) => (
              <option key={comp.value} value={comp.value}>
                {comp.label}
              </option>
            ))}
          </select>
        </div>

        {/* Background Settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Hintergrund</h3>

          {/* Background Color */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hintergrundfarbe
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveColorPicker(activeColorPicker === 'background' ? null : 'background')}
                  className="w-10 h-10 border-2 border-gray-300 rounded-md flex items-center justify-center hover:border-gray-400"
                  style={{ backgroundColor: localSettings.background_color }}
                >
                  <Palette className="w-4 h-4 text-white mix-blend-difference" />
                </button>
                <input
                  type="text"
                  value={localSettings.background_color || '#ffffff'}
                  onChange={(e) => handleColorChange('background_color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#ffffff"
                />
              </div>

              {activeColorPicker === 'background' && (
                <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <HexAlphaColorPicker
                    color={localSettings.background_color}
                    onChange={(color) => handleColorChange('background_color', color)}
                    className="w-full h-48"
                  />
                </div>
              )}
            </div>

            {/* Background Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hintergrundbild
              </label>

              {localSettings.background_image ? (
                <div className="space-y-2">
                  <div className="w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={localSettings.background_image}
                      alt="Hintergrundbild"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={removeBackgroundImage}
                    className="w-full px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Bild entfernen
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="background-upload"
                  />
                  <label
                    htmlFor="background-upload"
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-gray-400"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Bild hochladen</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Color Scheme */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Farbschema</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primärfarbe
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveColorPicker(activeColorPicker === 'primary' ? null : 'primary')}
                  className="w-10 h-10 border-2 border-gray-300 rounded-md flex items-center justify-center hover:border-gray-400"
                  style={{ backgroundColor: localSettings.primary_color }}
                >
                  <Palette className="w-4 h-4 text-white mix-blend-difference" />
                </button>
                <input
                  type="text"
                  value={localSettings.primary_color || '#3b82f6'}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#3b82f6"
                />
              </div>

              {activeColorPicker === 'primary' && (
                <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <HexAlphaColorPicker
                    color={localSettings.primary_color}
                    onChange={(color) => handleColorChange('primary_color', color)}
                    className="w-full h-48"
                  />
                </div>
              )}
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sekundärfarbe
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveColorPicker(activeColorPicker === 'secondary' ? null : 'secondary')}
                  className="w-10 h-10 border-2 border-gray-300 rounded-md flex items-center justify-center hover:border-gray-400"
                  style={{ backgroundColor: localSettings.secondary_color }}
                >
                  <Palette className="w-4 h-4 text-white mix-blend-difference" />
                </button>
                <input
                  type="text"
                  value={localSettings.secondary_color || '#64748b'}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#64748b"
                />
              </div>

              {activeColorPicker === 'secondary' && (
                <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <HexAlphaColorPicker
                    color={localSettings.secondary_color}
                    onChange={(color) => handleColorChange('secondary_color', color)}
                    className="w-full h-48"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Vorschau</h3>
          <div
            className="w-full h-32 rounded-md border border-gray-300 relative overflow-hidden"
            style={{
              backgroundColor: localSettings.background_color,
              backgroundImage: localSettings.background_image ? `url(${localSettings.background_image})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute top-2 left-2 right-2 flex justify-between">
              <div
                className="px-3 py-1 rounded text-white text-sm"
                style={{ backgroundColor: localSettings.primary_color }}
              >
                Primär
              </div>
              <div
                className="px-3 py-1 rounded text-white text-sm"
                style={{ backgroundColor: localSettings.secondary_color }}
              >
                Sekundär
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutSettings;
