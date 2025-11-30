import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/note/:id?',
    name: 'Note',
    component: () => import('../views/NoteView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // Check if we have a token
    if (authStore.token) {
      // Verify token is still valid
      const isValid = await authStore.checkAuth()
      if (isValid) {
        next()
      } else {
        next('/login')
      }
    } else {
      next('/login')
    }
  } else {
    // Login page - if already authenticated, redirect to home
    if (to.path === '/login' && authStore.token) {
      const isValid = await authStore.checkAuth()
      if (isValid) {
        next('/')
      } else {
        next()
      }
    } else {
      next()
    }
  }
})

export default router

