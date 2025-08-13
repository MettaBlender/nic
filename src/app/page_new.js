import Link from 'next/link';
import { getPages } from '@/lib/database';

export default async function HomePage() {
  let pages = [];

  try {
    pages = await getPages();
  } catch (error) {
    console.error('Fehler beim Laden der Seiten:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">NIC CMS</h1>
            </div>
            <nav className="flex space-x-4">
              <Link
                href="/nic"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                CMS Bearbeiten
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Willkommen zum NIC CMS
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Ein modernes Content Management System mit Drag & Drop Editor
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="/nic"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors text-lg font-medium"
            >
              CMS Editor öffnen
            </Link>
          </div>
        </div>

        {/* Published Pages */}
        {pages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              Veröffentlichte Seiten
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {page.title}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    /{page.slug}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {new Date(page.created_at).toLocaleDateString('de-DE')}
                    </span>
                    <Link
                      href={`/${page.slug}`}
                      className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Ansehen
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {pages.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Noch keine Seiten vorhanden
            </h3>
            <p className="text-gray-600 mb-6">
              Erstellen Sie Ihre erste Seite mit dem CMS Editor
            </p>
            <Link
              href="/nic"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Erste Seite erstellen
            </Link>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Drag & Drop Editor
            </h3>
            <p className="text-gray-600">
              Intuitive Bearbeitung mit frei bewegbaren Blöcken
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Responsive Design
            </h3>
            <p className="text-gray-600">
              Automatisch angepasst für alle Bildschirmgrößen
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Schnell & Modern
            </h3>
            <p className="text-gray-600">
              Basiert auf Next.js und modernen Web-Technologien
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 NIC CMS. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}
