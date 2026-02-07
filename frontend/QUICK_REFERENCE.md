# PLC AutoConfig Frontend - Quick Reference

## Getting Started (30 seconds)

```bash
npm install
npm run dev
# Open http://localhost:5173
```

## File Organization Cheat Sheet

```
src/
├── pages/          # Full page components (route endpoints)
├── components/     # Reusable components
├── api/           # Backend communication
├── App.jsx        # Route definitions
├── main.jsx       # Entry point
└── index.css      # Global styles
```

## Component Hierarchy

```
App (routes)
└── MainLayout
    ├── Sidebar
    └── Outlet (current page)
        ├── HomePage
        ├── NewProjectPage
        └── ProjectDashboard (6 tabs)
```

## Styling Quick Reference

### Common Classes
```javascript
// Card
<div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">

// Button Primary
<button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">

// Button Secondary
<button className="bg-slate-700/40 hover:bg-slate-700/60 text-slate-300 rounded-lg">

// Input
<input className="bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-600/50 rounded-lg p-3">

// Badge
<span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">

// Status Badge - Green
<span className="bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">

// Status Badge - Red
<span className="bg-red-900/50 text-red-300 border border-red-700/50">

// Status Badge - Amber
<span className="bg-amber-900/50 text-amber-300 border border-amber-700/50">
```

## API Usage Examples

```javascript
import { api } from '../api/client'

// GET
const projects = await api.get('/projects')

// POST
const newProject = await api.post('/projects', {
  name: 'My Project',
  customer_name: 'ACME Corp'
})

// PUT
await api.put(`/projects/${id}`, { name: 'Updated' })

// DELETE
await api.delete(`/projects/${id}`)

// Upload Files
const result = await api.upload(`/projects/${id}/upload`, fileArray)
```

## State Management Patterns

### Component State
```javascript
const [projects, setProjects] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
```

### Effect for Data Fetching
```javascript
useEffect(() => {
  fetchData()
}, [projectId])

async function fetchData() {
  try {
    const data = await api.get(`/projects/${projectId}`)
    setData(data)
  } catch (err) {
    setError(err.message)
  }
}
```

### Polling (like analysis status)
```javascript
useEffect(() => {
  if (!isRunning) return
  const interval = setInterval(pollStatus, 1500)
  return () => clearInterval(interval)
}, [isRunning])
```

## Navigation

```javascript
import { useNavigate, useParams } from 'react-router-dom'

// Get route params
const { id, tab } = useParams()

// Navigate programmatically
const navigate = useNavigate()
navigate(`/projects/${id}/upload`)
navigate('/')

// Link component for HTML links
import { Link } from 'react-router-dom'
<Link to="/projects/new">New Project</Link>
```

## Icon Usage

```javascript
import {
  Plus, Trash2, Edit2, Upload, Download,
  CheckCircle2, AlertCircle, Clock, Zap,
  FileText, Building2, Users, Rocket
} from 'lucide-react'

<Plus size={18} className="text-indigo-400" />
```

## Form Patterns

### Input Field
```jsx
<div>
  <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
    Label
  </label>
  <input
    type="text"
    id="name"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50"
  />
</div>
```

### Select Dropdown
```jsx
<select
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white"
>
  <option value="option1">Option 1</option>
</select>
```

### Error Display
```jsx
{error && (
  <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex items-start gap-3">
    <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
    <p className="text-red-300">{error}</p>
  </div>
)}
```

## Table Pattern

```jsx
<table className="w-full">
  <thead>
    <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/50">
      <th className="pb-3 font-medium">Column 1</th>
      <th className="pb-3 font-medium">Column 2</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-700/30">
    {items.map(item => (
      <tr key={item.id} className="text-sm text-slate-300 hover:bg-slate-800/30">
        <td className="py-3">{item.col1}</td>
        <td className="py-3">{item.col2}</td>
      </tr>
    ))}
  </tbody>
</table>
```

## Expandable Card Pattern

```jsx
const [expanded, setExpanded] = useState(null)

<div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
  <button
    onClick={() => setExpanded(expanded === id ? null : id)}
    className="w-full px-6 py-4 flex items-center justify-between"
  >
    <span>Title</span>
    <ChevronDown className={expanded === id ? 'rotate-180' : ''} />
  </button>

  {expanded === id && (
    <div className="border-t border-slate-700/50 p-6">
      {/* Expanded content */}
    </div>
  )}
</div>
```

## Drag and Drop Pattern

```jsx
const [dragOver, setDragOver] = useState(false)

<div
  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
  onDragLeave={() => setDragOver(false)}
  onDrop={(e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }}
  className={dragOver ? 'drag-over' : ''}
>
  Drop files here
</div>
```

## Routes Quick Reference

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | HomePage | List all projects |
| `/projects/new` | NewProjectPage | Create new project |
| `/projects/:id` | ProjectDashboard | Project overview |
| `/projects/:id/upload` | ProjectDashboard | Upload files tab |
| `/projects/:id/record-types` | ProjectDashboard | Configure records |
| `/projects/:id/departments` | ProjectDashboard | Manage departments |
| `/projects/:id/roles` | ProjectDashboard | Manage roles |
| `/projects/:id/deploy` | ProjectDashboard | Deploy settings |

## Common Error Handling

```javascript
try {
  const data = await api.post('/endpoint', payload)
  setData(data)
  setError(null)
} catch (err) {
  setError(err.message || 'An error occurred')
  setData(null)
}
```

## Loading States Pattern

```jsx
{loading ? (
  <div className="flex items-center justify-center h-96">
    <Zap className="animate-spin text-indigo-500" size={40} />
  </div>
) : error ? (
  <ErrorDisplay error={error} />
) : (
  <Content data={data} />
)}
```

## Color Palette Reference

```
Primary Accent:  indigo-600 (#4f46e5)
Success:         emerald-500/900
Warning:         amber-500/900
Error:           red-500/900
Info:            blue-500/900
Dark BG:         slate-950 (#0f172a)
Card BG:         slate-800 (#1e293b)
Border:          slate-700 (#334155)
Text:            slate-50 (#f8fafc)
Muted:           slate-400 (#94a3b8)
```

## Environment Variables

```env
# .env file (if using custom API)
VITE_API_URL=http://localhost:8000
```

Update client.js:
```javascript
const API_BASE = import.meta.env.VITE_API_URL || '/api'
```

## Performance Tips

- Use `useCallback` for event handlers in large lists
- Memoize expensive computations
- Lazy load routes with `React.lazy()`
- Keep state as local as possible
- Use proper dependency arrays in `useEffect`

## Debugging

```javascript
// Console logging
console.log('state:', value)

// React DevTools
// Install React DevTools browser extension

// Network tab
// F12 → Network to see API calls
```

## Build & Deploy

```bash
# Build
npm run build

# Preview
npm run preview

# Deploy dist/ folder to:
# - Netlify (drag & drop or git)
# - Vercel (git integration)
# - GitHub Pages
# - AWS S3 + CloudFront
```

## Common Tasks

### Add a New Status Badge Color
1. Add to `statusColors` object in component
2. Use className from mapping

### Add a New Icon
1. Import from lucide-react
2. Use: `<IconName size={18} className="..."/>`

### Add a New Route
1. Update `src/App.jsx` with new route
2. Create page component
3. Add to sidebar navigation if needed

### Add a New Tab
1. Create tab component function
2. Add to `tabs` array
3. Add case to `TabComponent` object
4. Create component logic

### Style a Disabled State
```jsx
disabled:from-slate-600 disabled:to-slate-700 disabled:opacity-50
```

### Add a Modal
```jsx
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md">
      {/* Modal content */}
    </div>
  </div>
)}
```

---

**Pro Tip:** Use Ctrl+Shift+L to see all Lucide icons available, or visit lucide.dev
