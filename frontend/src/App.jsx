import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SnackbarProvider } from './context/SnackbarContext'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/HomePage'
import NewProjectPage from './pages/NewProjectPage'
import ProjectDashboard from './pages/ProjectDashboard'

export default function App() {
  return (
    <SnackbarProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/new" element={<NewProjectPage />} />
            <Route path="/project/:id" element={<ProjectDashboard />} />
            <Route path="/project/:id/:tab" element={<ProjectDashboard />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </SnackbarProvider>
  )
}
