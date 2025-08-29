import React, {useState, useEffect} from 'react'
import { useCMS } from '@/context/CMSContext';

const DetailSideBar = () => {

  const {selectedBlock, setSelectedBlock, componentDefinitions, updateBlock, publishDrafts} = useCMS();

  // State für Content als Objekt
  const [contentObject, setContentObject] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'success', 'error'
  const [saveMessage, setSaveMessage] = useState('');

  // Hole die Component-Definition für den ausgewählten Block
  const componentDef = selectedBlock ? componentDefinitions[selectedBlock.block_type] : null;

  // Initialisiere Content wenn sich selectedBlock ändert
  useEffect(() => {
    if (selectedBlock) {
      let parsedContent = {};

      try {
        // Versuche Content zu parsen falls es ein String ist
        if (typeof selectedBlock.content === 'string') {
          if (selectedBlock.content.startsWith('{') || selectedBlock.content.startsWith('[')) {
            parsedContent = JSON.parse(selectedBlock.content);
          } else {
            // Falls es nur ein String ist, verwandle zu Objekt mit text property
            parsedContent = { text: selectedBlock.content };
          }
        } else if (typeof selectedBlock.content === 'object' && selectedBlock.content !== null) {
          parsedContent = selectedBlock.content;
        } else {
          // Fallback: verwende Default-Options als Basis
          parsedContent = componentDef?.options || { text: '' };
        }
      } catch (error) {
        console.warn('Could not parse content, using defaults:', error);
        // Fallback: verwende Default-Options als Basis
        parsedContent = componentDef?.options || { text: selectedBlock.content || '' };
      }

      setContentObject(parsedContent);
    } else {
      setContentObject({});
    }
  }, [selectedBlock, componentDefinitions]);

  // Content-Property aktualisieren
  const updateContentProperty = (key, value) => {
    setContentObject(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Neue Property hinzufügen
  const addContentProperty = () => {
    const key = prompt('Property name:');
    if (key && key.trim()) {
      updateContentProperty(key.trim(), '');
    }
  };

  // Property entfernen
  const removeContentProperty = (key) => {
    setContentObject(prev => {
      const newObj = { ...prev };
      delete newObj[key];
      return newObj;
    });
  };

  // Content speichern
  const updateContent = async () => {
    if (!selectedBlock) return;

    setSaveStatus('saving');
    setSaveMessage('Speichere in Datenbank...');

    try {
      console.log('💾 Saving content to database...', contentObject);

      // Option 1: Direkte API für Block-Update verwenden
      const response = await fetch('/api/cms/update-block', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(contentObject),
          id: selectedBlock.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Database update response:', result);

      // Aktualisiere auch lokalen State über CMSContext
      await updateBlock(selectedBlock.id, {
        content: JSON.stringify(contentObject)
      });

      setSaveStatus('success');
      setSaveMessage('Erfolgreich in Datenbank gespeichert!');
      console.log('✅ Content saved successfully to database:', contentObject);

      // Status nach 3 Sekunden zurücksetzen
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);

    } catch (error) {
      console.error('❌ Error saving content to database:', error);
      setSaveStatus('error');
      setSaveMessage(`Fehler: ${error.message}`);

      // Status nach 5 Sekunden zurücksetzen
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
    }
  };

  return (
    <div className='w-96 h-screen fixed right-0 top-0 z-20 bg-white border-l border-gray-200 overflow-y-auto'>
      <div className='p-4'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold text-black'>Block Details</h2>
          <button
            className='text-black hover:text-gray-600 cursor-pointer'
            onClick={() => setSelectedBlock(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {selectedBlock ? (
          <div className='space-y-6'>
            {/* Block Info */}
            <div className='bg-gray-50 p-3 rounded-lg'>
              <h3 className='font-medium text-black mb-2'>Block Information</h3>
              <div className='text-sm text-gray-700 space-y-1'>
                <div><strong>Type:</strong> {selectedBlock.block_type}</div>
                <div><strong>ID:</strong> {selectedBlock.id}</div>
                <div><strong>Position:</strong> ({selectedBlock.grid_col}, {selectedBlock.grid_row})</div>
                <div><strong>Size:</strong> {selectedBlock.grid_width} × {selectedBlock.grid_height}</div>
              </div>
            </div>

            {/* Component Definition */}
            {componentDef && (
              <div className='bg-blue-50 p-3 rounded-lg'>
                <h3 className='font-medium text-black mb-2'>Component Definition</h3>
                <div className='text-sm text-gray-700 space-y-1'>
                  <div><strong>Name:</strong> {componentDef.name}</div>
                  <div><strong>Icon:</strong> {componentDef.icon}</div>
                  <div><strong>Category:</strong> {componentDef.category}</div>
                  {componentDef.description && (
                    <div><strong>Description:</strong> {componentDef.description}</div>
                  )}
                </div>
              </div>
            )}

            {/* Default Options from Component Definition */}
            {componentDef?.options && Object.keys(componentDef.options).length > 0 && (
              <div className='bg-green-50 p-3 rounded-lg'>
                <h3 className='font-medium text-black mb-2'>Default Options (from @options)</h3>
                <pre className='text-xs text-gray-700 bg-white p-2 rounded border overflow-x-auto'>
                  {JSON.stringify(componentDef.options, null, 2)}
                </pre>
              </div>
            )}

            {/* Content Editor - Object Properties */}
            <div className='bg-yellow-50 p-3 rounded-lg'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='font-medium text-black'>Content Properties</h3>
                <button
                  onClick={addContentProperty}
                  className='px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600'
                >
                  + Add Property
                </button>
              </div>

              <div className='space-y-3'>
                {Object.keys(contentObject).length > 0 ? (
                  Object.entries(contentObject).map(([key, value]) => (
                    <div key={key} className='flex flex-col space-y-1'>
                      <div className='flex items-center justify-between'>
                        <label className='text-sm font-medium text-gray-700'>{key}:</label>
                        <button
                          onClick={() => removeContentProperty(key)}
                          className='text-red-500 hover:text-red-700 text-xs'
                          title={`Remove ${key}`}
                        >
                          ✕
                        </button>
                      </div>
                      {typeof value === 'string' ? (
                        value.length > 50 ? (
                          <textarea
                            value={value}
                            onChange={(e) => updateContentProperty(key, e.target.value)}
                            className='w-full p-2 text-sm border border-gray-300 rounded resize-none'
                            rows={3}
                            placeholder={`Enter ${key}...`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateContentProperty(key, e.target.value)}
                            className='w-full p-2 text-sm border border-gray-300 rounded'
                            placeholder={`Enter ${key}...`}
                          />
                        )
                      ) : (
                        <textarea
                          value={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              updateContentProperty(key, parsed);
                            } catch {
                              updateContentProperty(key, e.target.value);
                            }
                          }}
                          className='w-full p-2 text-sm border border-gray-300 rounded resize-none font-mono'
                          rows={3}
                          placeholder={`Enter ${key} (JSON)...`}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div className='text-gray-500 text-sm italic text-center py-4'>
                    No content properties. Click "Add Property" to create one.
                  </div>
                )}
              </div>

              <div className='mt-4 space-y-3'>
                {/* Status-Anzeige */}
                {saveStatus !== 'idle' && (
                  <div className={`p-3 rounded text-sm ${
                    saveStatus === 'saving' ? 'bg-blue-100 text-blue-800' :
                    saveStatus === 'success' ? 'bg-green-100 text-green-800' :
                    saveStatus === 'error' ? 'bg-red-100 text-red-800' : ''
                  }`}>
                    <div className='flex items-center space-x-2'>
                      {saveStatus === 'saving' && (
                        <div className='w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
                      )}
                      {saveStatus === 'success' && <span>✅</span>}
                      {saveStatus === 'error' && <span>❌</span>}
                      <span>{saveMessage}</span>
                    </div>
                  </div>
                )}

                <div className='flex space-x-2'>
                  <button
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      saveStatus === 'saving'
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    onClick={updateContent}
                    disabled={saveStatus === 'saving'}
                  >
                    {saveStatus === 'saving' ? (
                      <div className='flex items-center justify-center space-x-2'>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        <span>Speichert...</span>
                      </div>
                    ) : (
                      '💾 Save to Database'
                    )}
                  </button>
                  <button
                    className='px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm'
                    onClick={() => {
                      // Reset zu ursprünglichem Content
                      if (selectedBlock) {
                        try {
                          const originalContent = typeof selectedBlock.content === 'string'
                            ? JSON.parse(selectedBlock.content)
                            : selectedBlock.content;
                          setContentObject(originalContent || {});
                        } catch {
                          setContentObject({ text: selectedBlock.content || '' });
                        }
                      }
                      setSaveStatus('idle');
                      setSaveMessage('');
                    }}
                    disabled={saveStatus === 'saving'}
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Full Block Data (Debug) */}
            <details className='bg-gray-100 p-3 rounded-lg'>
              <summary className='font-medium text-black cursor-pointer'>Full Block Data (Debug)</summary>
              <div className='mt-2 space-y-2'>
                <div>
                  <strong>Original Content:</strong>
                  <pre className='text-xs text-gray-700 bg-white p-2 rounded border overflow-x-auto'>
                    {JSON.stringify(selectedBlock.content, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>Parsed Content Object:</strong>
                  <pre className='text-xs text-gray-700 bg-white p-2 rounded border overflow-x-auto'>
                    {JSON.stringify(contentObject, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>Full Block:</strong>
                  <pre className='text-xs text-gray-700 bg-white p-2 rounded border overflow-x-auto'>
                    {JSON.stringify(selectedBlock, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          </div>
        ) : (
          <div className='text-center text-gray-500 mt-8'>
            <p>Wählen Sie einen Block aus, um Details anzuzeigen</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DetailSideBar