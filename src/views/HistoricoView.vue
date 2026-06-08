<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Histórico de Coletas</h1>
      <div class="header-badges">
        <div class="total-badge">
          Total exibido: <span class="text-lime">{{ totalKgFiltrado.toFixed(1) }} kg</span>
        </div>
        <div class="total-badge">
          {{ filtered.length }} registro{{ filtered.length !== 1 ? 's' : '' }}
        </div>
      </div>
    </div>

    <!-- Filtros avançados -->
    <div class="filters-bar">
      <div class="filter-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="filtro" type="text" placeholder="Buscar morador ou apartamento..." />
      </div>
      <select v-model="filtroMaterial" class="filter-select">
        <option value="">Todos os materiais</option>
        <option v-for="m in materiaisDisponiveis" :key="m" :value="m">{{ m }}</option>
      </select>
      <select v-model="filtroApartamento" class="filter-select">
        <option value="">Todos os aptos</option>
        <option v-for="a in apartamentosDisponiveis" :key="a" :value="a">Apto {{ a }}</option>
      </select>
      <select v-model="ordenacao" class="filter-select">
        <option value="data-desc">Mais recente</option>
        <option value="data-asc">Mais antigo</option>
        <option value="peso-desc">Maior peso</option>
        <option value="peso-asc">Menor peso</option>
      </select>
      <button v-if="filtro || filtroMaterial || filtroApartamento" class="btn-clear-filter"
        @click="filtro=''; filtroMaterial=''; filtroApartamento=''">
        ✕ Limpar
      </button>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="hist-skeleton">
      <div v-for="n in 8" :key="n" class="skeleton-row"></div>
    </div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else>
      <div v-if="filtered.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Nenhum registro encontrado</h3>
        <p>Tente ajustar os filtros acima.</p>
      </div>

      <div v-else class="historico-list">
        <div v-for="item in paginados" :key="item.id" class="hist-card">
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
            <div class="hist-morador">
              {{ item.apartamento?.moradores?.[0]?.nome || item.morador?.nome || 'Morador não identificado' }}
            </div>
            <div class="hist-meta">
              <span>📅 {{ formatDate(item.dataColeta) }}</span>
            </div>
            <div v-if="item.observacoes" class="hist-obs">{{ item.observacoes }}</div>
          </div>
        </div>
      </div>

      <!-- Paginação -->
      <div v-if="totalPaginas > 1" class="paginacao">
        <button class="pag-btn" :disabled="pagina === 1" @click="pagina--">← Anterior</button>
        <div class="pag-pages">
          <button
            v-for="p in paginasVisiveis"
            :key="p"
            class="pag-num"
            :class="{ active: p === pagina, ellipsis: p === '...' }"
            :disabled="p === '...'"
            @click="typeof p === 'number' && (pagina = p)"
          >{{ p }}</button>
        </div>
        <button class="pag-btn" :disabled="pagina === totalPaginas" @click="pagina++">Próxima →</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'

const loading = ref(true)
const error   = ref('')
const historico = ref<any[]>([])
const filtro    = ref('')
const filtroMaterial    = ref('')
const filtroApartamento = ref('')
const ordenacao = ref('data-desc')

const POR_PAGINA = 20
const pagina = ref(1)

// Resetar paginação ao filtrar
watch([filtro, filtroMaterial, filtroApartamento, ordenacao], () => { pagina.value = 1 })

const COLORS: Record<string, string> = {
  'Plástico': '#3B82F6', 'Papel / Papelão': '#8B5CF6',
  'Vidro': '#10B981', 'Metal / Alumínio': '#FF9500', 'Orgânico': '#7ED321',
}
const EMOJIS: Record<string, string> = {
  'Plástico': '♻️', 'Papel / Papelão': '📄', 'Vidro': '🍶', 'Metal / Alumínio': '🔧', 'Orgânico': '🌱'
}
function materialColor(nome: string) { return COLORS[nome] ?? '#7ED321' }
function materialEmoji(nome: string) { return EMOJIS[nome] ?? '♻️' }
function materialBg(nome: string)    { return (COLORS[nome] ?? '#7ED321') + '22' }

const materiaisDisponiveis   = computed(() => [...new Set(historico.value.map(i => i.categoriaMaterial?.nome).filter(Boolean))])
const apartamentosDisponiveis = computed(() => [...new Set(historico.value.map(i => i.apartamento?.numero).filter(Boolean))].sort())

const filtered = computed(() => {
  let list = [...historico.value]

  if (filtro.value) {
    const q = filtro.value.toLowerCase()
    list = list.filter(i =>
      i.categoriaMaterial?.nome?.toLowerCase().includes(q) ||
      String(i.apartamento?.numero)?.toLowerCase().includes(q) ||
      i.apartamento?.moradores?.[0]?.nome?.toLowerCase().includes(q) ||
      i.morador?.nome?.toLowerCase().includes(q) ||
      i.observacoes?.toLowerCase().includes(q)
    )
  }
  if (filtroMaterial.value)    list = list.filter(i => i.categoriaMaterial?.nome === filtroMaterial.value)
  if (filtroApartamento.value) list = list.filter(i => String(i.apartamento?.numero) === String(filtroApartamento.value))

  list.sort((a, b) => {
    switch (ordenacao.value) {
      case 'data-desc': return new Date(b.dataColeta).getTime() - new Date(a.dataColeta).getTime()
      case 'data-asc':  return new Date(a.dataColeta).getTime() - new Date(b.dataColeta).getTime()
      case 'peso-desc': return Number(b.pesoKg) - Number(a.pesoKg)
      case 'peso-asc':  return Number(a.pesoKg) - Number(b.pesoKg)
      default: return 0
    }
  })
  return list
})

const totalKgFiltrado = computed(() => filtered.value.reduce((s, i) => s + Number(i.pesoKg), 0))
const totalPaginas    = computed(() => Math.ceil(filtered.value.length / POR_PAGINA))
const paginados       = computed(() => {
  const start = (pagina.value - 1) * POR_PAGINA
  return filtered.value.slice(start, start + POR_PAGINA)
})

const paginasVisiveis = computed(() => {
  const total = totalPaginas.value
  const cur = pagina.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (cur > 3) pages.push('...')
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
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
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
}
.page-title { font-size: 24px; font-weight: 600; color: var(--color-white); }
.header-badges { display: flex; gap: 10px; flex-wrap: wrap; }
.total-badge {
  background: var(--color-surface); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm); padding: 7px 14px; font-size: 13px; color: var(--color-white);
}
.text-lime { color: var(--color-lime); }

/* Filters */
.filters-bar {
  display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;
}
.filter-search {
  display: flex; align-items: center; gap: 8px;
  background: var(--color-surface); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm); padding: 9px 14px;
  color: var(--color-emerald-100); flex: 1; min-width: 200px;
}
.filter-search input {
  background: none; border: none; outline: none;
  color: var(--color-white); font-size: 14px; width: 100%;
}
.filter-search input::placeholder { color: #4a6a6a; }
.filter-select {
  background: var(--color-surface); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm); padding: 9px 14px;
  color: var(--color-emerald-100); font-size: 13px; outline: none; cursor: pointer;
}
.filter-select option { background: var(--color-bg); }
.btn-clear-filter {
  padding: 8px 14px; border-radius: var(--radius-sm);
  background: rgba(239,68,68,0.1); color: #f87171;
  border: 1px solid rgba(239,68,68,0.2); font-size: 13px; cursor: pointer;
}
.btn-clear-filter:hover { background: rgba(239,68,68,0.2); }

/* Skeleton */
.hist-skeleton { display: flex; flex-direction: column; gap: 8px; }
.skeleton-row {
  height: 88px; border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-2) 50%, var(--color-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.error-state { text-align: center; padding: 60px 0; color: var(--color-amber); }

/* Empty state */
.empty-state {
  text-align: center; padding: 60px 24px; background: var(--color-surface);
  border-radius: var(--radius-xl); display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.empty-icon { font-size: 48px; }
.empty-state h3 { font-size: 20px; font-weight: 600; color: var(--color-white); margin: 0; }
.empty-state p  { font-size: 14px; color: var(--color-emerald-100); margin: 0; }

/* List */
.historico-list { display: flex; flex-direction: column; gap: 8px; }
.hist-card {
  background: var(--color-surface); border-radius: var(--radius-lg);
  padding: 16px 20px; display: flex; gap: 16px; align-items: flex-start;
  transition: background 0.15s;
}
.hist-card:hover { background: var(--color-surface-2); }
.hist-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.hist-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.hist-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.hist-categoria { font-size: 15px; font-weight: 500; color: var(--color-white); }
.hist-dot { color: var(--color-surface-2); }
.hist-apto { font-size: 14px; }
.hist-kg { font-size: 14px; font-weight: 600; white-space: nowrap; }
.hist-morador { font-size: 13px; color: var(--color-white); }
.hist-meta { display: flex; gap: 12px; font-size: 12px; color: var(--color-emerald-100); }
.hist-obs { font-size: 12px; color: #5a8a8a; font-style: italic; }

/* Paginação */
.paginacao {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  margin-top: 24px; flex-wrap: wrap;
}
.pag-btn {
  padding: 8px 16px; border-radius: var(--radius-sm);
  background: var(--color-surface); border: 1px solid var(--color-surface-2);
  color: var(--color-emerald-100); font-size: 13px; cursor: pointer; transition: all 0.2s;
}
.pag-btn:hover:not(:disabled) { background: var(--color-surface-2); color: var(--color-white); }
.pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pag-pages { display: flex; gap: 4px; }
.pag-num {
  width: 36px; height: 36px; border-radius: 8px;
  background: var(--color-surface); border: 1px solid var(--color-surface-2);
  color: var(--color-emerald-100); font-size: 13px; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.pag-num:hover:not(:disabled):not(.ellipsis) { background: var(--color-surface-2); }
.pag-num.active { background: var(--color-lime-10); color: var(--color-lime); border-color: var(--color-lime-30); font-weight: 700; }
.pag-num.ellipsis { cursor: default; border: none; background: none; }
</style>
