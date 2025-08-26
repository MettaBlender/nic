/**
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
    minRows: 10,

    // Maximale Anzahl der Reihen (0 = unbegrenzt)
    maxRows: 0,

    // Gap zwischen Grid-Elementen in px
    gap: 8,

    // Mindest-Höhe einer Grid-Reihe in px
    rowHeight: 60,

    // Responsive Breakpoints
    breakpoints: {
      mobile: {
        maxWidth: 768,
        columns: 6, // Weniger Spalten auf Mobile
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

  // Block Standard-Größen
  defaultBlockSizes: {
    Text: { width: 6, height: 2 },
    ButtonBlock: { width: 3, height: 1 },
    ImageBlock: { width: 4, height: 3 },
    VideoBlock: { width: 6, height: 4 },
    ContainerBlock: { width: 12, height: 6 },

    // Header und Footer Komponenten
    DefaultHeader: { width: 12, height: 2 },
    NavigationHeader: { width: 12, height: 2 },
    DefaultFooter: { width: 12, height: 2 },
    SocialFooter: { width: 12, height: 2 },

    // Form Komponenten
    ContactFormBlock: { width: 6, height: 8 },
    NewsletterBlock: { width: 4, height: 3 },

    // Layout Komponenten
    ColumnsBlock: { width: 12, height: 6 },
    GridBlock: { width: 12, height: 8 },

    // Media Komponenten
    AudioBlock: { width: 6, height: 2 },
    GalleryBlock: { width: 8, height: 6 }
  },

  // Sidebar Konfiguration
  sidebar: {
    width: 300,
    showCategories: true,
    showPreview: true,
    collapsible: true
  },

  // Drag & Drop Konfiguration
  dragDrop: {
    enabled: true,
    snapToGrid: true,
    showDropZones: true,
    animationDuration: 200,
    ghostOpacity: 0.5
  },

  // Visual Feedback
  visual: {
    showGridLines: true,
    showBlockOutlines: true,
    highlightDropZones: true,
    gridLineColor: 'rgba(99, 102, 241, 0.2)',
    dropZoneColor: 'rgba(34, 197, 94, 0.3)',
    selectedBlockColor: 'rgba(59, 130, 246, 0.5)'
  }
};

// Export für Node.js und Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = nicConfig;
} else if (typeof window !== 'undefined') {
  window.nicConfig = nicConfig;
}

export default nicConfig;
