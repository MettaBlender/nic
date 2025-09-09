'use client'

import React, {useState} from 'react'
import Link from 'next/link'
import Image from 'next/image'


const DocLink = ({ title, active, onClick }) => {
  return (
    <p className={`text-foreground hover:text-accent/80 transition-colors cursor-pointer ${active ? 'font-bold' : ''}`} onClick={onClick}>
      {title}
    </p>
  )
}

const Docs = () => {

  const [page, setPage] = useState("start")

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 w-screen bg-background shadow-sm border-b border-b-accent h-16.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-foreground">NIC CMS - Docs</h1>
            </div>
            <nav className="flex space-x-4">
              <Link
                href="/nic"
                className="bg-accent/10 ring ring-accent text-white px-4 py-2 rounded-md hover:bg-accent/40 transition-colors"
              >
                CMS Ausprobieren
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <nav className='fixed w-[20dvw] h-screen left-0 top-16.5 bg-background border-r rounded-tr-xl border-accent'>
        <h3 className='text-xl w-full text-center mt-5'>Content</h3>
        <ul className='flex flex-col p-4 space-y-4 ml-2'>
          <li>
            <DocLink title="Start" active={page === "start"} onClick={() => setPage("start")} />
          </li>
          <li>
            <DocLink title="CMS" active={page === "cms"} onClick={() => setPage("cms")} />
          </li>
          <li>
            <DocLink title="Blocks" active={page === "blocks"} onClick={() => setPage("blocks")} />
          </li>
          <li>
            <DocLink title="Configs" active={page === "configs"} onClick={() => setPage("config")} />
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ml-[30dvw] pt-20 min-h-screen">
        {page === "start" && <div className="text-left mb-12 max-w-3xl">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            NIC CMS - Docs
          </h2>
          <p>
            <span className="text-lg text-white/80 mx-auto block">
              Willkommen zur NIC CMS Dokumentation! Hier finden Sie alles, was Sie für den Einstieg und die effektive Nutzung unseres Content Management Systems benötigen. Von der Installation bis hin zu erweiterten Funktionen - diese Dokumentation führt Sie Schritt für Schritt durch alle Aspekte von NIC CMS.
            </span>
          </p>
        </div>}
        {page === "cms" && <div className="text-left mb-12 max-w-3xl">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            NIC CMS - Frontend
          </h2>
          <p>
            <span className="text-lg text-white/80 mx-auto block">
              You will find here everything about the user interface of NIC CMS.
            </span>
          </p>
          <div className='my-20'>
            <ul>
              <li className='mt-4 list-disc list-inside'>
                First you have to Login with your credentials.
                For Testing you can use the following credentials: <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Username:</strong> admin <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Password:</strong> admin123
              </li>
            </ul>
            <Image src="/docs/login.png" width={500} height={400} className='w-full' alt='loginscreen'/>
          </div>
          <hr className='text-accent'/>
          <div className='my-20'>
            <ul>
              <li className='mt-4 list-disc list-inside'>
                In the Top right corner you can swtich between three modus and also have the option to logout.
              </li>
              <li className='mt-4 list-disc list-inside'>
                With the first modus you can move the blocks along the grid.
              </li>
              <li className='mt-4 list-disc list-inside'>
                In the second modus edit you can edit the content of the blocks.
              </li>
              <li className='mt-4 list-disc list-inside'>
                In preview you can see how the page will look like for the visitors.
              </li>
            </ul>
            <Image src="/docs/modus.png" width={500} height={400} className='w-full' alt='modus'/>
          </div>
          <hr className='text-accent'/>
          <div className='my-20'>
            <ul>
              <li className='mt-4 list-disc list-inside'>
                On top of the grid you have some more buttons and some information. in the top you see the actual page and his slug.
                right under you see three buttons.
                With the first you can add a new row to your grid.
                The second buttons alows you to delete the last row of your grid.
                With the last button you can delete all blocks from this page.
              </li>
              <Image src="/docs/gridInfo.png" width={500} height={400} className='w-full' alt='gridInfo'/>
            </ul>
          </div>
          <hr className='text-accent'/>
          <div className='my-20'>
            <ul>
              <li className='mt-4 list-disc list-inside'>
                In the left you have a sidebar. in the top of it you can switch between three tabs (blocks, pages, layout).
                you also have the option to discard your changes or to publish it.
              </li>
              <Image src="/docs/sidebar.png" width={500} height={400} className='w-1/2 mx-auto' alt='sidebar'/>
              <li className='mt-4 list-disc list-inside'>
                In the block tab you can add blocks to your grid. the blocks are grouped in folders.
              </li>
              <Image src="/docs/blocks.png" width={500} height={400} className='w-1/2 mx-auto' alt='blocks'/>
              <li className='mt-4 list-disc list-inside'>
                On the pages you can add and select pages.
              </li>
              <Image src="/docs/pages.png" width={500} height={400} className='w-1/2 mx-auto' alt='pages'/>
              <li className='mt-4 list-disc list-inside'>
                With the last tab the layout tab, you can changes the layout settings for all teh pages.
              </li>
              <Image src="/docs/layout.png" width={500} height={400} className='w-1/2 mx-auto' alt='layout'/>
            </ul>
            <hr className='text-accent'/>
            <div className='my-20'>
              <ul>
                <li className='mt-4 list-disc list-inside'>
                  If you have droped some blocks into the grid you can select one block, for best experience use the edit modus,
                  and you should see a detail panel on the right. <br/>
                  In this panel you can see some information about the block and also edit the content of the block. <br/>
                </li>
                <Image src="/docs/detailSidepanel.png" width={500} height={400} className='w-1/2 mx-auto' alt='detail sidepanel'/>
              </ul>
            </div>
          </div>
        </div>}
        {page === "blocks" && <div className="text-left mb-12 max-w-3xl">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            NIC CMS - Blocks
          </h2>
          <p>
            <span className="text-lg text-white/80 mx-auto block">
              You can add your own blocks to NIC CMS. But for this you need to have the project setuped on your local machine.
            </span>
          </p>
          <div className='my-20'>
            <ul>
              <li className='mt-4 list-disc list-inside'>
                Creating your own blocks is simple. just create a new folder in the blocks folder.
                Name the folder as you like, this will be the name of your group.
                In the group/Folder you can create Normal React Components.
                The CMS will automatically read your blocks and add it to your CMS.
              </li>
              <Image src="/docs/blocksFolder.png" width={500} height={400} className='w-1/2 mx-auto mt-3' alt='blocks folder'/>
                <li className='mt-4 list-disc list-inside'>
                  There are only some rules you have to follow:
                </li>
                <ul className='list-disc list-inside ml-8'>
                  <li className='mt-2'>
                    The component must be a default export.
                  </li>
                  <li className='mt-2'>
                    The Folder name must be unique.
                  </li>
                  <li className='mt-2'>
                    Don't make subfolders of an folder in the blocks folder, it won't work properly.
                  </li>
                  <li className='mt-2'>
                    The name of the File and the Component must match.
                  </li>
                </ul>
            </ul>
          </div>
        </div>}
        {page === "config" && <div className="text-left mb-12 max-w-3xl">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            NIC CMS - Config
          </h2>
          <p>
            <span className="text-lg text-white/80 mx-auto block">
              For NIC exist some CMS configs.
            </span>
          </p>
          <div className='my-20'>
            <ul>
              <li className='mt-4 list-disc list-inside'>
                You can find the config easy in the root of the project in the file nic.config.js
              </li>
              <Image src="/docs/nicConfig.png" width={500} height={400} className='w-1/2 mx-auto' alt='detail sidepanel'/>
            </ul>
          </div>
          <hr className='text-accent'/>
          <div className='my-20'>
            <ul>
              <li className='mt-4 list-disc list-inside'>
                In the config you can set the following options:
              </li>
            </ul>
            <div className="bg-gray-800 rounded-lg p-4 mt-4 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                <code>{`/**
 * NIC CMS Configuration
 *
 * Grid System Konfiguration für das Layout-System
 */

const nicConfig = {
  // Grid System
  grid: {
    // Anzahl der Spalten im Grid (Standard: 12 wie Bootstrap)
    columns: 12,

    // Minimale Anzahl der Reihen (automatisch erweiterbar)
    minRows: 12,

    // Maximale Anzahl der Reihen (0 = unbegrenzt)
    maxRows: 0,

    // Gap zwischen Grid-Elementen in px
    gap: 8,

    // Mindest-Höhe einer Grid-Reihe in px
    rowHeight: '60px',

    // Responsive Breakpoints
    breakpoints: {
      mobile: {
        maxWidth: 768,
        columns: 4, // Weniger Spalten auf Mobile
        rowHeight: 50
      },
      tablet: {
        maxWidth: 1024,
        columns: 8,
        rowHeight: 55
      },
      desktop: {
        minWidth: 1025,
        columns: 12,
        rowHeight: 60
      }
    }
  },

  // Drag & Drop Konfiguration
  dragDrop: {
    enabled: true,
    snapToGrid: true,
    showDropZones: true,
    animationDuration: 200,
    ghostOpacity: 0.5
  },

};

// Export für Node.js und Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = nicConfig;
} else if (typeof window !== 'undefined') {
  window.nicConfig = nicConfig;
}

export default nicConfig;`}</code>
              </pre>
            </div>
            <ul>
              <li className='mt-4 list-disc list-inside'>
                The login is configured in .env file: <br/>
                LOGIN_USERNAME=admin<br/>
                LOGIN_PASSWORD=admin123<br/>
                NEON_DATABASE_URL=your_database_url<br/>

              </li>
            </ul>
          </div>
        </div>}
      </main>

      {/* Footer */}
      <footer className="bottom-0 bg-gray-900 text-white py-8 mt-16 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 NIC CMS. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </>
  )
}

export default Docs