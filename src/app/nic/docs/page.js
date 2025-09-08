'use client'

import React, {useState} from 'react'
import Link from 'next/link'


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
      <header className="bg-background shadow-sm border-b border-b-accent h-16.5">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ml-[30dvw]">
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
              Willkommen zur NIC CMS Dokumentation! Hier finden Sie alles, was Sie für den Einstieg und die effektive Nutzung unseres Content Management Systems benötigen. Von der Installation bis hin zu erweiterten Funktionen - diese Dokumentation führt Sie Schritt für Schritt durch alle Aspekte von NIC CMS.
            </span>
          </p>
        </div>}
        {page === "blocks" && <div className="text-left mb-12 max-w-3xl">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            NIC CMS - Blocks
          </h2>
          <p>
            <span className="text-lg text-white/80 mx-auto block">
              Willkommen zur NIC CMS Dokumentation! Hier finden Sie alles, was Sie für den Einstieg und die effektive Nutzung unseres Content Management Systems benötigen. Von der Installation bis hin zu erweiterten Funktionen - diese Dokumentation führt Sie Schritt für Schritt durch alle Aspekte von NIC CMS.
            </span>
          </p>
        </div>}
        {page === "config" && <div className="text-left mb-12 max-w-3xl">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            NIC CMS - Config
          </h2>
          <p>
            <span className="text-lg text-white/80 mx-auto block">
              Willkommen zur NIC CMS Dokumentation! Hier finden Sie alles, was Sie für den Einstieg und die effektive Nutzung unseres Content Management Systems benötigen. Von der Installation bis hin zu erweiterten Funktionen - diese Dokumentation führt Sie Schritt für Schritt durch alle Aspekte von NIC CMS.
            </span>
          </p>
        </div>}
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 bg-gray-900 text-white py-8 mt-16 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 NIC CMS. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </>
  )
}

export default Docs