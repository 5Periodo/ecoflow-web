<template>
  <div class="layout">
    <header class="header">
      <div class="header-top">
        <div class="brand">
          <div class="logo-box">
            <img src="@/assets/logo.png" alt="EcoFlow" class="logo-img" />
          </div>
          <div class="brand-info">
            <span class="brand-title">EcoFlow — Painel do Síndico</span>
            <span class="brand-sub">Olá, {{ user?.nome?.split(' ')[0] }}</span>
          </div>
        </div>

        <div class="header-right">
          <!-- Centro de notificações -->
          <div class="notif-center" v-if="pendentesCount > 0 || resgatesPendentes > 0">
            <div v-if="pendentesCount > 0" class="notif-chip amber" @click="$router.push('/descartes')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              </svg>
              {{ pendentesCount }} descarte{{ pendentesCount !== 1 ? 's' : '' }} pendente{{ pendentesCount !== 1 ? 's' : '' }}
            </div>
            <div v-if="resgatesPendentes > 0" class="notif-chip blue" @click="$router.push('/recompensas')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
              </svg>
              {{ resgatesPendentes }} resgate{{ resgatesPendentes !== 1 ? 's' : '' }}
            </div>
          </div>

          <div class="user-info">
            <span class="user-role">Gestor da Plataforma</span>
            <span class="user-stats text-lime">{{ dashStats }}</span>
          </div>
          <button class="btn-logout" @click="logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </div>
      </div>

      <nav class="nav">
        <!-- Grupo: Visão Geral -->
        <div class="nav-group">
          <span class="nav-group-label">Visão Geral</span>
          <router-link v-for="tab in visaoGeralTabs" :key="tab.to" :to="tab.to"
            class="nav-tab" :class="{ active: $route.path === tab.to }">
            <span v-html="tab.icon" class="nav-icon"></span>
            {{ tab.label }}
          </router-link>
        </div>
        <div class="nav-divider"></div>
        <!-- Grupo: Gestão -->
        <div class="nav-group">
          <span class="nav-group-label">Gestão</span>
          <router-link v-for="tab in gestaoTabs" :key="tab.to" :to="tab.to"
            class="nav-tab" :class="{ active: $route.path === tab.to }">
            <span v-html="tab.icon" class="nav-icon"></span>
            {{ tab.label }}
            <span v-if="tab.badge" class="nav-badge">{{ tab.badge }}</span>
          </router-link>
        </div>
      </nav>
    </header>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const user = ref<any>(null)
const dashStats = ref('')
const pendentesCount = ref(0)
const resgatesPendentes = ref(0)

const visaoGeralTabs = [
  { to: '/resumo',      label: 'Resumo',      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>` },
  { to: '/estatisticas',label: 'Estatísticas', icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>` },
  { to: '/historico',   label: 'Histórico',   icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
  { to: '/ranking',     label: 'Ranking',     icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>` },
]

const gestaoTabs = ref([
  { to: '/apartamentos', label: 'Apartamentos', badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` },
  { to: '/moradores',   label: 'Moradores',   badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>` },
  { to: '/descartes',   label: 'Descartes',   badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/></svg>` },
  { to: '/recompensas', label: 'Recompensas', badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>` },
  { to: '/ecopoints',   label: 'EcoPoints',   badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01M12 12h.01"/></svg>` },
])

onMounted(async () => {
  const saved = localStorage.getItem('ecoflow_user')
  if (saved) user.value = JSON.parse(saved)

  try {
    const { data } = await api.get('/dashboard/metrics')
    const ativos = data.resumo?.apartamentosAtivos ?? 0
    const total = ativos + (data.resumo?.apartamentosInativos ?? 0)
    dashStats.value = `${ativos} de ${total} aptos ativos`
  } catch { dashStats.value = '' }

  try {
    const { data } = await api.get('/descartes/pendentes')
    pendentesCount.value = data.length
    const d = gestaoTabs.value.find(t => t.to === '/descartes')
    if (d) d.badge = data.length
  } catch { /* silent */ }

  try {
    const { data } = await api.get('/recompensas/admin/resgates')
    const pendentes = data.filter((r: any) => r.status === 'PENDENTE')
    resgatesPendentes.value = pendentes.length
  } catch { /* silent */ }
})

function logout() {
  localStorage.removeItem('ecoflow_token')
  localStorage.removeItem('ecoflow_user')
  router.push('/login')
}
</script>

<style scoped>
.layout { min-height: 100vh; background: var(--color-bg); display: flex; flex-direction: column; }
.header { background: var(--color-surface); border-bottom: 1px solid var(--color-surface-2); position: sticky; top: 0; z-index: 100; }

/* Header top */
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 80px;
  border-bottom: 1px solid var(--color-surface-2);
  gap: 16px;
  flex-wrap: wrap;
}
.brand { display: flex; align-items: center; gap: 12px; }
.logo-box { display: flex; align-items: center; justify-content: center; }
.logo-img { height: 32px; width: auto; object-fit: contain; }
.brand-info { display: flex; flex-direction: column; }
.brand-title { font-size: 16px; font-weight: 600; color: var(--color-white); }
.brand-sub { font-size: 13px; color: var(--color-emerald-100); }

.header-right { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.user-info { display: flex; flex-direction: column; align-items: flex-end; }
.user-role { font-size: 13px; color: var(--color-emerald-100); }
.user-stats { font-size: 12px; font-weight: 500; }

/* Notification chips */
.notif-center { display: flex; gap: 8px; flex-wrap: wrap; }
.notif-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
}
.notif-chip:hover { opacity: 0.8; }
.notif-chip.amber {
  background: var(--color-amber-10);
  color: var(--color-amber);
  border: 1px solid var(--color-amber-30);
}
.notif-chip.blue {
  background: rgba(59,130,246,0.1);
  color: #93c5fd;
  border: 1px solid rgba(59,130,246,0.3);
}

.btn-logout {
  display: flex; align-items: center; gap: 6px;
  background: transparent; color: var(--color-amber);
  font-size: 14px; font-weight: 500; padding: 6px 12px;
  border-radius: var(--radius-sm); transition: background 0.2s;
}
.btn-logout:hover { background: var(--color-amber-10); }

/* Navigation */
.nav {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 80px;
  overflow-x: auto;
}
.nav-group {
  display: flex;
  align-items: center;
  gap: 2px;
}
.nav-group-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #3a6a6a;
  padding: 0 12px;
  white-space: nowrap;
}
.nav-divider {
  width: 1px;
  height: 20px;
  background: var(--color-surface-2);
  margin: 0 8px;
  flex-shrink: 0;
}
.nav-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 14px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-emerald-100);
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
  white-space: nowrap;
  position: relative;
}
.nav-tab:hover { color: var(--color-white); }
.nav-tab.active { color: var(--color-lime); border-bottom-color: var(--color-lime); }
.nav-icon { display: flex; align-items: center; }
.nav-badge {
  background: var(--color-amber);
  color: #1a0a00;
  border-radius: 100px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 700;
  animation: pulse-badge 2s infinite;
}
@keyframes pulse-badge {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,149,0,0.4); }
  50% { box-shadow: 0 0 0 4px rgba(255,149,0,0); }
}

.content {
  flex: 1;
  padding: 40px 80px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 1100px) {
  .header-top { padding: 14px 24px; }
  .nav { padding: 0 24px; }
  .content { padding: 32px 24px; }
}
@media (max-width: 768px) {
  .header-top { padding: 12px 16px; }
  .nav { padding: 0 16px; }
  .content { padding: 20px 16px; }
  .notif-center { display: none; }
  .user-info { display: none; }
}
</style>
