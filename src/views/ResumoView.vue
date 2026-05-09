<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Visão Geral do Condomínio</h1>
      <span class="page-date text-muted">{{ mesAtual }}</span>
    </div>

    <div v-if="loading" class="loading">Carregando métricas...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <template v-else>
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon" style="color: var(--color-lime)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <span class="kpi-label">Total Reciclado (Condomínio)</span>
          <span class="kpi-value">{{ resumo.totalRecicladoKg?.toFixed(1) }} kg</span>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="color: var(--color-amber)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span class="kpi-label">Coletas Registradas</span>
          <span class="kpi-value">{{ resumo.coletasRegistradas }}</span>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="color: var(--color-blue)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span class="kpi-label">Apartamentos Ativos</span>
          <span class="kpi-value">{{ resumo.apartamentosAtivos }}/{{ resumo.apartamentosAtivos + resumo.apartamentosInativos }}</span>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="color: var(--color-lime)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span class="kpi-label">Média por Apartamento</span>
          <span class="kpi-value">{{ resumo.mediaPorApartamento?.toFixed(1) }} kg</span>
        </div>
      </div>

      <!-- Materiais Bar Chart -->
      <div class="card materiais-card">
        <h2 class="card-title">Materiais Coletados - Total do Condomínio (kg)</h2>
        <div class="materiais-list">
          <div v-for="mat in materiaisColetados" :key="mat.nome" class="material-row">
            <div class="material-meta">
              <span class="material-nome">{{ mat.nome }}</span>
              <span class="material-kg text-white">{{ mat.totalKg.toFixed(1) }} kg</span>
            </div>
            <div class="material-bar-bg">
              <div
                class="material-bar-fill"
                :style="{ width: barWidth(mat.totalKg) + '%', background: mat.color }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Meta + Inativos -->
      <div class="bottom-row">
        <div class="meta-card">
          <span class="meta-title text-lime">🎯 Meta do Mês</span>
          <span class="meta-sub text-muted">
            Meta: {{ resumo.metaDoMes?.metaKg?.toFixed(0) ?? '–' }} kg · Atual: {{ resumo.metaDoMes?.realizadoKg?.toFixed(1) ?? '0' }} kg ({{ resumo.metaDoMes?.percentual?.toFixed(0) ?? 0 }}%)
          </span>
          <div class="progress-bg">
            <div class="progress-fill" :style="{ width: Math.min(resumo.metaDoMes?.percentual ?? 0, 100) + '%' }"/>
          </div>
        </div>

        <div class="inativos-card">
          <span class="meta-title text-amber">⚠️ Apartamentos Inativos</span>
          <span class="meta-sub text-muted">
            {{ resumo.apartamentosInativos }} apartamento{{ resumo.apartamentosInativos !== 1 ? 's' : '' }} sem coletas este mês. Considere enviar lembretes.
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const loading = ref(true)
const error = ref('')
const resumo = ref<any>({})
const materiaisColetados = ref<any[]>([])

const MATERIAL_COLORS: Record<string, string> = {
  'Plástico': '#3B82F6',
  'Papel / Papelão': '#8B5CF6',
  'Vidro': '#10B981',
  'Metal / Alumínio': '#FF9500',
  'Orgânico': '#7ED321',
}

const mesAtual = computed(() => {
  return new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
})

function barWidth(kg: number) {
  const max = Math.max(...materiaisColetados.value.map((m: any) => m.totalKg), 1)
  return (kg / max) * 100
}

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/metrics')
    resumo.value = data.resumo ?? {}
    materiaisColetados.value = (data.materiaisColetados ?? []).map((m: any) => ({
      ...m,
      color: MATERIAL_COLORS[m.nome] ?? '#7ED321'
    }))
  } catch {
    error.value = 'Erro ao carregar métricas. Verifique a conexão com a API.'
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
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-white);
}
.page-date { font-size: 14px; }

.loading { color: var(--color-emerald-100); padding: 40px 0; text-align: center; }
.error-state { color: var(--color-amber); padding: 40px 0; text-align: center; }

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kpi-icon { margin-bottom: 8px; }
.kpi-label { font-size: 13px; color: var(--color-emerald-100); }
.kpi-value { font-size: 26px; font-weight: 400; color: var(--color-white); }

/* Materiais */
.card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 24px;
  margin-bottom: 24px;
}
.card-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--color-white);
  margin-bottom: 20px;
}

.materiais-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.material-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.material-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.material-nome { font-size: 14px; color: var(--color-emerald-100); }
.material-kg { font-size: 15px; }
.material-bar-bg {
  width: 100%;
  height: 8px;
  background: var(--color-bg);
  border-radius: 100px;
  overflow: hidden;
}
.material-bar-fill {
  height: 8px;
  border-radius: 100px;
  transition: width 0.6s ease;
}

/* Bottom Row */
.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.meta-card {
  background: var(--color-lime-10);
  border: 1px solid var(--color-lime-30);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.inativos-card {
  background: var(--color-amber-10);
  border: 1px solid var(--color-amber-30);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.meta-title { font-size: 16px; font-weight: 500; }
.meta-sub { font-size: 14px; }

.progress-bg {
  width: 100%;
  height: 8px;
  background: var(--color-bg);
  border-radius: 100px;
  overflow: hidden;
}
.progress-fill {
  height: 8px;
  background: var(--color-lime);
  border-radius: 100px;
  transition: width 0.6s ease;
}

@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .bottom-row { grid-template-columns: 1fr; }
}
</style>
