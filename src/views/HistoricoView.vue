<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Histórico de Coletas - Condomínio</h1>
      <div class="header-right">
        <div class="filter-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <input v-model="filtro" type="text" placeholder="Filtrar..." class="filter-input" />
        </div>
        <div class="total-badge">Total: <span class="text-lime">{{ totalKg.toFixed(1) }} kg</span></div>
      </div>
    </div>

    <div v-if="loading" class="loading">Carregando histórico...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else class="historico-list">
      <div v-if="filtered.length === 0" class="empty">Nenhum registro encontrado.</div>
      <div v-for="item in filtered" :key="item.id" class="hist-card">
        <div class="hist-icon" :style="{ background: materialBg(item.categoriaMaterial?.nome) }">
          <span class="hist-icon-emoji">{{ materialEmoji(item.categoriaMaterial?.nome) }}</span>
        </div>
        <div class="hist-body">
          <div class="hist-top">
            <div>
              <span class="hist-categoria">{{ item.categoriaMaterial?.nome }}</span>
              <span class="hist-dot"> · </span>
              <span class="hist-apto text-lime">🏢 Apto {{ item.apartamento?.numero }}</span>
            </div>
            <span class="hist-kg" :style="{ color: materialColor(item.categoriaMaterial?.nome) }">
              {{ Number(item.pesoKg).toFixed(1) }} kg
            </span>
          </div>
          <div class="hist-morador">{{ item.apartamento?.moradores?.[0]?.nome }}</div>
          <div class="hist-meta">
            <span>📅 {{ formatDate(item.dataColeta) }}</span>
            <span>🗑 {{ Number(item.pesoKg).toFixed(1) }} kg</span>
          </div>
          <div v-if="item.observacoes" class="hist-obs">{{ item.observacoes }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const loading = ref(true)
const error = ref('')
const historico = ref<any[]>([])
const filtro = ref('')

const COLORS: Record<string, string> = {
  'Plástico': '#3B82F6',
  'Papel / Papelão': '#8B5CF6',
  'Vidro': '#10B981',
  'Metal / Alumínio': '#FF9500',
  'Orgânico': '#7ED321',
}
const EMOJIS: Record<string, string> = {
  'Plástico': '♻️', 'Papel / Papelão': '📄', 'Vidro': '🍶', 'Metal / Alumínio': '🔧', 'Orgânico': '🌱'
}

function materialColor(nome: string) { return COLORS[nome] ?? '#7ED321' }
function materialEmoji(nome: string) { return EMOJIS[nome] ?? '♻️' }
function materialBg(nome: string) { return (COLORS[nome] ?? '#7ED321') + '22' }

const totalKg = computed(() => historico.value.reduce((s, i) => s + Number(i.pesoKg), 0))
const filtered = computed(() => {
  const q = filtro.value.toLowerCase()
  if (!q) return historico.value
  return historico.value.filter(i =>
    i.categoriaMaterial?.nome?.toLowerCase().includes(q) ||
    i.apartamento?.numero?.toLowerCase().includes(q) ||
    i.apartamento?.moradores?.[0]?.nome?.toLowerCase().includes(q) ||
    i.observacoes?.toLowerCase().includes(q)
  )
})

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/historico')
    historico.value = data
  } catch {
    error.value = 'Erro ao carregar histórico.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.page-title { font-size: 24px; font-weight: 600; color: var(--color-white); }
.header-right { display: flex; align-items: center; gap: 12px; }
.filter-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  color: var(--color-emerald-100);
}
.filter-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-white);
  font-size: 14px;
  width: 160px;
}
.filter-input::placeholder { color: #4a6a6a; }
.total-badge {
  background: var(--color-surface);
  border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  font-size: 14px;
  color: var(--color-white);
}

.loading, .error-state, .empty {
  text-align: center;
  padding: 60px 0;
  color: var(--color-emerald-100);
}
.error-state { color: var(--color-amber); }

.historico-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hist-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  transition: background 0.15s;
}
.hist-card:hover { background: var(--color-surface-2); }

.hist-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.hist-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }

.hist-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.hist-categoria { font-size: 15px; font-weight: 500; color: var(--color-white); }
.hist-dot { color: var(--color-surface-2); }
.hist-apto { font-size: 14px; }
.hist-kg { font-size: 14px; font-weight: 600; white-space: nowrap; }

.hist-morador { font-size: 13px; color: var(--color-white); }
.hist-meta { display: flex; gap: 12px; font-size: 12px; color: var(--color-emerald-100); }
.hist-obs { font-size: 12px; color: #5a8a8a; font-style: italic; }
</style>
