'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCMS } from '@/context/CMSContext';
import GridCanvas from './GridCanvas';
import Sidebar from './sidebar';
import { Move, Edit, Trash2, Eye, Plus, LogOut, Grid3X3, Magnet, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DetailSideBar from './DetailSideBar';

// Dynamic component detection via API
const getComponentFiles = async () => {
  try {
    const response = await fetch('/api/cms/components');
    const data = await response.json();

    if (data.success) {
      const components = [];

      // Flatten the categories to a list of components
      Object.entries(data.categories).forEach(([category, categoryComponents]) => {
        categoryComponents.forEach(comp => {
          components.push({
            name: comp.name,
            componentName: comp.componentName,
            component: category === 'root' ? comp.file.replace(/\.(jsx?|tsx?)$/, '') : `${category}/${comp.file.replace(/\.(jsx?|tsx?)$/, '')}`,
            icon: comp.icon || '🧩',
            description: comp.description || 'Block Component',
            category: category
          });
        });
      });

      return components;
    }
  } catch (error) {
    console.error('Error loading component list:', error);
  }
};

const CMSEditor = () => {
  const {
    currentPage,
    blocks,
    activeBlock,
    mode,
    setMode,
    setContainerSize,
    selectedBlock,
    deviceSize,
    setDeviceSize,
  } = useCMS();

  const containerRef = useRef(null);
  const [blockComponents, setBlockComponents] = useState({});
  const [availableComponents, setAvailableComponents] = useState([]);
  const router = useRouter();

  // Dynamic loading of block components
  useEffect(() => {
    const loadComponents = async () => {
      const components = {};
      const availableComps = await getComponentFiles();

      setAvailableComponents(availableComps);

      try {
        // Load all available components dynamically
        for (const comp of availableComps) {
          try {
            const module = await import(`@/components/nic/blocks/${comp.component}`);

            // Use both the name and component name as key
            components[comp.name] = module.default;
            components[comp.componentName] = module.default;

            // Make block types available without "Block" suffix as well
            if (comp.component.endsWith('Block')) {
              const shortName = comp.component.replace('Block', '');
              components[shortName] = module.default;
            }

          } catch (importError) {
            console.warn(`Component ${comp.component} could not be loaded:`, importError);

            // Fallback component for non-loadable components
            components[comp.name] = ({ content }) => (
              <div className="text-red-500 p-4 border border-red-300 rounded">
                <div className="font-bold">Component not available</div>
                <div className="text-sm">Type: {comp.name}</div>
                <div className="text-xs mt-2">{content}</div>
              </div>
            );
          }
        }

      } catch (error) {
        console.error('Error loading components:', error);
      }

      setBlockComponents(components);
    };

    loadComponents();
  }, []);

  // Monitor container size
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);

    return () => window.removeEventListener('resize', updateContainerSize);
  }, [setContainerSize]);

  // Function to export available components (for Sidebar etc.)
  const getLoadedComponents = () => {
    return availableComponents.map(comp => ({
      ...comp,
      isLoaded: !!blockComponents[comp.name] || !!blockComponents[comp.componentName]
    }));
  };

  // Make the function globally available (for other components)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.cmsGetAvailableComponents = getLoadedComponents;
    }
  }, [availableComponents, blockComponents]);

  if (!currentPage) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-center text-foreground">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="text-xl font-semibold mb-2">No page selected</h2>
          <p>Select a page or create a new page.</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
      router.push('/nic/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const openPublicPage = () => {
    const url = currentPage.slug === 'home' ? '/home' : `/${currentPage.slug}`;
    window.open(url, '_blank');
  }

  return (
    <div className="w-full h-full flex">
      {/* Sidebar */}
      {mode !== 'preview' && <Sidebar />}

      {selectedBlock && mode !== 'preview' && <DetailSideBar />}

      <button onClick={openPublicPage} className='fixed top-4 left-4 z-100 cursor-pointer text-accent group'><Globe /><p className='hidden group-hover:block absolute top-0 left-6 w-[500%] text-center rounded-md bg-background text-accent'>Public Page</p></button>

      {/* Main Editor */}
      <div className={`flex-1 flex flex-col z-10`}>
        {/* Editor Toolbar */}
        <div className="bg-background border-b border-accent p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{currentPage.title}</h1>
            <span className="text-sm text-gray-500">({currentPage.slug})</span>
          </div>

          <div className={`flex items-center gap-2 ${selectedBlock && mode !== 'preview' ? 'mr-96' : ''}`}>
            {/* <select className='px-3 py-2 rounded-md bg-background text-foreground ring ring-accent/50 hover:ring-accent cursor-pointer' onChange={(e) => setDeviceSize(e.target.value)} value={deviceSize}>
              <option value="mobile">Mobil</option>
              <option value="tablet">Tablet</option>
              <option value="desktop">Desktop</option>
            </select> */}
            <button
              onClick={() => setMode('move')}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                mode === 'move'
                  ? 'bg-accent/10 text-foreground ring ring-accent'
                  : 'bg-background text-foreground ring ring-accent/50 hover:ring-accent hover:bg-accent/10 cursor-pointer'
              }`}
            >
              <Move size={16} />
              Move
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                mode === 'edit'
                  ? 'bg-accent/10 text-foreground ring ring-accent'
                  : 'bg-background text-foreground ring ring-accent/50 hover:ring-accent hover:bg-accent/10 cursor-pointer'
              }`}
            >
              <Edit size={16} />
              Edit
            </button>

            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                mode === 'preview'
                  ? 'bg-accent/10 hover:bg-background text-white ring ring-accent cursor-pointer'
                  : 'bg-background text-foreground ring ring-accent/50 hover:ring-accent hover:bg-accent/10 cursor-pointer'
              }`}
            >
              <Eye size={16} />
              Preview
            </button>

            {/* Logout Button */}
            <div className="h-6 w-px bg-accent mx-2"></div>
            <button
              onClick={handleLogout}
              className='px-3 py-2 rounded-md flex items-center gap-2 bg-background text-foreground ring ring-accent/50 hover:ring-accent-red hover:bg-accent-red/10 cursor-pointer'
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        {/* Grid Canvas */}
        <div className="flex-1 w-full">
          <GridCanvas />
        </div>

        {/* Status Bar */}
        <div className="bg-background border-t border-accent px-4 py-2 flex items-center justify-between text-sm text-foreground">
          <div className="flex items-center gap-4">
            <span>Mode: <span className="font-medium capitalize">{mode}</span></span>
            <span>Components loaded: {Object.keys(blockComponents).length}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Blocks: {blocks.length}</span>
            {activeBlock && (
              <span className="text-blue-600">
                Aktiv: {activeBlock.block_type} #{activeBlock.id}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMSEditor;
