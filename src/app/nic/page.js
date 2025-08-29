'use client';

import React from 'react';
import Sidebar from '@/components/nic/cms/sidebar';
import CMSEditor from '@/components/nic/cms/CMSEditor';
import { CMSProvider, useCMS } from '@/context/CMSContext';

const CMSContent = () => {
  const { sidebarOpen, mode } = useCMS();

  return (
    <div className="h-screen flex">
      {/* <Sidebar /> */}
      <div
        className={`flex-1 transition-all duration-300
          ${mode === 'preview' ? 'ml-0' : sidebarOpen ? 'ml-80' : 'ml-16'}
        `}
      >
        <CMSEditor />
      </div>
    </div>
  );
};

const NICPage = () => {
  return (
    <CMSProvider>
      <CMSContent />
    </CMSProvider>
  );
};

export default NICPage;