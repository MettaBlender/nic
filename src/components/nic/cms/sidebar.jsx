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
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useCMS();
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
            {/* Tabs */}
            <div className="bg-blue-600 p-4 pt-16">
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