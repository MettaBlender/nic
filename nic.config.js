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

export default nicConfig;
