<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Estatísticas do Condomínio</h1>
      <div class="header-controls">
        <select v-model="periodo" class="period-select">
          <option value="3">Últimos 3 meses</option>
          <option value="6">Últimos 6 meses</option>
          <option value="12">Último ano</option>
        </select>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="charts-skeleton">
      <div class="skel-big"></div>
      <div class="charts-row">
        <div class="skel-small"></div>
        <div class="skel-small"></div>
      </div>
    </div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <template v-else>
      <!-- Evolução Mensal -->
      <div class="card mb-24">
        <div class="card-header">
          <h2 class="card-title">Evolução Mensal por Material (kg)</h2>
          <span class="card-hint text-muted">Clique na legenda para ocultar/mostrar materiais</span>
        </div>
        <div class="chart-area">
          <LineChart :data="lineData" :options="lineOptions" />
        </div>
        <div class="legend">
          <span
            v-for="(label, i) in lineLabels"
            :key="label"
            class="legend-item"
            :class="{ hidden: hiddenDatasets.includes(i) }"
            @click="toggleDataset(i)"
          >
            <span class="legend-dot" :style="{ background: lineColors[i] }"></span>{{ label }}
          </span>
        </div>
      </div>

      <!-- Bar + Pie -->
      <div class="charts-row">
        <div class="card">
          <h2 class="card-title">Total por Mês (kg)</h2>
          <div class="chart-area">
            <BarChart :data="barData" :options="barOptions" />
          </div>
        </div>
        <div class="card">
          <h2 class="card-title">Distribuição por Material</h2>
          <div class="chart-area chart-pie">
            <DoughnutChart :data="pieData" :options="pieOptions" />
          </div>
          <!-- Legenda do pie com valores -->
          <div class="pie-legend">
            <div v-for="(label, i) in pieData.labels" :key="label" class="pie-legend-item">
              <span class="legend-dot" :style="{ background: pieColors[i] }"></span>
              <span class="pie-label">{{ label }}</span>
              <span class="pie-value text-lime">{{ pieTotals[i]?.toFixed(1) }} kg</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line as LineChart, Bar as BarChart, Doughnut as DoughnutChart } from 'vue-chartjs'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
)

const loading = ref(true)
const error   = ref('')
const historico = ref<any[]>([])
const periodo = ref('3')
const hiddenDatasets = ref<number[]>([])

const lineLabels = ['Plástico', 'Papel', 'Vidro', 'Metal', 'Orgânico']
const lineColors = ['#3B82F6', '#8B5CF6', '#10B981', '#FF9500', '#7ED321']
const pieColors  = [...lineColors]

const MATERIAL_MAP: Record<string, string> = {
  'Plástico': 'Plástico', 'Papel / Papelão': 'Papel',
  'Vidro': 'Vidro', 'Metal / Alumínio': 'Metal', 'Orgânico': 'Orgânico',
}

function toggleDataset(i: number) {
  const idx = hiddenDatasets.value.indexOf(i)
  if (idx === -1) hiddenDatasets.value.push(i)
  else            hiddenDatasets.value.splice(idx, 1)
}

const meses = computed(() => {
  const buckets: Record<string, Record<string, number>> = {}
  historico.value.forEach(item => {
    const d   = new Date(item.dataColeta)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!buckets[key]) buckets[key] = {}
    const cat = MATERIAL_MAP[item.categoriaMaterial?.nome] ?? 'Outro'
    buckets[key][cat] = (buckets[key][cat] ?? 0) + Number(item.pesoKg)
  })
  return buckets
})

const mesesKeys   = computed(() => Object.keys(meses.value).sort().slice(-Number(periodo.value)))
const mesesLabels = computed(() => mesesKeys.value.map(k => {
  const [yr, mo] = k.split('-')
  return new Date(Number(yr), Number(mo) - 1).toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
    .replace(/^\w/, c => c.toUpperCase())
}))

const lineData = computed(() => ({
  labels: mesesLabels.value,
  datasets: lineLabels.map((label, i) => ({
    label,
    data: mesesKeys.value.map(k => meses.value[k]?.[label] ?? 0),
    borderColor: lineColors[i],
    backgroundColor: lineColors[i] + '18',
    tension: 0.4,
    fill: false,
    pointRadius: 5,
    pointBackgroundColor: lineColors[i],
    hidden: hiddenDatasets.value.includes(i),
  }))
}))

const barData = computed(() => ({
  labels: mesesLabels.value,
  datasets: [{
    label: 'Total (kg)',
    data: mesesKeys.value.map(k => Object.values(meses.value[k] ?? {}).reduce((a, b) => a + b, 0)),
    backgroundColor: lineColors[0] + 'cc',
    borderColor: lineColors[0],
    borderWidth: 1,
    borderRadius: 6,
  }]
}))

const pieTotals = computed(() => {
  const totals: Record<string, number> = {}
  historico.value.forEach(item => {
    const cat = MATERIAL_MAP[item.categoriaMaterial?.nome] ?? 'Outro'
    totals[cat] = (totals[cat] ?? 0) + Number(item.pesoKg)
  })
  return lineLabels.map(l => totals[l] ?? 0)
})

const pieData = computed(() => ({
  labels: lineLabels,
  datasets: [{
    data: pieTotals.value,
    backgroundColor: pieColors,
    borderColor: '#1A3A3A',
    borderWidth: 2,
  }]
}))

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index' as const, intersect: false }
  },
  scales: {
    x: { ticks: { color: '#D4F4DD' }, grid: { color: '#1e3a3a' } },
    y: { ticks: { color: '#D4F4DD' }, grid: { color: '#1e3a3a' }, beginAtZero: true }
  }
}
const lineOptions = { ...chartDefaults }
const barOptions  = { ...chartDefaults }
const pieOptions  = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: true } }
}

async function carregar() {
  loading.value = true
  error.value   = ''
  try {
    const { data } = await api.get('/dashboard/historico')
    historico.value = data
  } catch {
    error.value = 'Erro ao carregar estatísticas.'
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
watch(periodo, () => { hiddenDatasets.value = [] })
</script>

<style scoped>
.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
}
.page-title { font-size: 24px; font-weight: 600; color: var(--color-white); }
.period-select {
  background: var(--color-surface); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm); padding: 9px 14px;
  color: var(--color-white); font-size: 14px; outline: none; cursor: pointer;
}
.period-select option { background: var(--color-bg); }

/* Skeleton */
.charts-skeleton { display: flex; flex-direction: column; gap: 16px; }
.skel-big {
  height: 360px; border-radius: var(--radius-xl);
  background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-2) 50%, var(--color-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.skel-small {
  flex: 1; height: 280px; border-radius: var(--radius-xl);
  background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-2) 50%, var(--color-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.error-state { text-align: center; padding: 60px 0; color: var(--color-amber); }
.mb-24 { margin-bottom: 24px; }
.card { background: var(--color-surface); border-radius: var(--radius-xl); padding: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.card-title { font-size: 18px; font-weight: 500; color: var(--color-white); }
.card-hint { font-size: 12px; }
.chart-area { height: 260px; }
.chart-pie  { height: 200px; }

/* Legend interativa */
.legend {
  display: flex; flex-wrap: wrap; gap: 10px 18px;
  margin-top: 14px; justify-content: center;
}
.legend-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--color-emerald-100);
  cursor: pointer; transition: opacity 0.2s; user-select: none;
  padding: 4px 8px; border-radius: 6px;
}
.legend-item:hover { background: var(--color-surface-2); }
.legend-item.hidden { opacity: 0.35; text-decoration: line-through; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

/* Pie legend com valores */
.pie-legend { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.pie-legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.pie-label { flex: 1; color: var(--color-emerald-100); }
.pie-value { font-weight: 600; font-size: 12px; }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

@media (max-width: 900px) {
  .charts-row { grid-template-columns: 1fr; }
}
</style>
