import React from 'react'

/**
 * Einfacher Text Block für Inhalte
 * @icon 🤣
 * @width 3
 * @height 2
 * @options {
 *  text: "Lorem ipsum dolor sit amet"
 * }
 */

const Aaron = ({content}) => {

  console.log('Aaron content:', content);

  return (
    <div className='w-full h-full bg-white'>Aaron</div>
  )
}

export default Aaron