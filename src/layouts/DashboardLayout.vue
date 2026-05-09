<template>
  <div class="layout">
    <header class="header">
      <div class="header-top">
        <div class="brand">
          <div class="logo-box">
            <img src="@/assets/logo.png" alt="EcoFlow" class="logo-img" />
          </div>
          <div class="brand-info">
            <span class="brand-title">EcoFlow - Painel do Síndico</span>
            <span class="brand-sub">Olá, {{ user?.nome?.split(" ")[0] }}</span>
          </div>
        </div>
        <div class="header-right">
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
        <router-link v-for="tab in tabs" :key="tab.to" :to="tab.to" class="nav-tab" :class="{ active: $route.path === tab.to }">
          <span v-html="tab.icon" class="nav-icon"></span>
          {{ tab.label }}
          <span v-if="tab.badge" class="nav-badge">{{ tab.badge }}</span>
        </router-link>
      </nav>
    </header>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import api from "@/services/api"

const router = useRouter()
const user = ref<any>(null)
const dashStats = ref("")
const pendentesCount = ref(0)

const tabs = ref([
  { to: "/resumo",            label: "Resumo",        badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>` },
  { to: "/estatisticas",      label: "Estatísticas",  badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>` },
  { to: "/historico",         label: "Histórico",     badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
  { to: "/ranking",           label: "Ranking",       badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>` },
  { to: "/apartamentos",      label: "Apartamentos",  badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` },
  { to: "/moradores",         label: "Moradores",     badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>` },
  { to: "/descartes",         label: "Descartes",     badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/></svg>` },
  { to: "/recompensas",       label: "Recompensas",   badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>` },
  { to: "/ecopoints",         label: "EcoPoints",     badge: 0, icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01M12 12h.01"/></svg>` },
])

onMounted(async () => {
  const saved = localStorage.getItem("ecoflow_user")
  if (saved) user.value = JSON.parse(saved)
  try {
    const { data } = await api.get("/dashboard/metrics")
    const ativos = data.resumo?.apartamentosAtivos ?? 0
    const total = ativos + (data.resumo?.apartamentosInativos ?? 0)
    dashStats.value = `${ativos} de ${total} aptos ativos`
  } catch { dashStats.value = "" }
  try {
    const { data } = await api.get("/descartes/pendentes")
    pendentesCount.value = data.length
    const d = tabs.value.find(t => t.to === "/descartes")
    if (d) d.badge = data.length
  } catch { /* silent */ }
})

function logout() {
  localStorage.removeItem("ecoflow_token")
  localStorage.removeItem("ecoflow_user")
  router.push("/login")
}
</script>

<style scoped>
.layout { min-height: 100vh; background: var(--color-bg); display: flex; flex-direction: column; }
.header { background: var(--color-surface); border-bottom: 1px solid var(--color-surface-2); position: sticky; top: 0; z-index: 100; }
.header-top { display: flex; align-items: center; justify-content: space-between; padding: 16px 80px; border-bottom: 1px solid var(--color-surface-2); }
.brand { display: flex; align-items: center; gap: 12px; }
.logo-box { 
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-img {
  height: 32px;
  width: auto;
  object-fit: contain;
}
.brand-info { display: flex; flex-direction: column; }
.brand-title { font-size: 16px; font-weight: 600; color: var(--color-white); }
.brand-sub { font-size: 13px; color: var(--color-emerald-100); }
.header-right { display: flex; align-items: center; gap: 20px; }
.user-info { display: flex; flex-direction: column; align-items: flex-end; }
.user-role { font-size: 13px; color: var(--color-emerald-100); }
.user-stats { font-size: 12px; font-weight: 500; }
.btn-logout { display: flex; align-items: center; gap: 6px; background: transparent; color: var(--color-amber); font-size: 14px; font-weight: 500; padding: 6px 12px; border-radius: var(--radius-sm); transition: background 0.2s; }
.btn-logout:hover { background: var(--color-amber-10); }
.nav { display: flex; gap: 4px; padding: 0 80px; overflow-x: auto; }
.nav-tab { display: flex; align-items: center; gap: 8px; padding: 12px 16px; font-size: 14px; font-weight: 500; color: var(--color-emerald-100); border-bottom: 2px solid transparent; transition: color 0.2s, border-color 0.2s; white-space: nowrap; }
.nav-tab:hover { color: var(--color-white); }
.nav-tab.active { color: var(--color-lime); border-bottom-color: var(--color-lime); }
.nav-icon { display: flex; align-items: center; }
.nav-badge { background: var(--color-amber); color: #1a0a00; border-radius: 100px; padding: 1px 7px; font-size: 11px; font-weight: 700; }
.content { flex: 1; padding: 40px 80px; max-width: 1400px; width: 100%; margin: 0 auto; }
@media (max-width: 900px) {
  .header-top { padding: 16px 20px; }
  .nav { padding: 0 20px; }
  .content { padding: 24px 20px; }
}
</style>
