import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true }
    },
    {
      path: '/',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/resumo'
        },
        {
          path: 'resumo',
          name: 'resumo',
          component: () => import('@/views/ResumoView.vue')
        },
        {
          path: 'estatisticas',
          name: 'estatisticas',
          component: () => import('@/views/EstatisticasView.vue')
        },
        {
          path: 'historico',
          name: 'historico',
          component: () => import('@/views/HistoricoView.vue')
        },
        {
          path: 'ranking',
          name: 'ranking',
          component: () => import('@/views/RankingView.vue')
        },
        {
          path: 'apartamentos',
          name: 'apartamentos',
          component: () => import('@/views/ApartamentosView.vue')
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach((to) => {
  const token = localStorage.getItem('ecoflow_token')
  if (!to.meta.public && !token) return '/login'
  if (to.path === '/login' && token) return '/resumo'
})

export default router
