<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Ranking do Condomínio</h1>
    </div>

    <div v-if="loading" class="loading">Carregando ranking...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <template v-else>
      <!-- Pódio Top 3 -->
      <div class="podio">
        <!-- 2º -->
        <div v-if="ranking[1]" class="podio-card second">
          <svg class="trophy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
          </svg>
          <div class="podio-pos silver">2°</div>
          <div class="podio-nome">{{ ranking[1].apartamentoNumero ? `Apto ${ranking[1].apartamentoNumero}` : '–' }}</div>
          <div class="podio-morador">{{ ranking[1].moradorNome }}</div>
          <div class="podio-kg text-lime">{{ Number(ranking[1].totalKg).toFixed(1) }} kg</div>
        </div>

        <!-- 1º -->
        <div v-if="ranking[0]" class="podio-card first">
          <svg class="trophy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
          </svg>
          <div class="podio-pos gold">1°</div>
          <div class="podio-nome">{{ ranking[0].apartamentoNumero ? `Apto ${ranking[0].apartamentoNumero}` : '–' }}</div>
          <div class="podio-morador">{{ ranking[0].moradorNome }}</div>
          <div class="podio-kg" style="color: var(--color-amber)">{{ Number(ranking[0].totalKg).toFixed(1) }} kg</div>
        </div>

        <!-- 3º -->
        <div v-if="ranking[2]" class="podio-card third">
          <svg class="trophy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
          </svg>
          <div class="podio-pos bronze">3°</div>
          <div class="podio-nome">{{ ranking[2].apartamentoNumero ? `Apto ${ranking[2].apartamentoNumero}` : '–' }}</div>
          <div class="podio-morador">{{ ranking[2].moradorNome }}</div>
          <div class="podio-kg text-lime">{{ Number(ranking[2].totalKg).toFixed(1) }} kg</div>
        </div>
      </div>

      <!-- Tabela Completa -->
      <div class="card">
        <h2 class="card-title">Classificação Completa</h2>
        <p class="card-sub text-muted">Ranking baseado no total de materiais reciclados este mês</p>
        <div class="rank-list">
          <div v-for="item in ranking" :key="item.posicao" class="rank-item">
            <div class="rank-pos-wrap">
              <svg v-if="item.posicao === 1" class="trophy-sm gold-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
              </svg>
              <svg v-else-if="item.posicao <= 3" class="trophy-sm silver-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
              <div class="rank-detail text-lime">{{ item.coletas }} coletas · {{ Number(item.totalKg).toFixed(1) }} kg total</div>
            </div>
            <div class="rank-trend text-lime">↗ +{{ item.coletas }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const loading = ref(true)
const error = ref('')
const ranking = ref<any[]>([])

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
.page-header { margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 600; color: var(--color-white); }

.loading, .error-state { text-align: center; padding: 60px 0; color: var(--color-emerald-100); }
.error-state { color: var(--color-amber); }

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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: transform 0.2s;
}
.podio-card:hover { transform: translateY(-2px); }
.podio-card.first {
  border: 1px solid var(--color-amber);
  background: rgba(255,149,0,0.05);
}
.podio-card.second, .podio-card.third {
  border: 1px solid var(--color-surface-2);
}

.trophy-icon { width: 40px; height: 40px; }
.podio-card.first .trophy-icon { color: var(--color-amber); width: 48px; height: 48px; }
.podio-card.second .trophy-icon { color: #9ea9b5; }
.podio-card.third .trophy-icon { color: var(--color-amber); opacity: 0.6; }

.podio-pos { font-size: 22px; font-weight: 700; }
.gold   { color: var(--color-amber); }
.silver { color: #9ea9b5; }
.bronze { color: #b87333; }

.podio-nome { font-size: 16px; font-weight: 600; color: var(--color-white); }
.podio-morador { font-size: 13px; color: var(--color-emerald-100); }
.podio-kg {
  background: var(--color-surface-2);
  border-radius: var(--radius-sm);
  padding: 6px 16px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 4px;
}

/* Tabela */
.card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 24px;
}
.card-title { font-size: 18px; font-weight: 500; color: var(--color-white); margin-bottom: 4px; }
.card-sub { font-size: 13px; margin-bottom: 16px; }

.rank-list { display: flex; flex-direction: column; }
.rank-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-surface-2);
}
.rank-item:last-child { border-bottom: none; }

.rank-pos-wrap { width: 32px; display: flex; justify-content: center; }
.trophy-sm { width: 24px; height: 24px; }
.gold-c   { color: var(--color-amber); }
.silver-c { color: #9ea9b5; }
.rank-num { font-size: 16px; font-weight: 600; color: var(--color-emerald-100); }

.rank-info { flex: 1; }
.rank-nome { font-size: 14px; font-weight: 500; color: var(--color-white); }
.rank-apto { font-weight: 400; }
.rank-detail { font-size: 13px; margin-top: 2px; }
.rank-trend { font-size: 13px; font-weight: 500; }
</style>
