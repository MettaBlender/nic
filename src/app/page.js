import Link from 'next/link';
import { getPages, getPageBySlug } from '@/lib/database';
import { redirect } from 'next/navigation';

export default async function HomePage() {

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-b-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-foreground">NIC CMS</h1>
            </div>
            <nav className="flex space-x-4">
              <Link
                href="/nic"
                className="bg-accent/10 ring ring-accent text-white px-4 py-2 rounded-md hover:bg-accent/40 transition-colors"
              >
                Try CMS
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Welcome to NIC CMS
          </h2>
          <p className="text-xl text-foreground mb-8">
            A modern Content Management System with drag & drop editor
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="/nic"
              className="bg-transparent ring ring-accent/10 hover:ring-accent text-foreground px-6 py-3 rounded-lg hover:bg-accent/40 transition-colors text-lg font-medium"
            >
              Try CMS Editor
            </Link>
          </div>
        </div>


        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Drag & Drop Editor
            </h3>
            <p className="text-foreground">
              Intuitive editing with freely movable blocks
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Grid Design
            </h3>
            <p className="text-foreground">
              Free movement of blocks in the grid
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Fast & Modern
            </h3>
            <p className="text-foreground">
              Based on Next.js and modern web technologies
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 bg-gray-900 text-white py-8 mt-16 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 NIC CMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
