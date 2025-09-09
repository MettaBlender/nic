# NIC CMS - Next.js Intuitive Content Management System

A modern, drag-and-drop based Content Management System built with Next.js, React and SQLite.

## 🚀 Features

### CMS Editor (`/nic`)
- **Drag & Drop Editor**: Freely movable blocks similar to the japresentation project
- **Block Library**: Predefined components (Text, Image, Button, Video, Container)
- **Page Management**: Create, edit and delete pages
- **Layout Settings**: Customizable header, footer, colors and backgrounds
- **Responsive Design**: Automatically adapted for all screen sizes

### Block Types
- **Text Block**: Editable text with double-click editing
- **Image Block**: Image upload and display
- **Button Block**: Clickable buttons
- **Video Block**: Video embedding
- **Container Block**: Grouping of other blocks

### Layout System
- **Header Components**:
  - DefaultHeader: Simple header
  - NavigationHeader: Header with navigation
- **Footer Components**:
  - DefaultFooter: Standard footer
  - SocialFooter: Footer with social media links

### Database
- **SQLite**: Local database for pages, blocks and settings
- **Automatic Migration**: Database structure is created automatically

## 📁 Project Structure

```
src/
├── app/
│   ├── page.js                     # Homepage
│   ├── [id]/page.js                # Dynamic public pages
│   ├── nic/page.js                 # CMS Editor
│   └── api/cms/                    # API Routes
│       ├── pages/                  # Pages API
│       ├── blocks/                 # Blocks API
│       └── layout/                 # Layout API
├── components/nic/
│   ├── cms/                        # CMS Components
│   │   ├── CMSEditor.jsx           # Main Editor
│   │   ├── MovableBlock.jsx        # Movable Blocks
│   │   ├── PageManager.jsx         # Page Management
│   │   ├── LayoutSettings.jsx      # Layout Settings
│   │   ├── Components.jsx          # Block Library
│   │   └── sidebar.jsx             # Sidebar with Tabs
│   └── blocks/                     # Block Components
│       ├── Text.jsx
│       ├── ImageBlock.jsx
│       ├── ButtonBlock.jsx
│       ├── VideoBlock.jsx
│       ├── ContainerBlock.jsx
│       ├── header/
│       │   ├── DefaultHeader.jsx
│       │   └── NavigationHeader.jsx
│       └── footer/
│           ├── DefaultFooter.jsx
│           └── SocialFooter.jsx
├── context/
│   └── CMSContext.js               # React Context for State Management
└── lib/
    └── database.js                 # SQLite Database Functions
```

## 🛠️ Installation and Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open CMS Editor:**
   Navigate to `http://localhost:3000/nic`

## 📖 Usage

### 1. Create Pages
1. Open the CMS Editor at `/nic`
2. Click on the "Pages" tab in the sidebar
3. Click on "New Page"
4. Enter title and URL slug
5. Click on "Create"

### 2. Add Blocks
1. Select a page
2. Click on the "Blocks" tab
3. Choose a block type from the library
4. Click the "+" symbol to add the block

### 3. Edit Blocks
- **Positioning**: Drag blocks with the mouse
- **Resize**: Use the resize handles
- **Rotate**: Use the rotation controls
- **Edit content**: Double-click on text blocks
- **Change color**: Click on the palette symbol

### 4. Customize Layout
1. Click on the "Layout" tab
2. Select header and footer components
3. Adjust colors and background
4. Changes are automatically saved

### 5. Publish Page
- Public pages are automatically available at `/{slug}`
- The homepage shows all available pages

## 🎨 Editor Modes

### Edit Mode
- Blocks are movable and editable
- Grid overlay for precise positioning
- All editing tools available

### Preview Mode
- Shows the page as it appears publicly
- No editing functions

### Delete Mode
- Click on blocks to delete them
- Red overlay marking

## 🔧 Technical Details

### Dependencies
- **Next.js 15.4.6**: React Framework
- **React 19.1.0**: UI Library
- **react-colorful**: Color picker
- **sqlite3**: Database
- **lucide-react**: Icons
- **Tailwind CSS**: Styling

### Database Schema

#### Pages Table
- `id`: Unique ID
- `title`: Page title
- `slug`: URL slug
- `created_at`, `updated_at`: Timestamps

#### Blocks Table
- `id`: Unique ID
- `page_id`: Reference to page
- `block_type`: Block type
- `content`: Block content
- `position_x`, `position_y`: Position in percent
- `width`, `height`: Size in percent
- `rotation`: Rotation in degrees
- `scale_x`, `scale_y`: Scaling
- `background_color`, `text_color`: Colors
- `z_index`: Layer order

#### Layout Settings Table
- Header/Footer components
- Colors and background settings

## 🚀 Deployment

The project can be deployed on any Next.js-compatible platform:

1. **Vercel** (recommended)
2. **Netlify**
3. **Self-hosted**

Note: SQLite database works best with self-hosted solutions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Create a pull request

## 📄 License

This project is under the MIT License.

## 🆘 Support

For questions or issues, please create an issue in the repository.
