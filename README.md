# NIC CMS - Next.js Intuitive Content Management System

A modern, drag-and-drop based Content Management System built with Next.js, React and SQLite.

## Features

### CMS Editor (`/nic`)
- **Drag & Drop Editor**: Freely movable blocks with grid-based positioning
- **Block Library**: Extensive collection of predefined components
- **Page Management**: Create, edit and delete pages with dynamic routing
- **Layout Settings**: Customizable header, footer, colors and backgrounds
- **Responsive Design**: Device-specific editing and preview modes
- **Real-time Preview**: Switch between edit and preview modes instantly
- **Documentation**: Built-in documentation at `/nic/docs`

### Block Types
#### Basic Blocks
- **Text Block**: Rich text editing with formatting options
- **Image Block**: Image upload with drag & drop support
- **Button Block**: Interactive buttons with customizable styling
- **Video Block**: Video embedding (YouTube, Vimeo, direct URLs)
- **Container Block**: Layout containers for grouping other blocks

#### Form Blocks
- **Contact Form Block**: Contact forms with validation
- **Newsletter Block**: Email subscription forms

#### Media Blocks
- **Audio Block**: Audio player integration
- **Gallery Block**: Image galleries with multiple layouts

#### Test Blocks
- **Test Block**: Development and testing components
- **Test Options Block**: Component configuration testing

### Layout System
- **Header Components**:
  - DefaultHeader: Clean, minimal header design
  - NavigationHeader: Header with navigation menu support
- **Footer Components**:
  - DefaultFooter: Standard footer with basic information
  - SocialFooter: Footer with social media integration

### Advanced Features
- **Grid System**: Intelligent block positioning with collision detection
- **Responsive Design**: Device-specific editing and preview modes
- **Real-time Updates**: Live preview without page refresh
- **Draft System**: Local storage for unsaved changes
- **Undo/Redo**: Full history management for editing actions
- **Component Discovery**: Automatic detection of available block types
- **Color Management**: Advanced color picker with contrast checking

### Database
- **Local Development**: SQLite database for quick setup
- **Production Ready**: Compatible with PostgreSQL via Neon
- **Automatic Migration**: Schema updates handled automatically
- **Data Persistence**: Reliable storage of pages, blocks, and settings

## Project Structure

```
nic/
+-- src/
|   +-- app/
|   |   +-- layout.js               # Root layout
|   |   +-- page.js                 # Homepage
|   |   +-- globals.css             # Global styles
|   |   +-- [...id]/                # Dynamic public pages
|   |   |   +-- page.js
|   |   +-- nic/                    # CMS Application
|   |   |   +-- page.js             # Main CMS Editor
|   |   |   +-- docs/               # Documentation
|   |   |   |   +-- page.js
|   |   |   +-- login/              # Authentication
|   |   |   |   +-- page.js
|   |   |   +-- responsive-demo/    # Responsive testing
|   |   +-- api/                    # API Routes
|   |       +-- auth/               # Authentication API
|   |       |   +-- login/
|   |       +-- cms/                # CMS API endpoints
|   |           +-- pages/          # Page management
|   |           +-- blocks/         # Block operations
|   |           +-- layout/         # Layout settings
|   |           +-- components/     # Component discovery
|   |           +-- migrate/        # Database migration
|   |           +-- update-block/   # Block updates
|   +-- components/nic/
|   |   +-- cms/                    # CMS Interface Components
|   |   |   +-- CMSEditor.jsx       # Main editor interface
|   |   |   +-- GridCanvas.jsx      # Drag & drop canvas
|   |   |   +-- DetailSideBar.jsx   # Block property editor
|   |   |   +-- Components.jsx      # Block library
|   |   |   +-- PageManager.jsx     # Page management
|   |   |   +-- LayoutSettings.jsx  # Layout configuration
|   |   |   +-- sidebar.jsx         # Main sidebar
|   |   |   +-- header/             # Header components
|   |   |   |   +-- DefaultHeader.jsx
|   |   |   |   +-- NavigationHeader.jsx
|   |   |   +-- footer/             # Footer components
|   |   |       +-- DefaultFooter.jsx
|   |   |       +-- SocialFooter.jsx
|   |   +-- blocks/                 # Content Blocks
|   |   |   +-- Text.jsx            # Text block
|   |   |   +-- ImageBlock.jsx      # Image block
|   |   |   +-- ButtonBlock.jsx     # Button block
|   |   |   +-- VideoBlock.jsx      # Video block
|   |   |   +-- ContainerBlock.jsx  # Container block
|   |   |   +-- fallback.jsx        # Error fallback
|   |   |   +-- forms/              # Form blocks
|   |   |   |   +-- ContactFormBlock.jsx
|   |   |   |   +-- NewsletterBlock.jsx
|   |   |   +-- media/              # Media blocks
|   |   |   |   +-- AudioBlock.jsx
|   |   |   |   +-- GalleryBlock.jsx
|   |   |   +-- test/               # Development blocks
|   |   |       +-- Test2.jsx
|   |   +-- responsive/             # Responsive utilities
|   +-- context/
|   |   +-- CMSContext.js           # Global state management
|   +-- hooks/
|   |   +-- useGridSystem.js        # Grid system utilities
|   +-- lib/
|   |   +-- database.js             # Database operations
|   |   +-- componentLoader.js      # Component loading (client)
|   |   +-- componentLoaderServer.js # Component loading (server)
|   +-- utils/
|   |   +-- cmsFunctions.js         # CMS utility functions
|   |   +-- colorFunctions.jsx      # Color manipulation
|   |   +-- localStorageManager.js  # Local storage utilities
|   +-- config/                     # Configuration files
|   +-- styles/                     # Additional styles
|   +-- middleware.js               # Next.js middleware
+-- data/                           # Data files
|   +-- nic-cms.json               # CMS configuration
+-- docs/                           # Documentation assets
+-- public/                         # Static assets
+-- database-init.sql               # Database schema
+-- database-migration.sql          # Database migrations
+-- nic.config.js                   # NIC configuration
+-- package.json                    # Dependencies
```

## Installation and Setup

### Prerequisites
- Node.js 18+
- npm or yarn package manager

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MettaBlender/nic.git
   cd nic
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy .env.example to .env.local (if exists)
   # Add any required environment variables
   ```

4. **Initialize database:**
   ```bash
   # Database will be automatically initialized on first run
   # Check database-init.sql for schema details
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

   The server will start with Turbopack for faster development builds.

6. **Access the application:**
   - **Homepage**: `http://localhost:3000`
   - **CMS Editor**: `http://localhost:3000/nic`
   - **Documentation**: `http://localhost:3000/nic/docs`

## Usage

### 1. Access CMS Editor
- Navigate to `http://localhost:3000/nic` for the main editor
- Visit `http://localhost:3000/nic/docs` for documentation
- Use `http://localhost:3000/nic/responsive-demo` for responsive testing

### 2. Create Pages
1. Open the CMS Editor at `/nic`
2. Click on the "Pages" tab in the sidebar
3. Click on "New Page" or the "+" button
4. Enter page title and URL slug
5. Click "Create" to save

### 3. Add and Manage Blocks
1. Select a page from the page list
2. Click on the "Components" tab in the sidebar
3. Browse block categories (Basic, Forms, Media, Test)
4. Click the "+" symbol next to any block to add it
5. Drag blocks to position them on the canvas

### 4. Edit Block Content and Properties
- **Content Editing**: Double-click on text blocks to edit inline
- **Properties**: Select a block and use the DetailSideBar on the right
- **Positioning**: Drag blocks freely on the grid canvas
- **Resizing**: Use corner handles when a block is selected
- **Styling**: Modify colors, backgrounds, and other properties in the sidebar

### 5. Customize Layout
1. Click on the "Layout" tab in the sidebar
2. Select header components (Default, Navigation)
3. Select footer components (Default, Social)
4. Adjust global colors and backgrounds
5. Changes are saved automatically

### 6. Preview and Publish
- **Preview Mode**: Toggle between Edit and Preview modes using the eye icon
- **Device Testing**: Use responsive controls to test different screen sizes
- **Public Access**: Pages are automatically available at `/{slug}`
- **Homepage**: Visit `/` to see all published pages

## Editor Modes

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

## Technical Details

### Dependencies
- **Next.js 15.4.6**: React Framework with Turbopack support
- **React 19.1.0**: UI Library
- **react-colorful 5.6.1**: Color picker components
- **@neondatabase/serverless**: Database connectivity
- **lucide-react 0.539.0**: Icon library
- **Tailwind CSS 4**: Utility-first CSS framework
- **react-dnd 16.0.1**: Drag and drop functionality
- **react-dnd-html5-backend**: HTML5 backend for drag and drop

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
- `id`: Unique ID
- `header_component`: Selected header component name
- `footer_component`: Selected footer component name
- `primary_color`: Primary brand color
- `secondary_color`: Secondary accent color
- `background_color`: Page background color
- `text_color`: Default text color
- `created_at`, `updated_at`: Timestamps

## Development

### Adding New Block Components
1. Create your component in `src/components/nic/blocks/`
2. Export it as default with proper metadata
3. The component will be automatically discovered by the API
4. Use the built-in documentation at `/nic/docs` for guidelines

### Configuration
- **NIC Config**: Edit `nic.config.js` for system-wide settings
- **Database**: Modify `database-init.sql` for schema changes
- **Middleware**: Customize `src/middleware.js` for routing logic

### API Endpoints
- `GET/POST /api/cms/pages` - Page management
- `GET/PUT/DELETE /api/cms/blocks/[id]` - Block operations
- `GET/PUT /api/cms/layout` - Layout settings
- `GET /api/cms/components` - Component discovery

## Deployment

### Supported Platforms
1. **Vercel** (recommended) - Full Next.js support with edge functions
2. **Netlify** - Static generation with serverless functions
3. **Self-hosted** - Docker containers or traditional hosting

### Database Considerations
- **Development**: Uses local SQLite database
- **Production**: Consider migrating to PostgreSQL/MySQL for scalability
- **@neondatabase/serverless**: Already configured for Neon PostgreSQL

### Build Commands
```bash
# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Environment Variables
```bash
# Add to .env.local for production
DATABASE_URL=your_database_connection_string
NEXTAUTH_SECRET=your_auth_secret
NEXTAUTH_URL=your_domain_url
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Create a pull request

## License

This project is under the MIT License.

## Support

For questions or issues, please create an issue in the repository.
