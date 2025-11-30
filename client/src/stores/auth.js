import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '../services/api.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('auth_token') || null)
  const username = ref(null)
  const isAuthenticated = ref(!!token.value)
  
  async function login(usernameInput, password) {
    try {
      const response = await api.login(usernameInput, password)
      token.value = response.access_token
      username.value = usernameInput
      isAuthenticated.value = true
      localStorage.setItem('auth_token', token.value)
      return { success: true }
    } catch (error) {
      console.error('Login failed:', error)
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      }
    }
  }
  
  async function logout() {
    token.value = null
    username.value = null
    isAuthenticated.value = false
    localStorage.removeItem('auth_token')
  }
  
  async function checkAuth() {
    if (!token.value) {
      isAuthenticated.value = false
      return false
    }
    
    try {
      const userInfo = await api.getCurrentUser()
      username.value = userInfo.username
      isAuthenticated.value = true
      return true
    } catch (error) {
      // Token invalid, logout
      await logout()
      return false
    }
  }
  
  function getToken() {
    return token.value
  }
  
  return {
    token,
    username,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    getToken
  }
})

