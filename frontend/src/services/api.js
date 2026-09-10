import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. The backend may be busy.'))
    }
    if (!error.response) {
      return Promise.reject(new Error('Cannot connect to backend. Is it running on port 8000?'))
    }
    const message = error.response.data?.detail || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

export const investigateWallet = async (walletAddress, params = {}) => {
  const response = await api.get(`/investigate/${walletAddress}`, { params })
  return response.data
}

export const searchWallets = async (query) => {
  const response = await api.get('/search', { params: { q: query } })
  return response.data
}

export const trainModel = async (params = {}) => {
  const response = await api.post('/ml/train', null, { params })
  return response.data
}

export const getModelInfo = async () => {
  const response = await api.get('/ml/model-info')
  return response.data
}

export const getHealth = async () => {
  const response = await axios.get('/health', { timeout: 30000 })
  return response.data
}

export default api