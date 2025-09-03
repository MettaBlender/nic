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
        className={`fixed left-0 top-0 bg-background h-full overflow-hidden transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-80' : 'w-16'
        }`}
      >
        {/* Toggle Button */}
        <div className={`absolute top-4 left-0 flex items-center ${sidebarOpen ? 'w-80 justify-end pr-2' : 'w-16 justify-center'}`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-background text-foreground p-2 rounded-md ring ring-transparent hover:bg-accent/10 hover:ring-accent z-10"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {sidebarOpen ? (
          <div className="h-full flex flex-col">
            {/* Draft-Status und Aktionen - IMMER SICHTBAR */}
            <div className="p-4 pt-16 border-b border-accent">
              <div className="flex items-center justify-between mb-2">
                <span className="text-foreground text-sm font-medium">
                  Draft-Änderungen: {pendingOperationsCount}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={undo}
                    disabled={undoHistory.length === 0}
                    className="p-1 text-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/20"
                    title="Rückgängig (Ctrl+Z)"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={redo}
                    disabled={redoHistory.length === 0}
                    className="p-1 text-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/20"
                    title="Wiederholen (Ctrl+Y)"
                  >
                    <RotateCw size={14} />
                  </button>
                </div>
              </div>

              {/* Buttons IMMER anzeigen */}
              <div className="flex gap-2">
                <button
                  onClick={publishDrafts}
                  disabled={pendingOperationsCount === 0}
                  className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <Upload size={12} />
                  Veröffentlichen
                </button>
                <button
                  onClick={() => {
                    if (pendingOperationsCount === 0) return;
                    if (confirm(`${pendingOperationsCount} Änderungen verwerfen?`)) {
                      discardDrafts();
                    }
                  }}
                  disabled={pendingOperationsCount === 0}
                  className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <X size={12} />
                  Verwerfen
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="p-4">
              <div className="flex space-x-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'ring ring-accent bg-accent/10 text-foreground'
                          : 'text-foreground ring ring-transparent hover:ring-accent'
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
                        ? 'bg-accent/10 ring ring-accent text-foreground'
                        : 'text-foreground ring ring-transparent hover:ring-accent cursor-pointer'
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
          className="fixed inset-0 bg-transparent bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;