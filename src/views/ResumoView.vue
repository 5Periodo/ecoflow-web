<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Visão Geral do Condomínio</h1>
      <span class="page-date text-muted">{{ mesAtual }}</span>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading" class="kpi-grid">
      <div v-for="n in 4" :key="n" class="kpi-skeleton"></div>
    </div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <template v-else>
      <!-- KPI Cards com tendência -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon" style="color: var(--color-lime)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <span class="kpi-label">Total Reciclado</span>
          <span class="kpi-value">{{ resumo.totalRecicladoKg?.toFixed(1) }} kg</span>
          <div class="kpi-trend" :class="tendencias.reciclado >= 0 ? 'positive' : 'negative'" v-if="tendencias.reciclado !== null">
            <span>{{ tendencias.reciclado >= 0 ? '↑' : '↓' }} {{ Math.abs(tendencias.reciclado) }}%</span>
            <span class="trend-sub">vs. mês anterior</span>
          </div>
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
          <div class="kpi-trend" :class="tendencias.coletas >= 0 ? 'positive' : 'negative'" v-if="tendencias.coletas !== null">
            <span>{{ tendencias.coletas >= 0 ? '↑' : '↓' }} {{ Math.abs(tendencias.coletas) }}%</span>
            <span class="trend-sub">vs. mês anterior</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="color: var(--color-blue)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span class="kpi-label">Apartamentos Ativos</span>
          <span class="kpi-value">{{ resumo.apartamentosAtivos }}<span class="kpi-total">/{{ resumo.apartamentosAtivos + resumo.apartamentosInativos }}</span></span>
          <div class="kpi-trend neutral">
            <span>{{ Math.round((resumo.apartamentosAtivos / (resumo.apartamentosAtivos + resumo.apartamentosInativos || 1)) * 100) }}% participação</span>
          </div>
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
          <div class="kpi-trend" :class="tendencias.media >= 0 ? 'positive' : 'negative'" v-if="tendencias.media !== null">
            <span>{{ tendencias.media >= 0 ? '↑' : '↓' }} {{ Math.abs(tendencias.media) }}%</span>
            <span class="trend-sub">vs. mês anterior</span>
          </div>
        </div>
      </div>

      <!-- Materiais Bar Chart com percentual -->
      <div class="card materiais-card">
        <h2 class="card-title">Materiais Coletados — Total do Condomínio (kg)</h2>
        <div class="materiais-list">
          <div v-for="mat in materiaisColetados" :key="mat.nome" class="material-row">
            <div class="material-meta">
              <span class="material-nome">{{ mat.nome }}</span>
              <div class="material-values">
                <span class="material-pct text-muted">{{ matPercent(mat.totalKg) }}%</span>
                <span class="material-kg text-white">{{ mat.totalKg.toFixed(1) }} kg</span>
              </div>
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
        <!-- Meta do mês -->
        <div class="meta-card" :class="{ 'meta-achieved': metaAtingida }">
          <div class="meta-header">
            <span class="meta-title text-lime">
              {{ metaAtingida ? '🎉 Meta Atingida!' : '🎯 Meta do Mês' }}
            </span>
            <button class="btn-edit-meta" @click="showEditMeta = true" title="Editar meta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar meta
            </button>
          </div>
          <span class="meta-sub text-muted">
            Meta: {{ resumo.metaDoMes?.metaKg?.toFixed(0) ?? '–' }} kg &nbsp;·&nbsp;
            Atual: {{ resumo.metaDoMes?.realizadoKg?.toFixed(1) ?? '0' }} kg
            ({{ resumo.metaDoMes?.percentual?.toFixed(0) ?? 0 }}%)
          </span>
          <div class="progress-bg">
            <div class="progress-fill" :class="{ achieved: metaAtingida }" :style="{ width: Math.min(resumo.metaDoMes?.percentual ?? 0, 100) + '%' }"/>
          </div>
          <span v-if="metaAtingida" class="meta-celebration">
            🌟 Parabéns! O condomínio atingiu a meta de reciclagem deste mês!
          </span>
        </div>

        <!-- Apartamentos Inativos -->
        <div class="inativos-card">
          <span class="meta-title text-amber">⚠️ Apartamentos Inativos</span>
          <span class="meta-sub text-muted">
            {{ resumo.apartamentosInativos }} apartamento{{ resumo.apartamentosInativos !== 1 ? 's' : '' }}
            sem coletas este mês.
          </span>
          <router-link to="/apartamentos" class="btn-ver-inativos">
            Ver apartamentos inativos →
          </router-link>
        </div>
      </div>

      <!-- Modal de edição de meta -->
      <Teleport to="body">
        <div v-if="showEditMeta" class="modal-overlay" @click.self="showEditMeta = false">
          <div class="modal-box">
            <div class="modal-header">
              <h2>Editar Meta do Mês</h2>
              <button class="btn-close" @click="showEditMeta = false">✕</button>
            </div>
            <form @submit.prevent="salvarMeta" class="modal-form">
              <div class="field">
                <label>Meta de reciclagem (kg)</label>
                <input v-model.number="novaMeta" type="number" min="1" required />
                <span class="hint">Meta atual: {{ resumo.metaDoMes?.metaKg ?? '–' }} kg</span>
              </div>
              <p v-if="metaError" class="error-msg">{{ metaError }}</p>
              <div class="modal-footer">
                <button type="button" class="btn-cancel" @click="showEditMeta = false">Cancelar</button>
                <button type="submit" class="btn-submit" :disabled="metaLoading">
                  {{ metaLoading ? 'Salvando...' : 'Salvar Meta' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { toast } from '@/services/toast'

const loading = ref(true)
const error = ref('')
const resumo = ref<any>({})
const materiaisColetados = ref<any[]>([])
const resumoMesAnterior = ref<any>({})

const showEditMeta = ref(false)
const novaMeta = ref<number>(0)
const metaLoading = ref(false)
const metaError = ref('')

const MATERIAL_COLORS: Record<string, string> = {
  'Plástico': '#3B82F6',
  'Papel / Papelão': '#8B5CF6',
  'Vidro': '#10B981',
  'Metal / Alumínio': '#FF9500',
  'Orgânico': '#7ED321',
}

const mesAtual = computed(() =>
  new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
)

const metaAtingida = computed(() =>
  (resumo.value.metaDoMes?.percentual ?? 0) >= 100
)

const totalKg = computed(() =>
  materiaisColetados.value.reduce((s, m) => s + m.totalKg, 0)
)

function barWidth(kg: number) {
  const max = Math.max(...materiaisColetados.value.map((m: any) => m.totalKg), 1)
  return (kg / max) * 100
}

function matPercent(kg: number) {
  const total = totalKg.value
  if (!total) return '0'
  return ((kg / total) * 100).toFixed(0)
}

function calcTrend(atual: number, anterior: number): number | null {
  if (!anterior || anterior === 0) return null
  return Math.round(((atual - anterior) / anterior) * 100)
}

const tendencias = computed(() => ({
  reciclado: calcTrend(resumo.value.totalRecicladoKg ?? 0, resumoMesAnterior.value.totalRecicladoKg ?? 0),
  coletas:   calcTrend(resumo.value.coletasRegistradas ?? 0, resumoMesAnterior.value.coletasRegistradas ?? 0),
  media:     calcTrend(resumo.value.mediaPorApartamento ?? 0, resumoMesAnterior.value.mediaPorApartamento ?? 0),
}))

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/metrics')
    resumo.value = data.resumo ?? {}
    resumoMesAnterior.value = data.resumoMesAnterior ?? {}
    materiaisColetados.value = (data.materiaisColetados ?? []).map((m: any) => ({
      ...m,
      color: MATERIAL_COLORS[m.nome] ?? '#7ED321'
    }))
    novaMeta.value = resumo.value.metaDoMes?.metaKg ?? 500
  } catch {
    error.value = 'Erro ao carregar métricas. Verifique a conexão com a API.'
  } finally {
    loading.value = false
  }
})

async function salvarMeta() {
  metaLoading.value = true
  metaError.value = ''
  try {
    await api.patch('/dashboard/meta', { metaKg: novaMeta.value })
    if (resumo.value.metaDoMes) resumo.value.metaDoMes.metaKg = novaMeta.value
    showEditMeta.value = false
    toast.success(`🎯 Meta atualizada para ${novaMeta.value} kg`)
  } catch (err: any) {
    metaError.value = err.response?.data?.message ?? 'Erro ao salvar a meta.'
  } finally {
    metaLoading.value = false
  }
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 600; color: var(--color-white); }
.page-date { font-size: 14px; }

.error-state { color: var(--color-amber); padding: 40px 0; text-align: center; }

/* KPI Skeleton */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.kpi-skeleton {
  height: 130px; border-radius: var(--radius-xl);
  background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-2) 50%, var(--color-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* KPI Cards */
.kpi-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.2s;
}
.kpi-card:hover { transform: translateY(-2px); }
.kpi-icon { margin-bottom: 4px; }
.kpi-label { font-size: 13px; color: var(--color-emerald-100); }
.kpi-value { font-size: 28px; font-weight: 600; color: var(--color-white); line-height: 1; }
.kpi-total { font-size: 18px; color: var(--color-emerald-100); font-weight: 400; }
.kpi-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 2px;
  flex-wrap: wrap;
}
.kpi-trend.positive { color: var(--color-lime); }
.kpi-trend.negative { color: #f87171; }
.kpi-trend.neutral  { color: var(--color-emerald-100); font-weight: 400; }
.trend-sub { font-weight: 400; color: #4a6a6a; font-size: 11px; }

/* Materiais */
.card { background: var(--color-surface); border-radius: var(--radius-xl); padding: 24px; margin-bottom: 24px; }
.card-title { font-size: 18px; font-weight: 500; color: var(--color-white); margin-bottom: 20px; }
.materiais-list { display: flex; flex-direction: column; gap: 16px; }
.material-row { display: flex; flex-direction: column; gap: 8px; }
.material-meta { display: flex; justify-content: space-between; align-items: center; }
.material-nome { font-size: 14px; color: var(--color-emerald-100); }
.material-values { display: flex; align-items: center; gap: 10px; }
.material-pct { font-size: 12px; }
.material-kg { font-size: 15px; font-weight: 600; }
.material-bar-bg { width: 100%; height: 8px; background: var(--color-bg); border-radius: 100px; overflow: hidden; }
.material-bar-fill { height: 8px; border-radius: 100px; transition: width 0.8s ease; }

/* Bottom Row */
.bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.meta-card {
  background: var(--color-lime-10);
  border: 1px solid var(--color-lime-30);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.3s;
}
.meta-card.meta-achieved {
  background: rgba(125,211,33,0.1);
  border-color: var(--color-lime);
  box-shadow: 0 0 20px rgba(125,211,33,0.15);
}
.meta-header { display: flex; justify-content: space-between; align-items: center; }
.meta-title { font-size: 16px; font-weight: 600; }
.btn-edit-meta {
  display: flex; align-items: center; gap: 5px;
  background: none; border: 1px solid var(--color-lime-30);
  color: var(--color-lime); font-size: 12px; padding: 4px 10px;
  border-radius: 100px; cursor: pointer; transition: background 0.2s;
}
.btn-edit-meta:hover { background: var(--color-lime-10); }
.meta-sub { font-size: 14px; }
.progress-bg { width: 100%; height: 8px; background: var(--color-bg); border-radius: 100px; overflow: hidden; }
.progress-fill { height: 8px; background: var(--color-lime); border-radius: 100px; transition: width 0.8s ease; }
.progress-fill.achieved {
  background: linear-gradient(90deg, var(--color-lime), #a8e063);
  animation: shimmer-fill 2s infinite;
}
@keyframes shimmer-fill {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
.meta-celebration { font-size: 13px; color: var(--color-lime); font-weight: 500; }

.inativos-card {
  background: var(--color-amber-10);
  border: 1px solid var(--color-amber-30);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.btn-ver-inativos {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background: var(--color-amber-10);
  color: var(--color-amber);
  border: 1px solid var(--color-amber-30);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s;
  align-self: flex-start;
  margin-top: 4px;
}
.btn-ver-inativos:hover { background: rgba(255,149,0,0.15); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-box { background: var(--color-surface); border: 1px solid var(--color-surface-2); border-radius: var(--radius-xl); width: 100%; max-width: 440px; padding: 32px; animation: fadeUp 0.2s ease; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-header h2 { font-size: 18px; font-weight: 600; color: var(--color-white); }
.btn-close { background: none; color: var(--color-emerald-100); font-size: 18px; cursor: pointer; }
.modal-form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: var(--color-emerald-100); }
.hint { font-size: 12px; color: #4a6a6a; }
.field input { background: var(--color-bg); border: 1px solid var(--color-surface-2); border-radius: var(--radius-sm); padding: 10px 14px; color: var(--color-white); font-size: 14px; outline: none; }
.field input:focus { border-color: var(--color-lime); }
.error-msg { font-size: 13px; color: var(--color-amber); background: var(--color-amber-10); border: 1px solid var(--color-amber-30); border-radius: var(--radius-sm); padding: 10px 14px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
.btn-cancel { padding: 10px 16px; background: var(--color-surface-2); color: var(--color-emerald-100); border-radius: var(--radius-sm); font-size: 14px; cursor: pointer; }
.btn-submit { padding: 10px 16px; background: var(--color-lime); color: #0a1a0a; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .bottom-row { grid-template-columns: 1fr; }
}
</style>
