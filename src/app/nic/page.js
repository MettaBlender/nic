'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/nic/cms/sidebar';
import CMSEditor from '@/components/nic/cms/CMSEditor';
import { CMSProvider, useCMS } from '@/context/CMSContext';
import { LogOut } from 'lucide-react';

const CMSContent = () => {
  const { sidebarOpen } = useCMS();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
      router.push('/nic/login');
    } catch (error) {
      console.error('Logout fehler:', error);
    }
  };

  return (
    <div className="h-screen flex">
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 z-50 bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 flex items-center gap-2 text-sm"
      >
        <LogOut size={16} />
        Logout
      </button>

      <Sidebar />
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-80' : 'ml-16'
        }`}
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