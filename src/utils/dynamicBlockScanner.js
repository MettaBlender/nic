/**
 * Dynamic Block Scanner
 * Automatische Erkennung und Registrierung von Block-Komponenten
 */

'use client';

// Cache für gescannte Komponenten
const componentScanCache = new Map();
const scanPromiseCache = new Map();

/**
 * Scannt alle verfügbaren Block-Komponenten automatisch
 */
export const scanAvailableBlocks = async () => {
  const cacheKey = 'all-blocks';

  if (componentScanCache.has(cacheKey)) {
    console.log('📋 Using cached block scan results');
    return componentScanCache.get(cacheKey);
  }

  if (scanPromiseCache.has(cacheKey)) {
    console.log('⏳ Block scan already in progress, waiting...');
    return await scanPromiseCache.get(cacheKey);
  }

  const scanPromise = performBlockScan();
  scanPromiseCache.set(cacheKey, scanPromise);

  try {
    const result = await scanPromise;
    componentScanCache.set(cacheKey, result);
    return result;
  } finally {
    scanPromiseCache.delete(cacheKey);
  }
};

/**
 * Führt den eigentlichen Block-Scan durch
 */
async function performBlockScan() {
  console.log('🔍 Scanning for available block components...');

  const blockComponents = new Map();

  // Scanne zuerst Aaron-Komponenten automatisch
  try {
    const aaronComponents = await scanAaronComponents();
    aaronComponents.forEach(({ name, component }) => {
      blockComponents.set(name, component);
      console.log(`📦 Auto-registered Aaron component: ${name}`);
    });
  } catch (error) {
    console.warn('⚠️ Could not scan Aaron components:', error);
  }

  // Erweiterte Scan-Pfade - jetzt den gesamten blocks/ Ordner
  const scanPaths = [
    '',              // Root blocks/ Ordner
    'media',         // blocks/media/
    'layout',        // blocks/layout/
    'forms',         // blocks/forms/
    'header',        // blocks/header/
    'footer',        // blocks/footer/
    'Aaron',         // blocks/Aaron/
    'custom',        // blocks/custom/
    'ui',            // blocks/ui/
    'content',       // blocks/content/
    'navigation',    // blocks/navigation/
    'social',        // blocks/social/
    'ecommerce',     // blocks/ecommerce/
    'analytics'      // blocks/analytics/
  ];

  for (const path of scanPaths) {
    try {
      const components = await scanDirectory(path);
      components.forEach((component, name) => {
        // Verhindere Überschreibung bereits gefundener Komponenten
        // Priorität: Root > Subordner > Aaron (für Rückwärtskompatibilität)
        if (!blockComponents.has(name) || path === '') {
          blockComponents.set(name, component);
        }
      });
    } catch (error) {
      console.warn(`⚠️ Could not scan directory blocks/${path}:`, error);
    }
  }

  console.log(`✅ Found ${blockComponents.size} block components across all directories`);
  return blockComponents;
}

/**
 * Scannt ein spezifisches Verzeichnis nach Komponenten
 */
async function scanDirectory(subPath) {
  const components = new Map();

  // Dynamische Erkennung - scanne nach allen möglichen .jsx Dateien
  const commonBlockPatterns = [
    // Standard Block-Komponenten
    'Text.jsx', 'TextBlock.jsx',
    'Button.jsx', 'ButtonBlock.jsx',
    'Image.jsx', 'ImageBlock.jsx',
    'Container.jsx', 'ContainerBlock.jsx',
    'Video.jsx', 'VideoBlock.jsx',

    // Media Blocks
    'Gallery.jsx', 'GalleryBlock.jsx',
    'Audio.jsx', 'AudioBlock.jsx',
    'Slider.jsx', 'SliderBlock.jsx',
    'Carousel.jsx', 'CarouselBlock.jsx',

    // Layout Blocks
    'Columns.jsx', 'ColumnsBlock.jsx',
    'Grid.jsx', 'GridBlock.jsx',
    'Row.jsx', 'RowBlock.jsx',
    'Section.jsx', 'SectionBlock.jsx',
    'Divider.jsx', 'DividerBlock.jsx',

    // Form Blocks
    'Form.jsx', 'FormBlock.jsx',
    'ContactForm.jsx', 'ContactFormBlock.jsx',
    'Newsletter.jsx', 'NewsletterBlock.jsx',
    'Subscribe.jsx', 'SubscribeBlock.jsx',

    // Header/Footer Blocks
    'Header.jsx', 'HeaderBlock.jsx',
    'Footer.jsx', 'FooterBlock.jsx',
    'DefaultHeader.jsx', 'NavigationHeader.jsx',
    'DefaultFooter.jsx', 'SocialFooter.jsx',

    // Content Blocks
    'Heading.jsx', 'HeadingBlock.jsx',
    'Paragraph.jsx', 'ParagraphBlock.jsx',
    'Quote.jsx', 'QuoteBlock.jsx',
    'List.jsx', 'ListBlock.jsx',
    'Code.jsx', 'CodeBlock.jsx',

    // Custom/User Blocks
    'Aaron.jsx', 'Test.jsx', 'CustomBlock.jsx',
    'Hero.jsx', 'HeroBlock.jsx',
    'Feature.jsx', 'FeatureBlock.jsx',
    'Testimonial.jsx', 'TestimonialBlock.jsx',
    'CTA.jsx', 'CTABlock.jsx',
    'Card.jsx', 'CardBlock.jsx',

    // Navigation Blocks
    'Menu.jsx', 'MenuBlock.jsx',
    'Breadcrumb.jsx', 'BreadcrumbBlock.jsx',
    'Pagination.jsx', 'PaginationBlock.jsx',

    // Social Blocks
    'Social.jsx', 'SocialBlock.jsx',
    'Share.jsx', 'ShareBlock.jsx',
    'Feed.jsx', 'FeedBlock.jsx',

    // E-commerce Blocks
    'Product.jsx', 'ProductBlock.jsx',
    'Cart.jsx', 'CartBlock.jsx',
    'Checkout.jsx', 'CheckoutBlock.jsx',

    // Analytics Blocks
    'Analytics.jsx', 'AnalyticsBlock.jsx',
    'Stats.jsx', 'StatsBlock.jsx'
  ];

  // Versuche alle bekannten Patterns zu laden
  for (const fileName of commonBlockPatterns) {
    try {
      const componentName = fileName.replace('.jsx', '');
      const component = await loadComponentFromPath(subPath, fileName);

      if (component) {
        components.set(componentName, component);

        // Erstelle auch Alias-Namen
        const aliases = generateComponentAliases(componentName);
        aliases.forEach(alias => {
          if (!components.has(alias)) {
            components.set(alias, component);
          }
        });

        console.log(`📦 Found component: ${fileName} in blocks/${subPath}`);
      }
    } catch (error) {
      // Silent fail für nicht existierende Komponenten
    }
  }

  // Zusätzlich: Versuche dynamisch weitere .jsx Dateien zu finden
  // (Für unbekannte/neue Komponenten)
  const dynamicPatterns = [
    'Block.jsx', 'Component.jsx', '.jsx'
  ];

  for (const pattern of dynamicPatterns) {
    for (let i = 1; i <= 20; i++) {
      try {
        const fileName = pattern === '.jsx' ?
          `Custom${i}.jsx` :
          `Unknown${i}${pattern}`;
        const componentName = fileName.replace('.jsx', '');
        const component = await loadComponentFromPath(subPath, fileName);

        if (component) {
          components.set(componentName, component);
          console.log(`🆕 Discovered new component: ${fileName} in blocks/${subPath}`);
        }
      } catch (error) {
        // Silent fail
      }
    }
  }

  return components;
}

/**
 * Scannt Aaron-Verzeichnis für neue Komponenten
 */
async function scanAaronComponents() {
  const aaronComponents = [];

  // Liste bekannter Aaron-Komponenten-Dateien
  const knownAaronFiles = [
    'Aaron.jsx',
    'CustomBlock.jsx',
    'TestAaron.jsx'
  ];

  for (const file of knownAaronFiles) {
    const componentName = file.replace('.jsx', '');
    try {
      const module = await import(`@/components/nic/blocks/Aaron/${componentName}`);
      const component = module.default || module;

      if (component && typeof component === 'function') {
        aaronComponents.push({
          name: componentName,
          component: component,
          file: file
        });
        console.log(`🔍 Found Aaron component: ${componentName}`);
      }
    } catch (error) {
      // Silent fail für nicht existierende Dateien
    }
  }

  return aaronComponents;
}

/**
 * Lädt eine Komponente aus einem spezifischen Pfad
 */
async function loadComponentFromPath(subPath, fileName) {
  // Komponenten-Name ohne .jsx Extension
  const componentName = fileName.replace('.jsx', '');

  // Statische Import-Map für alle bekannten Komponenten
  const componentImports = {
    // Root blocks
    'Text': () => import('@/components/nic/blocks/Text'),
    'Button': () => import('@/components/nic/blocks/ButtonBlock'),
    'ButtonBlock': () => import('@/components/nic/blocks/ButtonBlock'),
    'Image': () => import('@/components/nic/blocks/ImageBlock'),
    'ImageBlock': () => import('@/components/nic/blocks/ImageBlock'),
    'Container': () => import('@/components/nic/blocks/ContainerBlock'),
    'ContainerBlock': () => import('@/components/nic/blocks/ContainerBlock'),
    'Video': () => import('@/components/nic/blocks/VideoBlock'),
    'VideoBlock': () => import('@/components/nic/blocks/VideoBlock'),

    // Media blocks
    'Gallery': () => import('@/components/nic/blocks/media/GalleryBlock'),
    'GalleryBlock': () => import('@/components/nic/blocks/media/GalleryBlock'),
    'Audio': () => import('@/components/nic/blocks/media/AudioBlock'),
    'AudioBlock': () => import('@/components/nic/blocks/media/AudioBlock'),

    // Layout blocks
    'Columns': () => import('@/components/nic/blocks/layout/ColumnsBlock'),
    'ColumnsBlock': () => import('@/components/nic/blocks/layout/ColumnsBlock'),
    'Grid': () => import('@/components/nic/blocks/layout/GridBlock'),
    'GridBlock': () => import('@/components/nic/blocks/layout/GridBlock'),

    // Form blocks
    'ContactForm': () => import('@/components/nic/blocks/forms/ContactFormBlock'),
    'ContactFormBlock': () => import('@/components/nic/blocks/forms/ContactFormBlock'),
    'Newsletter': () => import('@/components/nic/blocks/forms/NewsletterBlock'),
    'NewsletterBlock': () => import('@/components/nic/blocks/forms/NewsletterBlock'),

    // Header blocks
    'DefaultHeader': () => import('@/components/nic/blocks/header/DefaultHeader'),
    'NavigationHeader': () => import('@/components/nic/blocks/header/NavigationHeader'),
    'Header': () => import('@/components/nic/blocks/header/DefaultHeader'),

    // Footer blocks
    'DefaultFooter': () => import('@/components/nic/blocks/footer/DefaultFooter'),
    'SocialFooter': () => import('@/components/nic/blocks/footer/SocialFooter'),
    'Footer': () => import('@/components/nic/blocks/footer/DefaultFooter'),

    // Aaron's custom blocks
    'Aaron': () => import('@/components/nic/blocks/Aaron/Aaron'),
    'CustomBlock': () => import('@/components/nic/blocks/Aaron/CustomBlock'),
    'TestAaron': () => import('@/components/nic/blocks/Aaron/TestAaron'),
    'Test': () => import('@/components/nic/blocks/test-components')
  };

  // Versuche die Komponente zu laden
  if (componentImports[componentName]) {
    try {
      const module = await componentImports[componentName]();
      const component = module.default || module;

      if (component && typeof component === 'function') {
        console.log(`📦 Loaded component: ${componentName}`);
        return component;
      }
    } catch (error) {
      console.warn(`⚠️ Component ${componentName} failed to load:`, error.message);
    }
  }

  // Fallback: Versuche automatisch Aaron-Komponenten zu laden
  if (!componentImports[componentName]) {
    // Dynamische Liste aller bekannten Aaron-Komponenten
    const aaronComponents = [
      'Aaron', 'CustomBlock', 'TestAaron'
    ];

    // Prüfe, ob es eine Aaron-Komponente sein könnte
    for (const aaronComponent of aaronComponents) {
      if (componentName === aaronComponent ||
          componentName.toLowerCase() === aaronComponent.toLowerCase() ||
          componentName.includes('Aaron') ||
          aaronComponent.toLowerCase().includes(componentName.toLowerCase())) {
        try {
          const module = await import(`@/components/nic/blocks/Aaron/${aaronComponent}`);
          const component = module.default || module;

          if (component && typeof component === 'function') {
            console.log(`📦 Loaded Aaron component dynamically: ${aaronComponent} for ${componentName}`);
            return component;
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load Aaron component ${aaronComponent}:`, error.message);
        }
      }
    }

    // Letzter Versuch: Direkte Suche nach componentName in Aaron-Ordner
    try {
      const module = await import(`@/components/nic/blocks/Aaron/${componentName}`);
      const component = module.default || module;

      if (component && typeof component === 'function') {
        console.log(`📦 Loaded Aaron component directly: ${componentName}`);
        return component;
      }
    } catch (error) {
      // Silent fail - das ist normal für nicht-existierende Komponenten
    }
  }

  // Fallback für nicht-registrierte Komponenten
  console.warn(`⚠️ Component not registered: ${componentName} in ${subPath || 'root'}`);
  return null;
}

/**
 * Generiert Alias-Namen für eine Komponente
 */
function generateComponentAliases(componentName) {
  const aliases = new Set();

  // Basis-Variationen
  aliases.add(componentName);
  aliases.add(componentName.toLowerCase());
  aliases.add(componentName.charAt(0).toUpperCase() + componentName.slice(1));
  aliases.add(componentName.charAt(0).toLowerCase() + componentName.slice(1));

  // Block-Variationen
  if (componentName.endsWith('Block')) {
    const baseName = componentName.replace('Block', '');
    aliases.add(baseName);
    aliases.add(baseName.toLowerCase());
    aliases.add(baseName.charAt(0).toUpperCase() + baseName.slice(1));
  } else {
    aliases.add(componentName + 'Block');
    aliases.add(componentName.toLowerCase() + 'block');
  }

  // Erweiterte Alias-Mappings für häufige Komponenten
  const specialMappings = {
    // Text-Komponenten
    'Text': ['Heading', 'Paragraph', 'Title', 'Content', 'TextBlock'],
    'TextBlock': ['Text', 'Heading', 'Paragraph'],
    'Heading': ['Text', 'Title', 'H1', 'H2', 'H3'],
    'Paragraph': ['Text', 'P', 'Content'],

    // Button-Komponenten
    'ButtonBlock': ['Button', 'Btn', 'Link', 'CTA'],
    'Button': ['ButtonBlock', 'Btn', 'Link'],
    'CTA': ['Button', 'CallToAction', 'CTABlock'],

    // Media-Komponenten
    'ImageBlock': ['Image', 'Img', 'Picture', 'Photo'],
    'Image': ['ImageBlock', 'Img', 'Picture'],
    'VideoBlock': ['Video', 'Media', 'Player'],
    'Video': ['VideoBlock', 'Media'],
    'AudioBlock': ['Audio', 'Sound', 'Music'],
    'Audio': ['AudioBlock', 'Sound'],

    // Layout-Komponenten
    'ContainerBlock': ['Container', 'Wrapper', 'Box'],
    'Container': ['ContainerBlock', 'Wrapper'],
    'ColumnsBlock': ['Columns', 'Col', 'Grid'],
    'Columns': ['ColumnsBlock', 'Col'],
    'GridBlock': ['Grid', 'Layout', 'Container'],
    'Grid': ['GridBlock', 'Layout'],
    'RowBlock': ['Row', 'Flex', 'Horizontal'],
    'Row': ['RowBlock', 'Flex'],
    'SectionBlock': ['Section', 'Area', 'Zone'],
    'Section': ['SectionBlock', 'Area'],

    // Gallery-Komponenten
    'GalleryBlock': ['Gallery', 'Images', 'Photos'],
    'Gallery': ['GalleryBlock', 'Images'],
    'SliderBlock': ['Slider', 'Carousel', 'Slideshow'],
    'Slider': ['SliderBlock', 'Carousel'],
    'CarouselBlock': ['Carousel', 'Slider', 'Slideshow'],
    'Carousel': ['CarouselBlock', 'Slider'],

    // Form-Komponenten
    'ContactFormBlock': ['ContactForm', 'Form', 'Contact'],
    'ContactForm': ['ContactFormBlock', 'Form'],
    'NewsletterBlock': ['Newsletter', 'Subscribe', 'Signup'],
    'Newsletter': ['NewsletterBlock', 'Subscribe'],
    'FormBlock': ['Form', 'Input', 'Fields'],
    'Form': ['FormBlock', 'Input'],

    // Header/Footer-Komponenten
    'DefaultHeader': ['Header', 'Top', 'Navigation', 'Nav'],
    'NavigationHeader': ['Header', 'Nav', 'Menu'],
    'DefaultFooter': ['Footer', 'Bottom'],
    'SocialFooter': ['Footer', 'Social'],
    'HeaderBlock': ['Header', 'Top'],
    'Header': ['HeaderBlock', 'Top'],
    'FooterBlock': ['Footer', 'Bottom'],
    'Footer': ['FooterBlock', 'Bottom'],

    // Content-Komponenten
    'HeadingBlock': ['Heading', 'Title', 'H1', 'H2'],
    'QuoteBlock': ['Quote', 'Blockquote', 'Citation'],
    'Quote': ['QuoteBlock', 'Blockquote'],
    'ListBlock': ['List', 'Items', 'UL', 'OL'],
    'List': ['ListBlock', 'Items'],
    'CodeBlock': ['Code', 'Pre', 'Syntax'],
    'Code': ['CodeBlock', 'Pre'],

    // Custom-Komponenten
    'HeroBlock': ['Hero', 'Banner', 'Jumbotron'],
    'Hero': ['HeroBlock', 'Banner'],
    'FeatureBlock': ['Feature', 'Highlight'],
    'Feature': ['FeatureBlock', 'Highlight'],
    'TestimonialBlock': ['Testimonial', 'Review', 'Quote'],
    'Testimonial': ['TestimonialBlock', 'Review'],
    'CardBlock': ['Card', 'Box', 'Item'],
    'Card': ['CardBlock', 'Box'],

    // Aaron's custom components
    'Aaron': ['AaronBlock', 'AaronComponent'],
    'CustomBlock': ['Custom', 'CustomComponent'],
    'TestAaron': ['TestA', 'AaronTest', 'TestBlock'],

    // Navigation-Komponenten
    'MenuBlock': ['Menu', 'Navigation', 'Nav'],
    'Menu': ['MenuBlock', 'Navigation'],
    'BreadcrumbBlock': ['Breadcrumb', 'Path', 'Trail'],
    'Breadcrumb': ['BreadcrumbBlock', 'Path'],

    // Social-Komponenten
    'SocialBlock': ['Social', 'Share', 'Links'],
    'Social': ['SocialBlock', 'Share'],
    'ShareBlock': ['Share', 'Social', 'Links'],
    'Share': ['ShareBlock', 'Social'],

    // E-commerce-Komponenten
    'ProductBlock': ['Product', 'Item', 'Shop'],
    'Product': ['ProductBlock', 'Item'],
    'CartBlock': ['Cart', 'Basket', 'Shopping'],
    'Cart': ['CartBlock', 'Basket'],

    // Analytics-Komponenten
    'AnalyticsBlock': ['Analytics', 'Stats', 'Metrics'],
    'Analytics': ['AnalyticsBlock', 'Stats'],
    'StatsBlock': ['Stats', 'Analytics', 'Numbers'],
    'Stats': ['StatsBlock', 'Analytics']
  };

  if (specialMappings[componentName]) {
    specialMappings[componentName].forEach(alias => {
      aliases.add(alias);
      aliases.add(alias.toLowerCase());
    });
  }

  return Array.from(aliases);
}

/**
 * Fügt eine neue Komponente zur Registry hinzu
 */
export const registerComponent = (name, component) => {
  const allBlocks = componentScanCache.get('all-blocks') || new Map();
  allBlocks.set(name, component);
  componentScanCache.set('all-blocks', allBlocks);

  console.log(`📝 Registered new component: ${name}`);
};

/**
 * Leert den Component-Cache (für Entwicklung)
 */
export const clearComponentCache = () => {
  componentScanCache.clear();
  scanPromiseCache.clear();
  console.log('🧹 Component cache cleared');
};

/**
 * Prüft ob eine Komponente verfügbar ist
 */
export const isComponentAvailable = async (componentName) => {
  const blocks = await scanAvailableBlocks();
  return blocks.has(componentName);
};

/**
 * Holt eine spezifische Komponente
 */
export const getComponent = async (componentName) => {
  const blocks = await scanAvailableBlocks();
  return blocks.get(componentName);
};
