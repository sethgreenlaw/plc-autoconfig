# PLC AutoConfig Frontend

A modern, dark-themed React web application for managing PLC configuration projects. Upload CSV data, use AI to analyze it, and generate PLC configurations automatically.

## Features

- **Project Management**: Create and manage multiple PLC configuration projects
- **CSV Upload**: Drag-and-drop CSV file upload with progress tracking
- **AI Analysis**: Automatic AI-powered analysis of uploaded data structures
- **Record Type Configuration**: Visual management of record types, fields, workflow steps, fees, and documents
- **Department & Role Management**: Organize projects by departments and user roles
- **Deployment Ready**: Integration-ready for PLC API deployment
- **Dark Theme**: Modern, professional dark UI with smooth animations

## Tech Stack

- **React 18.3**: UI framework
- **Vite**: Lightning-fast build tool
- **TailwindCSS**: Utility-first CSS framework
- **React Router 6**: Client-side routing
- **Lucide React**: Beautiful icon library
- **PostCSS**: CSS processing

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.js              # API fetch wrapper
│   ├── components/
│   │   └── layout/
│   │       ├── MainLayout.jsx     # Main layout wrapper
│   │       └── Sidebar.jsx        # Navigation sidebar
│   ├── pages/
│   │   ├── HomePage.jsx           # Projects list
│   │   ├── NewProjectPage.jsx     # Create new project
│   │   └── ProjectDashboard.jsx   # Main dashboard with all tabs
│   ├── App.jsx                    # Route definitions
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Global styles
├── index.html                     # HTML entry point
├── package.json                   # Dependencies
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # TailwindCSS configuration
└── postcss.config.js              # PostCSS configuration
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server will start at `http://localhost:5173`

## Development

### Environment Configuration

The app expects the backend API to be running at `http://localhost:8000`. This is configured in `vite.config.js` with a proxy:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

### API Integration

All API calls go through the `api` client in `src/api/client.js`:

```javascript
import { api } from '../api/client'

// GET
const data = await api.get('/projects')

// POST
const result = await api.post('/projects', { name: 'My Project' })

// PUT
await api.put(`/projects/${id}`, { name: 'Updated' })

// DELETE
await api.delete(`/projects/${id}`)

// File Upload
const result = await api.upload(`/projects/${id}/upload`, files)
```

## Pages & Routes

### HomePage (`/`)
- Displays list of all projects
- Create new project button
- Project cards with status badges
- Quick navigation to project details

### NewProjectPage (`/projects/new`)
- Form to create a new project
- Fields: Project Name, Customer Name, Product Type
- Redirects to upload page after creation

### ProjectDashboard (`/projects/:id` and `/projects/:id/:tab`)
Main project management interface with tabs:

#### Overview Tab
- Project status and summary
- Key statistics (files, record types, departments, roles)
- Quick action buttons
- Project information and next steps

#### Upload Tab
- Drag-and-drop file upload zone
- List of uploaded files with details
- Sample CSV download button
- "Analyze with AI" button
- Real-time analysis progress tracking

#### Record Types Tab
- Grid of expandable record type cards
- Each card shows:
  - Name and category badge
  - Department assignment
  - Count of fields, steps, fees, documents
  - Expandable detail sections for:
    - Form Fields (table)
    - Workflow Steps (visual list)
    - Fees (table)
    - Documents (table)
  - Edit/delete actions

#### Departments Tab
- List of departments
- Department information and linked record types
- Add/edit/delete department actions

#### Roles Tab
- List of user roles
- Role permissions as badges
- Department assignments
- Add/edit/delete role actions

#### Deploy Tab
- Coming soon: PLC API integration
- Deployment summary
- Push to PLC button (disabled, for future use)

## UI Components & Patterns

### Color Scheme

**Dark Theme Base:**
- Background: `bg-slate-950`
- Cards: `bg-slate-800/50` with `border-slate-700/50`
- Text: `text-slate-50` (white) and `text-slate-400` (muted)

**Status Badge Colors:**
```javascript
{
  setup: 'bg-slate-600',
  uploading: 'bg-blue-900/50',
  analyzing: 'bg-amber-900/50',
  configured: 'bg-emerald-900/50',
  error: 'bg-red-900/50',
  deployed: 'bg-purple-900/50',
}
```

**Category Colors (Record Types):**
```javascript
{
  permit: 'bg-blue-900/50',
  license: 'bg-emerald-900/50',
  code_enforcement: 'bg-orange-900/50',
  inspection: 'bg-purple-900/50',
}
```

### Interactive Elements

- **Buttons**: Gradient background (indigo), smooth hover states
- **Forms**: Dark inputs with subtle borders, focus rings
- **Tables**: Striped rows with hover effects
- **Cards**: Subtle borders, hover effects with color transitions
- **Expandables**: Smooth animations with chevron rotation

### Icons

Uses `lucide-react` for all icons. Common icons used:
- Navigation: `LayoutDashboard`, `FolderOpen`, `Home`
- Actions: `Plus`, `Edit2`, `Trash2`, `Download`
- Status: `CheckCircle2`, `AlertCircle`, `Clock`, `Zap`
- Sections: `Upload`, `FileText`, `Building2`, `Users`, `Rocket`, `Layers`

## State Management

The app uses React's built-in hooks for state management:

- `useState`: Component-level state
- `useEffect`: Side effects and data fetching
- `useRef`: File input references
- `useParams`: URL route parameters
- `useNavigate`: Navigation between routes

## API Endpoints Expected

The frontend expects these backend endpoints:

```
GET    /api/projects                          # List all projects
POST   /api/projects                          # Create project
GET    /api/projects/:id                      # Get project details
GET    /api/projects/:id/sample-csv           # Download sample CSV
POST   /api/projects/:id/upload               # Upload CSV files
POST   /api/projects/:id/analyze              # Start AI analysis
GET    /api/projects/:id/analysis-status      # Poll analysis progress
PUT    /api/projects/:id                      # Update project
DELETE /api/projects/:id                      # Delete project
```

## Styling Guide

### TailwindCSS Classes

- Spacing: `p-6`, `px-4`, `py-3`, `gap-4`, `space-y-6`
- Colors: Dark slate palette with indigo accents
- Rounded corners: `rounded-lg`, `rounded-xl`
- Borders: `border border-slate-700/50`
- Hover effects: `hover:border-slate-600/50`, `hover:bg-slate-800/70`
- Transitions: `transition-all`, `transition-colors`

### Custom CSS

Check `src/index.css` for:
- Custom scrollbar styling
- Animation keyframes (`pulse-glow`)
- Drag-over effects
- Smooth transitions

## Performance Optimizations

- Lazy component loading with React Router
- Efficient state updates
- Optimized re-renders with proper dependency arrays
- Image/icon optimization with Lucide
- CSS minimization in production build

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern browsers with ES2020 support

## Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Environment Variables

If needed, create a `.env` file:

```env
VITE_API_URL=http://localhost:8000
```

Then update `src/api/client.js` to use:
```javascript
const API_BASE = import.meta.env.VITE_API_URL || '/api'
```

### Static Hosting

The built application can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Any web server

Ensure the backend API is accessible from the deployed frontend.

## Troubleshooting

### API Connection Issues
- Ensure backend is running on `http://localhost:8000`
- Check browser console for CORS errors
- Verify the proxy configuration in `vite.config.js`

### Build Errors
- Clear `node_modules` and `dist` directories
- Run `npm install` again
- Check Node.js version compatibility

### Styling Issues
- Rebuild with `npm run build`
- Clear browser cache
- Verify TailwindCSS configuration

## License

Proprietary - PLC AutoConfig Project
