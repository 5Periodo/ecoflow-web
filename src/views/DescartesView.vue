<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Gerenciamento de Descartes</h1>
        <p class="page-sub text-muted">Revise e aprove os descartes registrados pelos moradores</p>
      </div>
      <div class="tab-pills">
        <button :class="['pill', { active: filtroStatus === '' }]" @click="filtroStatus = ''">Todos</button>
        <button :class="['pill', { active: filtroStatus === 'PENDENTE' }]" @click="filtroStatus = 'PENDENTE'">
          Pendentes <span v-if="pendentesCount" class="badge-count">{{ pendentesCount }}</span>
        </button>
        <button :class="['pill', { active: filtroStatus === 'APROVADO' }]" @click="filtroStatus = 'APROVADO'">Aprovados</button>
        <button :class="['pill', { active: filtroStatus === 'NEGADO' }]" @click="filtroStatus = 'NEGADO'">Negados</button>
      </div>
    </div>

    <!-- Filtros avançados -->
    <div class="filters-row">
      <div class="filter-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="filtroMorador" type="text" placeholder="Buscar morador ou apartamento..." />
      </div>
      <select v-model="filtroMaterial" class="filter-select">
        <option value="">Todos os materiais</option>
        <option v-for="m in materiaisDisponiveis" :key="m" :value="m">{{ m }}</option>
      </select>
      <button v-if="filtroMorador || filtroMaterial" class="btn-clear-filter" @click="filtroMorador=''; filtroMaterial=''">
        ✕ Limpar filtros
      </button>
    </div>

    <div v-if="loading" class="cards-skeleton">
      <div v-for="n in 5" :key="n" class="skeleton-card"></div>
    </div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else class="list">
      <!-- Estado vazio positivo para pendentes -->
      <div v-if="filtrados.length === 0 && filtroStatus === 'PENDENTE'" class="empty-state success">
        <div class="empty-icon">✅</div>
        <h3>Tudo revisado!</h3>
        <p>Nenhum descarte aguarda aprovação no momento.</p>
        <button class="btn-ver-todos" @click="filtroStatus = ''">Ver histórico completo →</button>
      </div>
      <div v-else-if="filtrados.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>Nenhum descarte encontrado</h3>
        <p>Tente ajustar os filtros acima.</p>
      </div>

      <div
        v-for="d in filtrados" :key="d.id"
        class="descarte-card"
        :class="d.status.toLowerCase()"
        @click="abrir(d)"
        :style="{ cursor: 'pointer' }"
      >
        <div class="card-left">
          <div class="mat-icon" :style="{ background: matBg(d.categoriaMaterial?.nome) }">
            {{ matEmoji(d.categoriaMaterial?.nome) }}
          </div>
          <div class="card-info">
            <div class="card-top">
              <span class="mat-nome">{{ d.categoriaMaterial?.nome }}</span>
              <span class="apto text-lime">🏢 Apto {{ d.apartamento?.numero }}</span>
            </div>
            <div class="morador-nome">{{ d.morador?.nome }}</div>
            <div class="card-meta text-muted">
              <span>📅 {{ fmtDate(d.dataColeta) }}</span>
              <span>⚖️ {{ Number(d.pesoKg).toFixed(2) }} kg</span>
              <span v-if="d.ecopoint" class="obs">📍 {{ d.ecopoint.descricao }}</span>
              <span v-if="d.observacoes" class="obs">• {{ d.observacoes }}</span>
            </div>
          </div>
        </div>
        <div class="card-right">
          <span class="status-badge" :class="d.status.toLowerCase()">{{ statusLabel(d.status) }}</span>
          <span v-if="d.status === 'PENDENTE'" class="cta text-lime">Revisar →</span>
          <span v-else class="cta text-muted">Ver detalhes →</span>
        </div>
      </div>
    </div>

    <!-- Modal de Revisão / Detalhes -->
    <Teleport to="body">
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal-box">
          <div class="modal-header">
            <div>
              <h2>{{ selected.status === 'PENDENTE' ? 'Revisar Descarte' : 'Detalhes do Descarte' }}</h2>
              <span class="modal-status-badge" :class="selected.status.toLowerCase()">
                {{ statusLabel(selected.status) }}
              </span>
            </div>
            <button class="btn-close" @click="selected = null">✕</button>
          </div>

          <div class="modal-body">
            <!-- Carousel de fotos -->
            <div v-if="selected.fotoUrls && selected.fotoUrls.length > 0" class="foto-carousel">
              <button class="carousel-btn prev" @click.prevent="prevFoto" v-if="selected.fotoUrls.length > 1">‹</button>
              <img :src="selected.fotoUrls[fotoIndex]" alt="Foto do descarte" class="foto" />
              <div class="foto-counter" v-if="selected.fotoUrls.length > 1">
                {{ fotoIndex + 1 }}/{{ selected.fotoUrls.length }}
              </div>
              <div class="carousel-indicators" v-if="selected.fotoUrls.length > 1">
                <span v-for="(f, i) in selected.fotoUrls" :key="i" class="indicator" :class="{ active: i === fotoIndex }"></span>
              </div>
              <button class="carousel-btn next" @click.prevent="nextFoto" v-if="selected.fotoUrls.length > 1">›</button>
            </div>
            <div v-else class="foto-placeholder">📷 Sem fotos enviadas</div>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-lbl">Material</span>
                <span class="info-val">{{ selected.categoriaMaterial?.nome }}</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Morador</span>
                <span class="info-val">{{ selected.morador?.nome }}</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Apartamento</span>
                <span class="info-val">Apto {{ selected.apartamento?.numero }}</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Peso</span>
                <span class="info-val">{{ Number(selected.pesoKg).toFixed(2) }} kg</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Pontos calculados</span>
                <span class="info-val text-lime">{{ selected.pontosGerados }} pts</span>
              </div>
              <div class="info-item">
                <span class="info-lbl">Data</span>
                <span class="info-val">{{ fmtDate(selected.dataColeta) }}</span>
              </div>
              <div class="info-item full" v-if="selected.observacoes">
                <span class="info-lbl">Observações do morador</span>
                <span class="info-val">{{ selected.observacoes }}</span>
              </div>
              <div class="info-item full" v-if="selected.ecopoint">
                <span class="info-lbl">Local de Descarte (EcoPoint)</span>
                <span class="info-val">{{ selected.ecopoint.descricao }} - {{ selected.ecopoint.localizacao }}</span>
              </div>
            </div>

            <!-- Campos de aprovação (apenas para pendentes) -->
            <template v-if="selected.status === 'PENDENTE'">
              <div class="field" style="margin-top:16px">
                <label>
                  Pontuação a atribuir
                  <span class="hint">(deixe vazio para usar a calculada: {{ selected.pontosGerados }} pts)</span>
                </label>
                <input
                  v-model.number="pontosCustom"
                  type="number"
                  min="0"
                  :placeholder="selected.pontosGerados + ' pts (automático)'"
                />
                <!-- Aviso de desvio significativo -->
                <div v-if="pontosCustom !== null && pontosCustom !== undefined && Math.abs(pontosCustom - selected.pontosGerados) > selected.pontosGerados * 0.5" class="pontos-warning">
                  ⚠️ Valor muito diferente do calculado ({{ selected.pontosGerados }} pts). Confirme antes de aprovar.
                </div>
              </div>

              <div class="field" style="margin-top:12px">
                <label>Comentário para o morador <span class="hint">(opcional)</span></label>
                <textarea
                  v-model="comentario"
                  rows="2"
                  placeholder="Ex: Material aceito, bom trabalho! / Material misturado, não foi possível aceitar..."
                ></textarea>
              </div>
            </template>

            <!-- Histórico: mostra pontos atribuídos e comentário -->
            <template v-else>
              <div class="info-review" :class="selected.status.toLowerCase()">
                <span class="info-lbl">Resultado da revisão</span>
                <div class="review-detail">
                  <span v-if="selected.status === 'APROVADO'" class="text-lime">
                    ✅ Aprovado — {{ selected.pontosAtribuidos ?? selected.pontosGerados }} pts atribuídos
                  </span>
                  <span v-else class="text-red">❌ Negado</span>
                </div>
              </div>
            </template>

            <p v-if="aprovError" class="error-msg">{{ aprovError }}</p>
          </div>

          <!-- Footer apenas para pendentes -->
          <div v-if="selected.status === 'PENDENTE'" class="modal-footer">
            <button class="btn-negar" :disabled="aprovLoading" @click="aprovar('NEGADO')">
              ✕ Negar
            </button>
            <button class="btn-aprovar" :disabled="aprovLoading" @click="aprovar('APROVADO')">
              <span v-if="aprovLoading" class="btn-spinner"></span>
              ✓ Aprovar{{ pontosCustom ? ` (${pontosCustom} pts)` : '' }}
            </button>
          </div>
          <div v-else class="modal-footer-readonly">
            <button class="btn-fechar" @click="selected = null">Fechar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { toast } from '@/services/toast'

const loading = ref(true)
const error = ref('')
const descartes = ref<any[]>([])
const filtroStatus = ref('PENDENTE')
const filtroMorador = ref('')
const filtroMaterial = ref('')
const selected = ref<any>(null)
const fotoIndex = ref(0)
const pontosCustom = ref<number | null>(null)
const comentario = ref('')
const aprovLoading = ref(false)
const aprovError = ref('')

const COLORS: Record<string, string> = {
  'Plástico': '#3B82F6',
  'Papel / Papelão': '#8B5CF6',
  'Vidro': '#10B981',
  'Metal / Alumínio': '#FF9500',
  'Orgânico': '#7ED321',
}
const EMOJIS: Record<string, string> = {
  'Plástico': '♻️',
  'Papel / Papelão': '📄',
  'Vidro': '🍶',
  'Metal / Alumínio': '🔧',
  'Orgânico': '🌱',
}

const matBg    = (nome: string) => (COLORS[nome] ?? '#7ED321') + '22'
const matEmoji = (nome: string) => EMOJIS[nome] ?? '♻️'
const fmtDate  = (d: string)   => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const statusLabel = (s: string) => ({ PENDENTE: 'Pendente', APROVADO: 'Aprovado', NEGADO: 'Negado' }[s] ?? s)

const pendentesCount     = computed(() => descartes.value.filter(d => d.status === 'PENDENTE').length)
const materiaisDisponiveis = computed(() => [...new Set(descartes.value.map(d => d.categoriaMaterial?.nome).filter(Boolean))])

const filtrados = computed(() => {
  let list = filtroStatus.value
    ? descartes.value.filter(d => d.status === filtroStatus.value)
    : descartes.value

  if (filtroMorador.value) {
    const q = filtroMorador.value.toLowerCase()
    list = list.filter(d =>
      d.morador?.nome?.toLowerCase().includes(q) ||
      String(d.apartamento?.numero)?.toLowerCase().includes(q)
    )
  }
  if (filtroMaterial.value) {
    list = list.filter(d => d.categoriaMaterial?.nome === filtroMaterial.value)
  }
  return list
})

function abrir(d: any) {
  selected.value = d
  fotoIndex.value = 0
  pontosCustom.value = null
  comentario.value = ''
  aprovError.value = ''
}

function prevFoto() {
  if (selected.value?.fotoUrls?.length)
    fotoIndex.value = (fotoIndex.value - 1 + selected.value.fotoUrls.length) % selected.value.fotoUrls.length
}
function nextFoto() {
  if (selected.value?.fotoUrls?.length)
    fotoIndex.value = (fotoIndex.value + 1) % selected.value.fotoUrls.length
}

async function aprovar(status: 'APROVADO' | 'NEGADO') {
  aprovLoading.value = true
  aprovError.value = ''
  try {
    const payload: any = { status }
    if (pontosCustom.value != null) payload.pontosAtribuidos = pontosCustom.value
    if (comentario.value)           payload.comentario = comentario.value

    await api.patch(`/descartes/${selected.value.id}/aprovar`, payload)

    const pts = pontosCustom.value ?? selected.value.pontosGerados
    const nomeMorador = selected.value.morador?.nome ?? 'Morador'

    descartes.value = descartes.value.map(d =>
      d.id === selected.value.id ? { ...d, status, pontosAtribuidos: pts } : d
    )
    selected.value = null

    if (status === 'APROVADO') {
      toast.success(`✅ Descarte aprovado! ${nomeMorador} recebeu ${pts} pts`)
    } else {
      toast.warning(`❌ Descarte de ${nomeMorador} negado`)
    }
  } catch (err: any) {
    aprovError.value = err.response?.data?.message ?? 'Erro ao processar.'
  } finally {
    aprovLoading.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/descartes/todos')
    descartes.value = data
  } catch {
    error.value = 'Erro ao carregar descartes.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 24px; font-weight: 600; color: var(--color-white); }
.page-sub { font-size: 14px; margin-top: 4px; }
.tab-pills { display: flex; gap: 8px; flex-wrap: wrap; }
.pill {
  padding: 8px 16px; border-radius: 100px; font-size: 13px; font-weight: 500;
  color: var(--color-emerald-100); background: var(--color-surface);
  border: 1px solid var(--color-surface-2); transition: all 0.2s; display: flex; align-items: center; gap: 6px;
}
.pill.active { background: var(--color-lime-10); color: var(--color-lime); border-color: var(--color-lime-30); }
.badge-count {
  background: var(--color-amber); color: #1a0a00; border-radius: 100px;
  padding: 1px 7px; font-size: 11px; font-weight: 700;
}

/* Filters */
.filters-row {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}
.filter-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm);
  padding: 9px 14px;
  color: var(--color-emerald-100);
  flex: 1;
  min-width: 200px;
}
.filter-search input {
  background: none;
  border: none;
  outline: none;
  color: var(--color-white);
  font-size: 14px;
  width: 100%;
}
.filter-search input::placeholder { color: #4a6a6a; }
.filter-select {
  background: var(--color-surface);
  border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm);
  padding: 9px 14px;
  color: var(--color-emerald-100);
  font-size: 14px;
  outline: none;
  cursor: pointer;
}
.filter-select option { background: var(--color-bg); }
.btn-clear-filter {
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background: rgba(239,68,68,0.1);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.2);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-clear-filter:hover { background: rgba(239,68,68,0.2); }

/* Skeleton */
.cards-skeleton { display: flex; flex-direction: column; gap: 8px; }
.skeleton-card {
  height: 82px;
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-2) 50%, var(--color-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.error-state { text-align: center; padding: 60px 0; color: var(--color-amber); }
.list { display: flex; flex-direction: column; gap: 8px; }

/* Empty states */
.empty-state {
  text-align: center;
  padding: 60px 24px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.empty-state.success { background: rgba(125,211,33,0.05); border: 1px solid var(--color-lime-30); }
.empty-icon { font-size: 48px; line-height: 1; }
.empty-state h3 { font-size: 20px; font-weight: 600; color: var(--color-white); margin: 0; }
.empty-state p  { font-size: 14px; color: var(--color-emerald-100); margin: 0; }
.btn-ver-todos {
  margin-top: 8px;
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  background: var(--color-lime-10);
  color: var(--color-lime);
  border: 1px solid var(--color-lime-30);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-ver-todos:hover { background: rgba(125,211,33,0.15); }

/* Cards */
.descarte-card {
  background: var(--color-surface); border-radius: var(--radius-lg);
  padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;
  border-left: 3px solid transparent; transition: all 0.15s;
}
.descarte-card:hover { background: var(--color-surface-2); transform: translateX(2px); }
.descarte-card.pendente { border-left-color: var(--color-amber); }
.descarte-card.aprovado { border-left-color: var(--color-lime); }
.descarte-card.negado   { border-left-color: #ef4444; opacity: 0.75; }
.card-left { display: flex; gap: 14px; align-items: flex-start; flex: 1; }
.mat-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.card-info { display: flex; flex-direction: column; gap: 4px; }
.card-top { display: flex; align-items: center; gap: 10px; }
.mat-nome { font-size: 15px; font-weight: 500; color: var(--color-white); }
.apto { font-size: 13px; }
.morador-nome { font-size: 13px; color: var(--color-white); }
.card-meta { display: flex; gap: 10px; font-size: 12px; flex-wrap: wrap; }
.card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.status-badge { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 100px; }
.status-badge.pendente { background: var(--color-amber-10); color: var(--color-amber); border: 1px solid var(--color-amber-30); }
.status-badge.aprovado { background: var(--color-lime-10); color: var(--color-lime); border: 1px solid var(--color-lime-30); }
.status-badge.negado   { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
.cta { font-size: 13px; font-weight: 500; }
.text-red { color: #f87171; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal-box {
  background: var(--color-surface); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-xl); width: 100%; max-width: 580px;
  animation: fadeUp 0.2s ease; max-height: 90vh; overflow-y: auto;
}
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
.modal-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 24px 24px 0;
}
.modal-header h2 { font-size: 18px; font-weight: 600; color: var(--color-white); margin-bottom: 6px; }
.modal-status-badge { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 100px; }
.modal-status-badge.pendente { background: var(--color-amber-10); color: var(--color-amber); }
.modal-status-badge.aprovado { background: var(--color-lime-10); color: var(--color-lime); }
.modal-status-badge.negado   { background: rgba(239,68,68,0.1); color: #ef4444; }
.btn-close { background: none; color: var(--color-emerald-100); font-size: 18px; cursor: pointer; }
.modal-body { padding: 20px 24px; }
.foto-carousel {
  position: relative; margin-bottom: 16px; border-radius: var(--radius-md); overflow: hidden;
  background: var(--color-bg); display: flex; align-items: center; justify-content: center; height: 260px;
}
.foto { max-width: 100%; max-height: 100%; object-fit: contain; }
.foto-counter {
  position: absolute; top: 8px; right: 8px;
  background: rgba(0,0,0,0.6); color: white;
  font-size: 12px; padding: 3px 8px; border-radius: 100px;
}
.carousel-btn {
  position: absolute; top: 50%; transform: translateY(-50%);
  background: rgba(0,0,0,0.5); color: white; border: none; font-size: 24px;
  width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s;
}
.carousel-btn:hover { background: rgba(0,0,0,0.8); }
.carousel-btn.prev { left: 8px; }
.carousel-btn.next { right: 8px; }
.carousel-indicators { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
.indicator { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.4); }
.indicator.active { background: white; }
.foto-placeholder {
  background: var(--color-bg); border: 1px dashed var(--color-surface-2);
  border-radius: var(--radius-md); padding: 32px; text-align: center;
  color: var(--color-emerald-100); font-size: 14px; margin-bottom: 16px; height: 160px;
  display: flex; align-items: center; justify-content: center;
}

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-item.full { grid-column: 1 / -1; }
.info-lbl { font-size: 12px; color: var(--color-emerald-100); }
.info-val { font-size: 14px; color: var(--color-white); font-weight: 500; }

.info-review {
  margin-top: 16px; padding: 14px; border-radius: var(--radius-md);
  display: flex; flex-direction: column; gap: 6px;
}
.info-review.aprovado { background: var(--color-lime-10); border: 1px solid var(--color-lime-30); }
.info-review.negado   { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); }
.review-detail { font-size: 15px; font-weight: 600; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: var(--color-emerald-100); }
.hint { font-weight: 400; font-size: 12px; color: #4a6a6a; }
.field input, .field textarea {
  background: var(--color-bg); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm); padding: 10px 14px;
  color: var(--color-white); font-size: 14px; outline: none; font-family: inherit;
}
.field input:focus, .field textarea:focus { border-color: var(--color-lime); }
.pontos-warning {
  font-size: 12px; color: var(--color-amber);
  background: var(--color-amber-10); border: 1px solid var(--color-amber-30);
  border-radius: var(--radius-sm); padding: 8px 12px; margin-top: 4px;
}
.error-msg {
  font-size: 13px; color: var(--color-amber);
  background: var(--color-amber-10); border: 1px solid var(--color-amber-30);
  border-radius: var(--radius-sm); padding: 10px 14px; margin-top: 8px;
}
.modal-footer { display: flex; gap: 12px; padding: 0 24px 24px; }
.modal-footer-readonly { display: flex; justify-content: flex-end; padding: 0 24px 24px; }
.btn-negar {
  flex: 1; padding: 12px; border-radius: var(--radius-sm);
  background: rgba(239,68,68,0.1); color: #ef4444;
  border: 1px solid rgba(239,68,68,0.3); font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-negar:hover { background: rgba(239,68,68,0.2); }
.btn-aprovar {
  flex: 1; padding: 12px; border-radius: var(--radius-sm);
  background: var(--color-lime); color: #0a1a0a; font-size: 14px; font-weight: 600; cursor: pointer;
  transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-aprovar:hover { opacity: 0.9; }
.btn-fechar {
  padding: 10px 24px; border-radius: var(--radius-sm);
  background: var(--color-surface-2); color: var(--color-emerald-100);
  font-size: 14px; font-weight: 500; cursor: pointer;
}
.btn-aprovar:disabled, .btn-negar:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-spinner {
  width: 14px; height: 14px; border: 2px solid rgba(10,26,10,0.3);
  border-top-color: #0a1a0a; border-radius: 50%;
  animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
