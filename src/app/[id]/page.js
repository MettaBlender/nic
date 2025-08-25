import { getPageBySlug, getBlocks, getLayoutSettings } from '@/lib/database';
import {
  createDynamicComponents,
  createDynamicHeaderComponents,
  createDynamicFooterComponents
} from '@/lib/componentLoaderServer';
import { notFound } from 'next/navigation';

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
          <div className="w-full h-full relative" style={{ minHeight: '600px' }}>
            {/* Render Blocks */}
            {blocks.map((block) => {
              const Component = blockComponents[block.block_type];
              if (!Component) {
                return (
                  <div
                    key={block.id}
                    className="absolute text-red-500 p-2 border border-red-300 rounded bg-red-50"
                    style={{
                      left: `${block.position_x}%`,
                      top: `${block.position_y}%`,
                      width: `${block.width}%`,
                      height: `${block.height}%`,
                      zIndex: block.z_index || 1
                    }}
                  >
                    <div className="font-bold">Unbekannter Block-Typ: {block.block_type}</div>
                    <div className="text-sm mt-1">Verfügbare Typen: {Object.keys(blockComponents).join(', ')}</div>
                  </div>
                );
              }

              return (
                <div
                  key={block.id}
                  className="absolute rounded-md overflow-hidden"
                  style={{
                    left: '0',
                    top: '0',
                    width: `${block.width}%`,
                    height: `${block.height}%`,
                    transform: `translate(${block.position_x}%, ${block.position_y}%) rotate(${block.rotation || 0}deg) scale(${block.scale_x || 1}, ${block.scale_y || 1})`,
                    backgroundColor: block.background_color || 'transparent',
                    color: block.text_color || '#000000',
                    zIndex: block.z_index || 1,
                    transformOrigin: 'center center'
                  }}
                >
                  <div className="w-full h-full relative">
                    <Component content={block.content} />
                  </div>
                </div>
              );
            })}

            {/* Empty State für Seiten ohne Blöcke */}
            {blocks.length === 0 && (
              <div className="flex items-center justify-center h-full">
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