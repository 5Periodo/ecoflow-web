<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Gestão de Apartamentos</h1>
      <div class="page-badge text-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        {{ apartamentos.length }} unidades
      </div>
    </div>

    <div v-if="loading" class="loading">Carregando apartamentos...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <template v-else>
      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card lime-card">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div class="kpi-num">{{ ativos }}</div>
          <div class="kpi-lbl">Apartamentos Ativos</div>
        </div>
        <div class="kpi-card amber-card">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div class="kpi-num">{{ inativos }}</div>
          <div class="kpi-lbl">Apartamentos Inativos</div>
        </div>
        <div class="kpi-card blue-card">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          </svg>
          <div class="kpi-num">{{ totalColetas }}</div>
          <div class="kpi-lbl">Total de Coletas</div>
        </div>
        <div class="kpi-card violet-card">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          </svg>
          <div class="kpi-num">{{ mediaColetas.toFixed(1) }}</div>
          <div class="kpi-lbl">Média por Apto Ativo</div>
        </div>
      </div>

      <!-- Tabela -->
      <div class="card">
        <h2 class="card-title">Todos os Apartamentos</h2>
        <p class="card-sub text-muted">Visão completa do condomínio</p>

        <div class="table-wrap">
          <table class="apto-table">
            <thead>
              <tr>
                <th>Apto</th>
                <th>Morador</th>
                <th>Coletas</th>
                <th>Total (kg)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ap in apartamentos" :key="ap.id">
                <td class="td-apto">{{ ap.numero }}<span v-if="ap.bloco" class="td-bloco"> / {{ ap.bloco }}</span></td>
                <td>
                  <div class="td-morador">{{ ap.moradorNome }}</div>
                </td>
                <td>{{ ap.totalColetas }}</td>
                <td :class="ap.totalKg > 0 ? 'text-lime' : 'text-muted'">{{ ap.totalKg.toFixed(1) }} kg</td>
                <td>
                  <span class="badge" :class="ap.status === 'Ativo' ? 'badge-ativo' : 'badge-inativo'">
                    {{ ap.status === 'Ativo' ? '✓' : '!' }} {{ ap.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
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
const apartamentos = ref<any[]>([])

const ativos = computed(() => apartamentos.value.filter(a => a.status === 'Ativo').length)
const inativos = computed(() => apartamentos.value.filter(a => a.status !== 'Ativo').length)
const totalColetas = computed(() => apartamentos.value.reduce((s, a) => s + a.totalColetas, 0))
const mediaColetas = computed(() => ativos.value > 0 ? totalColetas.value / ativos.value : 0)

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/apartamentos')
    apartamentos.value = data
  } catch {
    error.value = 'Erro ao carregar apartamentos.'
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
.page-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.loading, .error-state { text-align: center; padding: 60px 0; color: var(--color-emerald-100); }
.error-state { color: var(--color-amber); }

/* KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.kpi-card {
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid;
}
.kpi-num { font-size: 32px; font-weight: 600; color: var(--color-white); }
.kpi-lbl { font-size: 13px; color: var(--color-emerald-100); }

.lime-card   { background: var(--color-lime-10); border-color: var(--color-lime-30); color: var(--color-lime); }
.amber-card  { background: var(--color-amber-10); border-color: var(--color-amber-30); color: var(--color-amber); }
.blue-card   { background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.3); color: var(--color-blue); }
.violet-card { background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.3); color: var(--color-violet); }

/* Table */
.card { background: var(--color-surface); border-radius: var(--radius-xl); padding: 24px; }
.card-title { font-size: 18px; font-weight: 500; color: var(--color-white); margin-bottom: 4px; }
.card-sub { font-size: 13px; margin-bottom: 20px; }

.table-wrap { overflow-x: auto; }
.apto-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.apto-table th {
  text-align: left;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-emerald-100);
  border-bottom: 1px solid var(--color-surface-2);
}
.apto-table td {
  padding: 14px 16px;
  color: var(--color-white);
  border-bottom: 1px solid var(--color-surface-2);
}
.apto-table tr:last-child td { border-bottom: none; }
.apto-table tr:hover td { background: var(--color-surface-2); }

.td-apto { font-weight: 600; font-size: 15px; }
.td-bloco { font-weight: 400; font-size: 13px; color: var(--color-emerald-100); }
.td-morador { font-size: 14px; }

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 500;
}
.badge-ativo  { background: var(--color-lime-10); color: var(--color-lime); border: 1px solid var(--color-lime-30); }
.badge-inativo { background: var(--color-amber-10); color: var(--color-amber); border: 1px solid var(--color-amber-30); }

@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
