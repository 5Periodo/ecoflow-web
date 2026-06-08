<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Ranking do Condomínio</h1>
      <span class="page-date text-muted">{{ mesLabel }}</span>
    </div>

    <div v-if="loading" class="podio-skeleton">
      <div v-for="n in 3" :key="n" class="skel-podio"></div>
    </div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <template v-else>
      <!-- Pódio Top 3 -->
      <div class="podio" v-if="ranking.length >= 3">
        <!-- 2º -->
        <div class="podio-card second">
          <svg class="trophy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
          </svg>
          <div class="podio-pos silver">2°</div>
          <div class="podio-nome">{{ ranking[1]?.apartamentoNumero ? `Apto ${ranking[1].apartamentoNumero}` : '–' }}</div>
          <div class="podio-morador">{{ ranking[1]?.moradorNome }}</div>
          <div class="podio-kg text-lime">{{ Number(ranking[1]?.totalKg).toFixed(1) }} kg</div>
          <div class="podio-coletas text-muted">{{ ranking[1]?.coletas }} coleta{{ ranking[1]?.coletas !== 1 ? 's' : '' }}</div>
        </div>

        <!-- 1º -->
        <div class="podio-card first">
          <svg class="trophy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
          </svg>
          <div class="podio-pos gold">1°</div>
          <div class="podio-nome">{{ ranking[0]?.apartamentoNumero ? `Apto ${ranking[0].apartamentoNumero}` : '–' }}</div>
          <div class="podio-morador">{{ ranking[0]?.moradorNome }}</div>
          <div class="podio-kg" style="color: var(--color-amber)">{{ Number(ranking[0]?.totalKg).toFixed(1) }} kg</div>
          <div class="podio-coletas text-muted">{{ ranking[0]?.coletas }} coleta{{ ranking[0]?.coletas !== 1 ? 's' : '' }}</div>
        </div>

        <!-- 3º -->
        <div class="podio-card third">
          <svg class="trophy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
          </svg>
          <div class="podio-pos bronze">3°</div>
          <div class="podio-nome">{{ ranking[2]?.apartamentoNumero ? `Apto ${ranking[2].apartamentoNumero}` : '–' }}</div>
          <div class="podio-morador">{{ ranking[2]?.moradorNome }}</div>
          <div class="podio-kg text-lime">{{ Number(ranking[2]?.totalKg).toFixed(1) }} kg</div>
          <div class="podio-coletas text-muted">{{ ranking[2]?.coletas }} coleta{{ ranking[2]?.coletas !== 1 ? 's' : '' }}</div>
        </div>
      </div>

      <!-- Tabela Completa -->
      <div class="card">
        <h2 class="card-title">Classificação Completa</h2>
        <p class="card-sub text-muted">Ranking baseado no total de materiais reciclados este mês (em kg)</p>
        <div class="rank-list">
          <div v-if="ranking.length === 0" class="rank-empty">
            <span>Nenhuma coleta registrada este mês.</span>
          </div>
          <div v-for="item in ranking" :key="item.posicao" class="rank-item">
            <div class="rank-pos-wrap">
              <svg v-if="item.posicao === 1" class="trophy-sm gold-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
              </svg>
              <svg v-else-if="item.posicao === 2" class="trophy-sm silver-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
              </svg>
              <svg v-else-if="item.posicao === 3" class="trophy-sm bronze-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
              </svg>
              <span v-else class="rank-num">{{ item.posicao }}</span>
            </div>
            <div class="rank-info">
              <div class="rank-nome">
                {{ item.moradorNome }}
                <span class="rank-apto text-muted"> · Apto {{ item.apartamentoNumero }}</span>
              </div>
              <div class="rank-detail text-lime">{{ item.coletas }} coleta{{ item.coletas !== 1 ? 's' : '' }} · {{ Number(item.totalKg).toFixed(1) }} kg total</div>
            </div>
            <!-- Barra de progresso relativa -->
            <div class="rank-bar-wrap">
              <div class="rank-bar" :style="{ width: rankBarWidth(item.totalKg) + '%' }"></div>
            </div>
            <div class="rank-kg">{{ Number(item.totalKg).toFixed(1) }} kg</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const loading = ref(true)
const error   = ref('')
const ranking = ref<any[]>([])

const mesLabel = computed(() =>
  new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
)

const maxKg = computed(() => Math.max(...ranking.value.map(r => Number(r.totalKg)), 1))
function rankBarWidth(kg: number) { return (Number(kg) / maxKg.value) * 100 }

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/metrics')
    ranking.value = data.rankingMensal ?? []
  } catch {
    error.value = 'Erro ao carregar ranking.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 24px; font-weight: 600; color: var(--color-white); }
.page-date { font-size: 14px; }

/* Skeleton */
.podio-skeleton { display: grid; grid-template-columns: 1fr 1.15fr 1fr; gap: 16px; margin-bottom: 24px; }
.skel-podio {
  height: 200px; border-radius: var(--radius-xl);
  background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-2) 50%, var(--color-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.error-state { text-align: center; padding: 60px 0; color: var(--color-amber); }

/* Pódio */
.podio {
  display: grid;
  grid-template-columns: 1fr 1.15fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
  align-items: end;
}
.podio-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  transition: transform 0.2s;
}
.podio-card:hover { transform: translateY(-3px); }
.podio-card.first { border: 1px solid var(--color-amber); background: rgba(255,149,0,0.05); }
.podio-card.second, .podio-card.third { border: 1px solid var(--color-surface-2); }

.trophy-icon { width: 40px; height: 40px; }
.podio-card.first .trophy-icon  { color: var(--color-amber); width: 52px; height: 52px; }
.podio-card.second .trophy-icon { color: #9ea9b5; }
.podio-card.third .trophy-icon  { color: #b87333; }

.podio-pos  { font-size: 22px; font-weight: 700; }
.gold   { color: var(--color-amber); }
.silver { color: #9ea9b5; }
.bronze { color: #b87333; }

.podio-nome    { font-size: 16px; font-weight: 600; color: var(--color-white); }
.podio-morador { font-size: 13px; color: var(--color-emerald-100); }
.podio-kg {
  background: var(--color-surface-2); border-radius: var(--radius-sm);
  padding: 6px 16px; font-size: 16px; font-weight: 600; margin-top: 4px;
}
.podio-coletas { font-size: 12px; }

/* Tabela */
.card { background: var(--color-surface); border-radius: var(--radius-xl); padding: 24px; }
.card-title { font-size: 18px; font-weight: 500; color: var(--color-white); margin-bottom: 4px; }
.card-sub { font-size: 13px; margin-bottom: 16px; }

.rank-list { display: flex; flex-direction: column; }
.rank-empty { padding: 40px; text-align: center; color: var(--color-emerald-100); font-size: 14px; }
.rank-item {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 0; border-bottom: 1px solid var(--color-surface-2);
}
.rank-item:last-child { border-bottom: none; }

.rank-pos-wrap { width: 32px; display: flex; justify-content: center; flex-shrink: 0; }
.trophy-sm  { width: 24px; height: 24px; }
.gold-c     { color: var(--color-amber); }
.silver-c   { color: #9ea9b5; }
.bronze-c   { color: #b87333; }
.rank-num   { font-size: 16px; font-weight: 600; color: var(--color-emerald-100); }

.rank-info  { flex: 0 0 200px; }
.rank-nome  { font-size: 14px; font-weight: 500; color: var(--color-white); }
.rank-apto  { font-weight: 400; }
.rank-detail { font-size: 12px; margin-top: 2px; }

.rank-bar-wrap {
  flex: 1;
  height: 6px;
  background: var(--color-bg);
  border-radius: 100px;
  overflow: hidden;
}
.rank-bar {
  height: 6px;
  background: linear-gradient(90deg, var(--color-lime), #a8e063);
  border-radius: 100px;
  transition: width 0.8s ease;
}
.rank-kg { font-size: 13px; font-weight: 600; color: var(--color-lime); white-space: nowrap; flex-shrink: 0; min-width: 60px; text-align: right; }

@media (max-width: 768px) {
  .podio { grid-template-columns: 1fr; }
  .rank-bar-wrap { display: none; }
}
</style>
