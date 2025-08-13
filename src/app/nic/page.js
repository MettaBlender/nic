import Sidebar from '@/components/nic/cms/sidebar'
import React from 'react'

const page = () => {
  return (
    <div className='w-[calc(100% - 25rem)] flex ml-100 pl-5'>
      <Sidebar/>
      <p>page</p>
    </div>
  )
}

export default page