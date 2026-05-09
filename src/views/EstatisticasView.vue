<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Estatísticas do Condomínio</h1>
      <span class="page-date text-muted">Últimos 3 meses</span>
    </div>

    <div v-if="loading" class="loading">Carregando estatísticas...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <template v-else>
      <!-- Evolução Mensal - Line Chart -->
      <div class="card mb-24">
        <h2 class="card-title">Evolução Mensal (kg)</h2>
        <div class="chart-area">
          <LineChart :data="lineData" :options="lineOptions" />
        </div>
        <div class="legend">
          <span v-for="(label, i) in lineLabels" :key="label" class="legend-item">
            <span class="legend-dot" :style="{ background: lineColors[i] }"></span>{{ label }}
          </span>
        </div>
      </div>

      <!-- Bar + Pie -->
      <div class="charts-row">
        <div class="card">
          <h2 class="card-title">Comparativo por Mês</h2>
          <div class="chart-area">
            <BarChart :data="barData" :options="barOptions" />
          </div>
        </div>
        <div class="card">
          <h2 class="card-title">Distribuição por Material</h2>
          <div class="chart-area chart-pie">
            <DoughnutChart :data="pieData" :options="pieOptions" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
const error = ref('')
const historico = ref<any[]>([])

const lineLabels = ['Plástico', 'Papel', 'Vidro', 'Metal', 'Orgânico']
const lineColors = ['#3B82F6', '#8B5CF6', '#10B981', '#FF9500', '#7ED321']

const MATERIAL_MAP: Record<string, string> = {
  'Plástico': 'Plástico',
  'Papel / Papelão': 'Papel',
  'Vidro': 'Vidro',
  'Metal / Alumínio': 'Metal',
  'Orgânico': 'Orgânico',
}

// Build monthly buckets from historico
const meses = computed(() => {
  const buckets: Record<string, Record<string, number>> = {}
  historico.value.forEach(item => {
    const d = new Date(item.dataColeta)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!buckets[key]) buckets[key] = {}
    const cat = MATERIAL_MAP[item.categoriaMaterial?.nome] ?? 'Outro'
    buckets[key][cat] = (buckets[key][cat] ?? 0) + Number(item.pesoKg)
  })
  return buckets
})

const mesesKeys = computed(() => Object.keys(meses.value).sort().slice(-3))
const mesesLabels = computed(() => mesesKeys.value.map(k => {
  const [yr, mo] = k.split('-')
  return new Date(Number(yr), Number(mo) - 1).toLocaleString('pt-BR', { month: 'short' })
    .replace(/^\w/, c => c.toUpperCase())
}))

const lineData = computed(() => ({
  labels: mesesLabels.value,
  datasets: lineLabels.map((label, i) => ({
    label,
    data: mesesKeys.value.map(k => meses.value[k]?.[label] ?? 0),
    borderColor: lineColors[i],
    backgroundColor: lineColors[i] + '22',
    tension: 0.3,
    fill: false,
    pointRadius: 4,
    pointBackgroundColor: lineColors[i],
  }))
}))

const barData = computed(() => ({
  labels: mesesLabels.value,
  datasets: [{
    label: 'Total (kg)',
    data: mesesKeys.value.map(k => Object.values(meses.value[k] ?? {}).reduce((a, b) => a + b, 0)),
    backgroundColor: lineColors,
    borderRadius: 6,
  }]
}))

const pieData = computed(() => {
  const totals: Record<string, number> = {}
  historico.value.forEach(item => {
    const cat = MATERIAL_MAP[item.categoriaMaterial?.nome] ?? 'Outro'
    totals[cat] = (totals[cat] ?? 0) + Number(item.pesoKg)
  })
  return {
    labels: Object.keys(totals),
    datasets: [{
      data: Object.values(totals),
      backgroundColor: Object.keys(totals).map(k => lineColors[lineLabels.indexOf(k)] ?? '#7ED321'),
      borderColor: '#1A3A3A',
      borderWidth: 2,
    }]
  }
})

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#D4F4DD' }, grid: { color: '#2A4A4A' } },
    y: { ticks: { color: '#D4F4DD' }, grid: { color: '#2A4A4A' } }
  }
}
const lineOptions = { ...chartDefaults }
const barOptions  = { ...chartDefaults }
const pieOptions  = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: true } }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/historico')
    historico.value = data
  } catch {
    error.value = 'Erro ao carregar estatísticas.'
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
.page-title { font-size: 24px; font-weight: 600; color: var(--color-white); }
.page-date { font-size: 14px; }

.loading, .error-state { text-align: center; padding: 60px 0; color: var(--color-emerald-100); }
.error-state { color: var(--color-amber); }

.mb-24 { margin-bottom: 24px; }

.card { background: var(--color-surface); border-radius: var(--radius-xl); padding: 24px; }
.card-title { font-size: 18px; font-weight: 500; color: var(--color-white); margin-bottom: 16px; }

.chart-area { height: 260px; }
.chart-pie   { height: 200px; }

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-top: 12px;
  justify-content: center;
}
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-emerald-100); }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .charts-row { grid-template-columns: 1fr; }
}
</style>
