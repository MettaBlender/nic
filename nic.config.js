/**
 * NIC CMS Configuration
 *
 * Grid System Configuration for the Layout System
 */

const nicConfig = {
  // Grid System
  grid: {
    // Number of columns in the grid (default: 12 like Bootstrap)
    columns: 12,

    // Minimum number of rows (automatically expandable)
    minRows: 12,

    // Maximum number of rows (0 = unlimited)
    maxRows: 0,

    // Gap between grid elements in px
    gap: 8,

    // Minimum height of a grid row in px
    rowHeight: '60px',

    // Responsive Breakpoints
    breakpoints: {
      mobile: {
        maxWidth: 768,
        columns: 4, // Fewer columns on mobile
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

  // Drag & Drop Configuration
  dragDrop: {
    enabled: true,
    snapToGrid: true,
    showDropZones: true,
    animationDuration: 200,
    ghostOpacity: 0.5
  },

};

// Export for Node.js and Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = nicConfig;
} else if (typeof window !== 'undefined') {
  window.nicConfig = nicConfig;
}

export default nicConfig;
