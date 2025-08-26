import { neon } from '@neondatabase/serverless';
import {
  createDynamicComponents,
  createDynamicHeaderComponents,
  createDynamicFooterComponents
} from '@/lib/componentLoaderServer';
import { notFound } from 'next/navigation';

// Database connection
const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error('NEON_DATABASE_URL environment variable is not set');
}

// Page by slug
async function getPageBySlug(slug) {
  try {
    const sql = neon(connectionString);
    const result = await sql`
      SELECT * FROM pages WHERE slug = ${slug} LIMIT 1
    `;
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

// Blocks by page ID
async function getBlocks(pageId) {
  try {
    const sql = neon(connectionString);
    const result = await sql`
      SELECT * FROM blocks
      WHERE page_id = ${pageId}
      ORDER BY grid_row ASC, grid_col ASC
    `;

    // Normalisiere Block-Daten für Live-View
    return result.map(block => ({
      ...block,
      content: typeof block.content === 'string' && block.content.startsWith('{')
        ? JSON.parse(block.content)
        : block.content,
      grid_col: block.grid_col || 0,
      grid_row: block.grid_row || 0,
      grid_width: block.grid_width || 2,
      grid_height: block.grid_height || 1
    }));
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return [];
  }
}

// Layout settings (mock)
async function getLayoutSettings() {
  return {
    background_color: '#ffffff',
    background_image: null,
    header_height: 64,
    footer_height: 64
  };
}

// Dynamische Block-Komponenten - werden automatisch erkannt
const blockComponents = createDynamicComponents();

// Header Komponenten - werden automatisch erkannt
const headerComponents = createDynamicHeaderComponents();

// Footer Komponenten - werden automatisch erkannt
const footerComponents = createDynamicFooterComponents();

export default async function PublicPage({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Debug: Zeige geladene Komponenten in der Konsole
  if (process.env.NODE_ENV === 'development') {
    console.log('Geladene Block-Komponenten:', Object.keys(blockComponents));
    console.log('Geladene Header-Komponenten:', Object.keys(headerComponents));
    console.log('Geladene Footer-Komponenten:', Object.keys(footerComponents));
  }

  try {
    // Lade Seite und Daten
    const page = await getPageBySlug(id);
    if (!page) {
      notFound();
    }

    const [blocks, layoutSettings] = await Promise.all([
      getBlocks(page.id),
      getLayoutSettings()
    ]);

    // Header und Footer Komponenten
    const HeaderComponent = headerComponents[layoutSettings.header_component] || headerComponents.default;
    const FooterComponent = footerComponents[layoutSettings.footer_component] || footerComponents.default;

    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          backgroundColor: layoutSettings.background_color || '#ffffff',
          backgroundImage: layoutSettings.background_image
            ? `url(${layoutSettings.background_image})`
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Header */}
        <header className="h-20">
          <HeaderComponent content={`${page.title} - Header`} />
        </header>

        {/* Main Content */}
        <main className="flex-1 relative">
          <div
            className="w-full h-full relative grid grid-cols-12 gap-2 p-4"
            style={{
              minHeight: '600px',
              gridAutoRows: 'minmax(100px, auto)'
            }}
          >
            {/* Render Blocks im Grid System */}
            {blocks.map((block) => {
              const Component = blockComponents[block.block_type];
              if (!Component) {
                return (
                  <div
                    key={block.id}
                    className="text-red-500 p-2 border border-red-300 rounded bg-red-50 flex items-center justify-center"
                    style={{
                      gridColumn: `${(block.grid_col || 0) + 1} / span ${block.grid_width || 2}`,
                      gridRow: `${(block.grid_row || 0) + 1} / span ${block.grid_height || 1}`,
                      zIndex: block.z_index || 1
                    }}
                  >
                    <div className="text-center">
                      <div className="font-bold">Unbekannter Block-Typ: {block.block_type}</div>
                      <div className="text-sm mt-1">Verfügbare Typen: {Object.keys(blockComponents).join(', ')}</div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={block.id}
                  className="rounded-md overflow-hidden"
                  style={{
                    gridColumn: `${(block.grid_col || 0) + 1} / span ${block.grid_width || 2}`,
                    gridRow: `${(block.grid_row || 0) + 1} / span ${block.grid_height || 1}`,
                    backgroundColor: block.background_color || 'transparent',
                    color: block.text_color || '#000000',
                    zIndex: block.z_index || 1
                  }}
                >
                  <div className="w-full h-full relative">
                    <Component
                      content={
                        block.content &&
                        typeof block.content === 'object' &&
                        Object.keys(block.content).length > 0
                          ? block.content
                          : (typeof block.content === 'string' ? block.content : '')
                      }
                      block_type={block.block_type}
                      editable={false}
                    />
                  </div>
                </div>
              );
            })}

            {/* Empty State für Seiten ohne Blöcke */}
            {blocks.length === 0 && (
              <div className="col-span-12 flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
                  <p>Diese Seite ist noch in Bearbeitung.</p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="h-20 mt-auto">
          <FooterComponent content={`${page.title} - Footer`} />
        </footer>
      </div>
    );
  } catch (error) {
    console.error('Fehler beim Laden der Seite:', error);
    notFound();
  }
}

// Generiere Metadaten für SEO
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
    const page = await getPageBySlug(id);
    if (!page) {
      return {
        title: 'Seite nicht gefunden',
        description: 'Die angeforderte Seite konnte nicht gefunden werden.'
      };
    }

    return {
      title: page.title,
      description: `${page.title} - Erstellt mit NIC CMS`,
      openGraph: {
        title: page.title,
        description: `${page.title} - Erstellt mit NIC CMS`,
        type: 'website'
      }
    };
  } catch (error) {
    return {
      title: 'Fehler',
      description: 'Ein Fehler ist aufgetreten.'
    };
  }
}