import React from 'react'
import { useCMS } from '@/context/CMSContext';

const DetailSideBar = () => {

  const {selectedBlock, setSelectedBlock} = useCMS();

  return (
    <div className='w-96 h-screen fixed right-0 top-0 z-20 bg-white'>
      <div className='absolute top-2 right-2 text-black cursor-pointer' onClick={() => setSelectedBlock(null)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </div>
      <h2 className='text-xl w-full text-center text-black'>DetailSideBar</h2>
      <p className='text-black'>{JSON.stringify(selectedBlock, null, 2)}</p>
    </div>
  )
}

export default DetailSideBar