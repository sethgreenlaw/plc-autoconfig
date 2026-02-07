const API_BASE = '/api'

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body)
  }

  if (options.body instanceof FormData) {
    delete config.headers['Content-Type']
  }

  const res = await fetch(url, config)

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error: ${res.status}`)
  }

  return res.json()
}

export const api = {
  // Projects
  listProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: data }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Upload
  uploadFiles: (projectId, files) => {
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    return request(`/projects/${projectId}/upload`, { method: 'POST', body: fd })
  },

  // Analysis
  startAnalysis: (projectId) => request(`/projects/${projectId}/analyze`, { method: 'POST' }),
  getAnalysisStatus: (projectId) => request(`/projects/${projectId}/analysis-status`),
  getSampleCsv: (projectId) => request(`/projects/${projectId}/sample-csv`),

  // Configuration
  getConfiguration: (projectId) => request(`/projects/${projectId}/configurations`),
  updateRecordType: (projectId, rtId, data) =>
    request(`/projects/${projectId}/configurations/record-types/${rtId}`, { method: 'PUT', body: data }),
  addRecordType: (projectId, data) =>
    request(`/projects/${projectId}/configurations/record-types`, { method: 'POST', body: data }),
  deleteRecordType: (projectId, rtId) =>
    request(`/projects/${projectId}/configurations/record-types/${rtId}`, { method: 'DELETE' }),
  updateDepartment: (projectId, deptId, data) =>
    request(`/projects/${projectId}/configurations/departments/${deptId}`, { method: 'PUT', body: data }),
  updateRole: (projectId, roleId, data) =>
    request(`/projects/${projectId}/configurations/roles/${roleId}`, { method: 'PUT', body: data }),
  deploy: (projectId) =>
    request(`/projects/${projectId}/configurations/deploy`, { method: 'POST' }),

  // Community Research
  startResearch: (projectId) => request(`/projects/${projectId}/research`, { method: 'POST' }),
  getResearch: (projectId) => request(`/projects/${projectId}/research`),
}
