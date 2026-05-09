import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ecoflow_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ecoflow_token')
      localStorage.removeItem('ecoflow_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
