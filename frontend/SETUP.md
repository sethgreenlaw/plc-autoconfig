# PLC AutoConfig Frontend - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:5173**

### 3. Ensure Backend is Running

The frontend expects the backend API running at `http://localhost:8000`. Make sure the backend is started before using the frontend.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Create optimized production build
- `npm run preview` - Preview production build locally

## Project Features Overview

### Navigation
- **Sidebar**: Always visible on the left with project navigation
- **Top Bar**: Shows current page and tab selection
- **Breadcrumbs**: Easy navigation back to projects list

### Key Pages

#### Projects (Home)
- View all PLC configuration projects
- Create new projects
- See project status at a glance

#### New Project
- Create a new configuration project
- Set project name and customer name
- Auto-redirects to upload page

#### Project Dashboard
The main workspace with 6 tabs:

1. **Overview**: Project summary and statistics
2. **Upload**: CSV file upload with AI analysis
3. **Record Types**: Detailed configuration of record types, fields, workflow, fees, and documents
4. **Departments**: Organization structure
5. **Roles**: User roles and permissions
6. **Deploy**: API integration and deployment (coming soon)

## File Upload Workflow

1. Go to **Upload** tab
2. Drag-and-drop CSV files or click to browse
3. Download sample CSV if needed
4. Click "Analyze with AI" button
5. Wait for analysis to complete (real-time progress shown)
6. Auto-navigates to Record Types when complete

## Record Type Management

Each record type can be expanded to show:
- **Form Fields**: Input fields for the record type
- **Workflow Steps**: Process steps with status transitions
- **Fees**: Associated costs and when applied
- **Documents**: Required documents at each stage

## Theme & Styling

The application uses a professional dark theme:
- Dark slate background (`#0f172a` - slate-950)
- Indigo accents for interactive elements
- Color-coded status badges
- Smooth animations and transitions

## API Integration

The frontend communicates with the backend through a clean API client at `src/api/client.js`.

Common operations:
```javascript
// List projects
await api.get('/projects')

// Create project
await api.post('/projects', {
  name: 'Project Name',
  customer_name: 'Customer Name'
})

// Upload files
await api.upload(`/projects/${id}/upload`, files)

// Start analysis
await api.post(`/projects/${id}/analyze`, {})

// Poll analysis status
await api.get(`/projects/${id}/analysis-status`)
```

## Customization

### Change Colors
Edit `tailwind.config.js` to modify the color scheme or `src/index.css` for custom animations.

### Add New Routes
Update `src/App.jsx` to add new routes, then create corresponding page components in `src/pages/`.

### Modify Sidebar
Edit `src/components/layout/Sidebar.jsx` to customize navigation items and styling.

## Troubleshooting

### Port Already in Use
If port 5173 is already in use, Vite will automatically use the next available port. Check console output.

### API Connection Errors
- Verify backend is running on `http://localhost:8000`
- Check browser console (F12) for detailed error messages
- Ensure CORS is properly configured on backend

### CSS Not Loading
- Clear browser cache (Ctrl+Shift+Del)
- Rebuild with `npm run build`
- Check that `src/index.css` is imported in `src/main.jsx`

### Hot Reload Not Working
- Restart development server
- Ensure all files are saved
- Check that file paths are correct

## Browser DevTools

Press F12 to open browser developer tools:
- **Console**: View JavaScript errors and logs
- **Network**: Monitor API calls and responses
- **Elements**: Inspect HTML and CSS
- **Performance**: Check rendering performance

## Project Structure Quick Reference

```
src/
├── api/client.js              # Backend communication
├── pages/                      # Full page components
│   ├── HomePage.jsx
│   ├── NewProjectPage.jsx
│   └── ProjectDashboard.jsx
├── components/                 # Reusable components
│   └── layout/
│       ├── MainLayout.jsx
│       └── Sidebar.jsx
├── App.jsx                     # Routes
├── main.jsx                    # Entry point
└── index.css                   # Global styles
```

## Performance Tips

- Use React DevTools to check for unnecessary re-renders
- The app uses lazy loading for large lists
- Images and icons are optimized
- CSS is bundled and minified in production

## Next Steps

1. Start the development server: `npm run dev`
2. Open http://localhost:5173 in your browser
3. Create your first project
4. Upload some CSV files
5. Explore the dashboard features

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review console errors (F12)
3. Check that backend API is running and accessible
4. Verify all dependencies are installed: `npm install`

---

**Version**: 1.0.0
**Last Updated**: 2024
