'use client';

import React, { useState } from 'react';
import Components from './Components';
import PageManager from './PageManager';
import LayoutSettings from './LayoutSettings';
import { useCMS } from '@/context/CMSContext';
import {
  Blocks,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  RotateCcw,
  RotateCw
} from 'lucide-react';

const Sidebar = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    pendingOperationsCount,
    publishDrafts,
    discardDrafts,
    undo,
    redo,
    undoHistory,
    redoHistory
  } = useCMS();
  const [activeTab, setActiveTab] = useState('blocks');

  const tabs = [
    {
      id: 'blocks',
      label: 'Blöcke',
      icon: Blocks,
      component: Components
    },
    {
      id: 'pages',
      label: 'Seiten',
      icon: FileText,
      component: PageManager
    },
    {
      id: 'layout',
      label: 'Layout',
      icon: Settings,
      component: LayoutSettings
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Components;

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 bg-blue-500 h-full overflow-hidden transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-80' : 'w-16'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 right-2 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 z-10"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {sidebarOpen ? (
          <div className="h-full flex flex-col">
            {/* Draft-Status und Aktionen */}
            <div className="bg-blue-600 p-4 pt-16 border-b border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">
                  Draft-Änderungen: {pendingOperationsCount}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={undo}
                    disabled={undoHistory.length === 0}
                    className="p-1 bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800"
                    title="Rückgängig (Ctrl+Z)"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={redo}
                    disabled={redoHistory.length === 0}
                    className="p-1 bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800"
                    title="Wiederholen (Ctrl+Y)"
                  >
                    <RotateCw size={14} />
                  </button>
                </div>
              </div>

              {pendingOperationsCount > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={publishDrafts}
                    className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1"
                  >
                    <Upload size={12} />
                    Veröffentlichen
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`${pendingOperationsCount} Änderungen verwerfen?`)) {
                        discardDrafts();
                      }
                    }}
                    className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center justify-center gap-1"
                  >
                    <X size={12} />
                    Verwerfen
                  </button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-blue-600 p-4">
              <div className="flex space-x-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-500 text-white'
                          : 'text-blue-100 hover:text-white hover:bg-blue-500/50'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              <ActiveComponent />
            </div>
          </div>
        ) : (
          /* Collapsed Sidebar */
          <div className="h-full flex flex-col pt-16">
            <div className="flex flex-col space-y-2 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(true);
                    }}
                    className={`p-3 rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-100 hover:text-white hover:bg-blue-600'
                    }`}
                    title={tab.label}
                  >
                    <Icon size={20} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;