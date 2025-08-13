import React from 'react'
import Components from './Components'

const Sidebar = () => {
  return (
    <div className="fixed left-0 top-0 bg-blue-500 w-64 h-full overflow-y-auto">
      <Components />
    </div>
  )
}

export default Sidebar