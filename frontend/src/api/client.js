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
  uploadFilesAsText: (projectId, fileData) =>
    request(`/projects/${projectId}/upload-text`, { method: 'POST', body: fileData }),

  // Analysis
  startAnalysis: (projectId) => request(`/projects/${projectId}/analyze`, { method: 'POST' }),
  getAnalysisStatus: (projectId) => request(`/projects/${projectId}/analysis-status`),
  getSampleCsv: (projectId) => request(`/projects/${projectId}/sample-csv`),
  analyzeStep1: (projectId) => request(`/projects/${projectId}/analyze/parse-csv`, { method: 'POST' }),
  analyzeStep2: (projectId, data) => request(`/projects/${projectId}/analyze/scrape-website`, { method: 'POST', body: data }),
  analyzeStep3: (projectId, data) => request(`/projects/${projectId}/analyze/extract-data`, { method: 'POST', body: data }),
  analyzeStep4: (projectId, data) => request(`/projects/${projectId}/analyze/generate-config`, { method: 'POST', body: data }),

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
  exportConfig: (projectId) => request(`/projects/${projectId}/configurations/export`),

  // Community Research
  startResearch: (projectId) => request(`/projects/${projectId}/research`, { method: 'POST' }),
  getResearch: (projectId) => request(`/projects/${projectId}/research`),

  // City Preview
  getCityPreview: (url) => request('/city-preview', { method: 'POST', body: { url } }),

  // Consultant
  askConsultant: (projectId, question, history = []) =>
    request(`/projects/${projectId}/consultant/ask`, { method: 'POST', body: { question, history } }),

  // LMS
  generateLms: (projectId, type) => request(`/projects/${projectId}/lms/generate/${type}`, { method: 'POST' }),

  // Data Sources
  getDataSources: (projectId) => request(`/projects/${projectId}/sources`),
  addMunicipalCode: (projectId, url) =>
    request(`/projects/${projectId}/sources/municipal-code`, { method: 'POST', body: { url } }),
  addExistingForm: (projectId, data) =>
    request(`/projects/${projectId}/sources/existing-form`, { method: 'POST', body: data }),
  addFeeSchedule: (projectId, data) =>
    request(`/projects/${projectId}/sources/fee-schedule`, { method: 'POST', body: data }),
  deleteSource: (projectId, sourceId) =>
    request(`/projects/${projectId}/sources/${sourceId}`, { method: 'DELETE' }),
  reconcileSources: (projectId) =>
    request(`/projects/${projectId}/sources/reconcile`, { method: 'POST' }),
  acceptReconciliation: (projectId, itemId) =>
    request(`/projects/${projectId}/reconciliation/${itemId}/accept`, { method: 'POST' }),
  rejectReconciliation: (projectId, itemId) =>
    request(`/projects/${projectId}/reconciliation/${itemId}/reject`, { method: 'POST' }),

  // Peer City Templates
  getPeerTemplates: (search = '') => request(`/templates/peer-cities${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getPeerTemplate: (id) => request(`/templates/peer-cities/${id}`),
  applyTemplate: (projectId, templateId, mode = 'merge') =>
    request(`/projects/${projectId}/sources/apply-template`, { method: 'POST', body: { template_id: templateId, mode } }),

  // Validation
  validateConfig: (projectId) =>
    request(`/projects/${projectId}/validate`, { method: 'POST' }),
  autoFixFinding: (projectId, findingId) =>
    request(`/projects/${projectId}/validate/auto-fix/${findingId}`, { method: 'POST' }),

  // Intelligence Hub
  getIntelligence: (projectId) =>
    request(`/projects/${projectId}/intelligence`),
  reAnalyze: (projectId, additionalContext) =>
    request(`/projects/${projectId}/re-analyze`, { method: 'POST', body: { additional_context: additionalContext } }),
  deepScrape: (projectId, agentId) =>
    request(`/projects/${projectId}/deep-scrape`, { method: 'POST', body: { agent_id: agentId } }),

  // Status
  getKvStatus: () => request('/kv-status'),
}
