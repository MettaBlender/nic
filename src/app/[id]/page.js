import { getPageBySlug, getBlocks, getLayoutSettings } from '@/lib/database';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';

// Dynamische Block-Komponenten
const blockComponents = {
  Text: dynamic(() => import('@/components/nic/blocks/Text'), { ssr: true }),
  ImageBlock: dynamic(() => import('@/components/nic/blocks/ImageBlock'), { ssr: true }),
  ButtonBlock: dynamic(() => import('@/components/nic/blocks/ButtonBlock'), { ssr: true }),
  VideoBlock: dynamic(() => import('@/components/nic/blocks/VideoBlock'), { ssr: true }),
  ContainerBlock: dynamic(() => import('@/components/nic/blocks/ContainerBlock'), { ssr: true })
};

// Header Komponenten
const headerComponents = {
  default: dynamic(() => import('@/components/nic/blocks/header/DefaultHeader'), { ssr: true }),
  navigation: dynamic(() => import('@/components/nic/blocks/header/NavigationHeader'), { ssr: true })
};

// Footer Komponenten
const footerComponents = {
  default: dynamic(() => import('@/components/nic/blocks/footer/DefaultFooter'), { ssr: true }),
  social: dynamic(() => import('@/components/nic/blocks/footer/SocialFooter'), { ssr: true })
};

export default async function PublicPage({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

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
                  <div key={block.id} className="text-red-500">
                    Unbekannter Block-Typ: {block.block_type}
                  </div>
                );
              }

              return (
                <div
                  key={block.id}
                  className="absolute"
                  style={{
                    left: `${block.position_x}%`,
                    top: `${block.position_y}%`,
                    width: `${block.width}%`,
                    height: `${block.height}%`,
                    transform: `rotate(${block.rotation || 0}deg) scale(${block.scale_x || 1}, ${block.scale_y || 1})`,
                    backgroundColor: block.background_color || 'transparent',
                    color: block.text_color || '#000000',
                    zIndex: block.z_index || 1
                  }}
                >
                  <Component content={block.content} />
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