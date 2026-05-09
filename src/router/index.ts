import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import OnboardingView from '@/views/OnboardingView.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/onboarding', name: 'onboarding', component: OnboardingView, meta: { requiresAuth: true } },
    {
      path: '/',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/resumo' },
        { path: 'resumo',        name: 'resumo',        component: () => import('@/views/ResumoView.vue') },
        { path: 'estatisticas',  name: 'estatisticas',  component: () => import('@/views/EstatisticasView.vue') },
        { path: 'historico',     name: 'historico',     component: () => import('@/views/HistoricoView.vue') },
        { path: 'ranking',       name: 'ranking',       component: () => import('@/views/RankingView.vue') },
        { path: 'apartamentos',  name: 'apartamentos',  component: () => import('@/views/ApartamentosView.vue') },
        { path: 'moradores',     name: 'moradores',     component: () => import('@/views/MoradoresView.vue') },
        { path: 'descartes',     name: 'descartes',     component: () => import('@/views/DescartesView.vue') },
        { path: 'recompensas',   name: 'recompensas',   component: () => import('@/views/RecompensasView.vue') },
        { path: 'ecopoints',     name: 'ecopoints',     component: () => import('@/views/EcopointsView.vue') },
        { path: 'criar-apartamento', name: 'criar-apartamento', component: () => import('@/views/CriarApartamentoView.vue') },
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach((to) => {
  const token = localStorage.getItem('ecoflow_token')
  if (!to.meta.public && !token) return '/login'
  if (to.path === '/login' && token) return '/resumo'
})

export default router
