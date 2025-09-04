import React, {useState, useEffect} from 'react'
import { useCMS } from '@/context/CMSContext';

const DetailSideBar = () => {

  const {selectedBlock, setSelectedBlock, componentDefinitions, updateBlock} = useCMS();

  // State für Content als Objekt
  const [contentObject, setContentObject] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'success', 'error'
  const [saveMessage, setSaveMessage] = useState('');
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyValue, setNewPropertyValue] = useState('');

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
          // Fallback: leeres Objekt
          parsedContent = {};
        }
      } catch (error) {
        console.warn('Could not parse content, using defaults:', error);
        // Bei Parsing-Fehlern: versuche als text zu interpretieren oder leeres Objekt
        parsedContent = selectedBlock.content ? { text: selectedBlock.content } : {};
      }

      // Merge mit Default-Options aus Component-Definition
      const defaultOptions = componentDef?.options || {};
      const mergedContent = { ...defaultOptions, ...parsedContent };

      // Entferne undefined/null Werte um sauberes Objekt zu haben
      const cleanContent = Object.fromEntries(
        Object.entries(mergedContent).filter(([key, value]) => value !== undefined && value !== null)
      );

      setContentObject(cleanContent);
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

  // Property hinzufügen
  const addProperty = (key, defaultValue = '') => {
    if (key && !contentObject.hasOwnProperty(key)) {
      setContentObject(prev => ({
        ...prev,
        [key]: defaultValue
      }));
    }
  };

  // Property entfernen
  const removeProperty = (key) => {
    setContentObject(prev => {
      const newObj = { ...prev };
      delete newObj[key];
      return newObj;
    });
  };

  // Erkennung des Input-Typs basierend auf Wert und Key-Name
  const getInputType = (key, value) => {
    // Farb-Felder
    if (key.toLowerCase().includes('color') || key.toLowerCase().includes('colour')) {
      return 'color';
    }

    // URL/Link-Felder
    if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link') || key.toLowerCase().includes('href')) {
      return 'url';
    }

    // E-Mail-Felder
    if (key.toLowerCase().includes('email') || key.toLowerCase().includes('mail')) {
      return 'email';
    }

    // Nummer-Felder
    if ((key.toLowerCase().includes('width') || key.toLowerCase().includes('height') ||
         key.toLowerCase().includes('size') || key.toLowerCase().includes('count') ||
         key.toLowerCase().includes('number')) && !isNaN(value)) {
      return 'number';
    }

    // Boolean-Felder (Checkbox)
    if (typeof value === 'boolean' || value === 'true' || value === 'false') {
      return 'checkbox';
    }

    // Lange Texte (Textarea)
    if (typeof value === 'string' && (value.length > 50 || value.includes('\n') ||
        key.toLowerCase().includes('text') || key.toLowerCase().includes('content') ||
        key.toLowerCase().includes('description') || key.toLowerCase().includes('message'))) {
      return 'textarea';
    }

    // Standard Text-Input
    return 'text';
  };

  // Content speichern
  const updateContent = async () => {
    if (!selectedBlock) return;

    setSaveStatus('saving');
    setSaveMessage('Speichere...');

    try {
      console.log('💾 Saving content to database...', contentObject);

      // Aktualisiere auch lokalen State über CMSContext
      await updateBlock(selectedBlock.id, {
        content: JSON.stringify(contentObject)
      });

      setSaveStatus('success');
      setSaveMessage('Erfolgreich gespeichert!');
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
    <div className='w-96 h-screen fixed right-0 top-0 z-20 bg-background text-foreground border-3 border-r-0 rounded-l-xl  overflow-y-auto border-accent'>
      <div className='p-4'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold'>Block Details</h2>
          <button
            className='text-accent hover:text-foreground cursor-pointer'
            onClick={() => setSelectedBlock(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {selectedBlock ? (
          <div className='space-y-6'>
            {/* Block Info */}
            <div className='bg-accent/10   p-3 rounded-lg'>
              <h3 className='font-medium text-foreground mb-2'>Block Information</h3>
              <div className='text-sm text-foreground space-y-1'>
                <div><strong>Type:</strong> {selectedBlock.block_type}</div>
                <div><strong>ID:</strong> {selectedBlock.id}</div>
                <div><strong>Position:</strong> ({selectedBlock.grid_col}, {selectedBlock.grid_row})</div>
                <div><strong>Size:</strong> {selectedBlock.grid_width} × {selectedBlock.grid_height}</div>
              </div>
            </div>

            {/* Component Definition */}
            {componentDef && (
              <div className='bg-accent/10 p-3 rounded-lg'>
                <h3 className='font-medium text-foreground mb-2'>Component Definition</h3>
                <div className='text-sm text-foreground space-y-1'>
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
              <div className='bg-accent/10 p-3 rounded-lg'>
                <h3 className='font-medium text-foreground mb-2'>Default Options (from @options)</h3>
                <pre className='text-xs text-foreground bg-background p-2 rounded border overflow-x-auto'>
                  {JSON.stringify(componentDef.options, null, 2)}
                </pre>
              </div>
            )}

            {/* Content Editor - Object Properties */}
            <div className='bg-accent/10 p-3 rounded-lg'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='font-medium text-foreground'>Content Properties</h3>
                {componentDef?.options && Object.keys(componentDef.options).length > 0 && (
                  <div className='text-xs text-gray-400'>
                    ({Object.keys(contentObject).length} von {Object.keys(componentDef.options).length} Feldern)
                  </div>
                )}
              </div>

              <div className='space-y-3'>
                {Object.keys(contentObject).length > 0 ? (
                  Object.entries(contentObject).map(([key, value]) => {
                    const inputType = getInputType(key, value);
                    const isFromOptions = componentDef?.options && componentDef.options.hasOwnProperty(key);

                    return (
                      <div key={key} className='flex flex-col space-y-1'>
                        <div className='flex items-center justify-between'>
                          <label className='text-sm font-medium text-foreground flex items-center gap-2'>
                            {key}
                            {isFromOptions && (
                              <span className='text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded' title='Aus @options'>
                                📋
                              </span>
                            )}
                          </label>
                          {!isFromOptions && (
                            <button
                              onClick={() => removeProperty(key)}
                              className='text-xs text-red-500 hover:text-red-700'
                              title='Property entfernen'
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {inputType === 'textarea' ? (
                          <textarea
                            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                            onChange={(e) => updateContentProperty(key, e.target.value)}
                            className='w-full p-2 text-sm border border-gray-300 rounded resize-none'
                            rows={3}
                            placeholder={`Enter ${key}...`}
                          />
                        ) : inputType === 'color' ? (
                          <div className='flex items-center gap-2'>
                            <input
                              type="color"
                              value={typeof value === 'string' ? value : '#ffffff'}
                              onChange={(e) => updateContentProperty(key, e.target.value)}
                              className='w-12 h-8 border border-gray-300 rounded cursor-pointer'
                            />
                            <input
                              type="text"
                              value={typeof value === 'string' ? value : ''}
                              onChange={(e) => updateContentProperty(key, e.target.value)}
                              className='flex-1 p-2 text-sm border border-gray-300 rounded'
                              placeholder='#ffffff'
                            />
                          </div>
                        ) : inputType === 'checkbox' ? (
                          <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                              type="checkbox"
                              checked={value === true || value === 'true'}
                              onChange={(e) => updateContentProperty(key, e.target.checked)}
                              className='w-4 h-4'
                            />
                            <span className='text-sm text-gray-600'>
                              {value === true || value === 'true' ? 'Aktiviert' : 'Deaktiviert'}
                            </span>
                          </label>
                        ) : inputType === 'number' ? (
                          <input
                            type="number"
                            value={typeof value === 'number' ? value : (parseFloat(value) || '')}
                            onChange={(e) => updateContentProperty(key, parseFloat(e.target.value) || 0)}
                            className='w-full p-2 text-sm border border-gray-300 rounded'
                            placeholder={`Enter ${key}...`}
                          />
                        ) : typeof value === 'object' ? (
                          <textarea
                            value={JSON.stringify(value, null, 2)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                updateContentProperty(key, parsed);
                              } catch {
                                // Ungültiges JSON - lasse es als String
                                updateContentProperty(key, e.target.value);
                              }
                            }}
                            className='w-full p-2 text-sm border border-gray-300 rounded resize-none font-mono'
                            rows={3}
                            placeholder={`Enter ${key} (JSON)...`}
                          />
                        ) : (
                          <input
                            type={inputType}
                            value={typeof value === 'string' ? value : String(value)}
                            onChange={(e) => updateContentProperty(key, e.target.value)}
                            className='w-full p-2 text-sm border border-gray-300 rounded'
                            placeholder={`Enter ${key}...`}
                          />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className='text-gray-500 text-sm italic text-center py-4'>
                    Keine Content-Properties vorhanden.
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
                      '💾 Save'
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