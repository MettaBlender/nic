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

  // Default block sizes for responsive design
  // Desktop: 12 cols, Tablet: 8 cols, Mobile: 4 cols
  // Supports @device syntax: width@mobile, height@tablet, etc.
  defaultBlockSizes: {
    'Text': {
      width: 6, height: 2,
      responsive: {
        mobile: { width: 4, height: 2 },
        tablet: { width: 6, height: 2 },
        desktop: { width: 6, height: 2 }
      }
    },
    'Image': {
      width: 4, height: 3,
      responsive: {
        mobile: { width: 4, height: 3 },
        tablet: { width: 4, height: 3 },
        desktop: { width: 4, height: 3 }
      }
    },
    'Video': {
      width: 8, height: 4,
      responsive: {
        mobile: { width: 4, height: 4 },
        tablet: { width: 8, height: 4 },
        desktop: { width: 8, height: 4 }
      }
    },
    'Button': {
      width: 3, height: 1,
      responsive: {
        mobile: { width: 4, height: 1 },
        tablet: { width: 4, height: 1 },
        desktop: { width: 3, height: 1 }
      }
    },
    'Container': {
      width: 12, height: 3,
      responsive: {
        mobile: { width: 4, height: 3 },
        tablet: { width: 8, height: 3 },
        desktop: { width: 12, height: 3 }
      }
    },
    'Gallery': {
      width: 8, height: 4,
      responsive: {
        mobile: { width: 4, height: 4 },
        tablet: { width: 8, height: 4 },
        desktop: { width: 8, height: 4 }
      }
    },
    'ContactForm': {
      width: 6, height: 5,
      responsive: {
        mobile: { width: 4, height: 5 },
        tablet: { width: 6, height: 5 },
        desktop: { width: 6, height: 5 }
      }
    },
    'Newsletter': {
      width: 6, height: 3,
      responsive: {
        mobile: { width: 4, height: 3 },
        tablet: { width: 6, height: 3 },
        desktop: { width: 6, height: 3 }
      }
    },
    'TestBlock': {
      width: 4, height: 2,
      responsive: {
        mobile: { width: 4, height: 2 },
        tablet: { width: 4, height: 2 },
        desktop: { width: 4, height: 2 }
      }
    },
    'AudioBlock': {
      width: 6, height: 2,
      responsive: {
        mobile: { width: 4, height: 2 },
        tablet: { width: 6, height: 2 },
        desktop: { width: 6, height: 2 }
      }
    },
    'default': {
      width: 4, height: 2,
      responsive: {
        mobile: { width: 4, height: 2 },
        tablet: { width: 4, height: 2 },
        desktop: { width: 4, height: 2 }
      }
    }
  }

};

// Export for Node.js and Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = nicConfig;
} else if (typeof window !== 'undefined') {
  window.nicConfig = nicConfig;
}

export default nicConfig;
