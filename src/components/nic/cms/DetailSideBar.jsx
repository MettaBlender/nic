import React, {useState} from 'react'
import { useCMS } from '@/context/CMSContext';

const DetailSideBar = () => {

  const {selectedBlock, setSelectedBlock, componentDefinitions} = useCMS();

  const [content, setContent] = useState(selectedBlock ? selectedBlock.content : '');

  // Hole die Component-Definition für den ausgewählten Block
  const componentDef = selectedBlock ? componentDefinitions[selectedBlock.block_type] : null;

  const updateContent = async () => {
    const response = await fetch('/api/cms/update-block', {
      method: 'PUT',
      body: JSON.stringify({content, id: selectedBlock.id})
    })

    const data = await response.json();

    console.log('Update response:', data);

  }

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

            {/* Block Content */}
            <div className='bg-gray-50 p-3 rounded-lg'>
              <h3 className='font-medium text-black mb-2'>Content</h3>
              <div className='text-sm text-gray-700'>
                <textarea type='text' className='w-full' rows={5} value={content.text} onChange={(e) => {
                    const newContent = e.target.value;
                    setContent(newContent);
                  }} />
              </div>
              <button className='cursor-pointer text-black' onClick={updateContent}>update Content</button>
            </div>

            {/* Full Block Data (Debug) */}
            <details className='bg-gray-100 p-3 rounded-lg'>
              <summary className='font-medium text-black cursor-pointer'>Full Block Data (Debug)</summary>
              <pre className='text-xs text-gray-700 bg-white p-2 rounded border mt-2 overflow-x-auto'>
                {JSON.stringify(selectedBlock, null, 2)}
              </pre>
               <pre className='text-xs text-gray-700 bg-white p-2 rounded border mt-2 overflow-x-auto'>
                {JSON.parse(selectedBlock.content).text}
              </pre>
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