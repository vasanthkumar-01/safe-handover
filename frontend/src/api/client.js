import axios from 'axios'

const api = axios.create({
  baseURL: 'https://safe-handover.onrender.com',
  headers: { 'Content-Type': 'application/json' },
})
export const getDashboardSummary = () => api.get('/dashboard/summary').then(r => r.data)
export const getHandovers = () => api.get('/handovers').then(r => r.data)
export const analyzeHandover = (payload) => api.post('/handovers/analyze', payload).then(r => r.data)
export const getActions = () => api.get('/actions').then(r => r.data)
export const resolveAction = (id) => api.patch(`/actions/${id}/resolve`).then(r => r.data)
export const getShiftChanges = () => api.get('/shift-changes').then(r => r.data)
export const getUnresolvedAtShiftChange = () => api.get('/shift-changes/unresolved').then(r => r.data)
export const getSubsequentEvents = () => api.get('/subsequent-events').then(r => r.data)
export const getFailureCases = () => api.get('/failure-cases').then(r => r.data)
export const getFailureCasesSummary = () => api.get('/failure-cases/summary').then(r => r.data)
export const getMetrics = () => api.get('/metrics').then(r => r.data)

export default api
