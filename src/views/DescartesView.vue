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

    <div v-if="loading" class="loading">Carregando descartes...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else class="list">
      <div v-if="filtrados.length === 0" class="empty">Nenhum descarte encontrado.</div>
      <div
        v-for="d in filtrados" :key="d.id"
        class="descarte-card"
        :class="d.status.toLowerCase()"
        @click="abrir(d)"
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
              <span>⚖ {{ Number(d.pesoKg).toFixed(2) }} kg</span>
              <span v-if="d.observacoes" class="obs">• {{ d.observacoes }}</span>
            </div>
          </div>
        </div>
        <div class="card-right">
          <span class="status-badge" :class="d.status.toLowerCase()">{{ statusLabel(d.status) }}</span>
          <span v-if="d.status === 'PENDENTE'" class="cta text-lime">Revisar →</span>
        </div>
      </div>
    </div>

    <!-- Modal de Aprovação -->
    <Teleport to="body">
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal-box">
          <div class="modal-header">
            <h2>Revisar Descarte</h2>
            <button class="btn-close" @click="selected = null">✕</button>
          </div>

          <div class="modal-body">
            <div v-if="selected.fotoUrls && selected.fotoUrls.length > 0" class="foto-carousel">
              <button class="carousel-btn prev" @click.prevent="prevFoto" v-if="selected.fotoUrls.length > 1">‹</button>
              <img :src="selected.fotoUrls[fotoIndex]" alt="Foto do descarte" class="foto" />
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
              <div class="info-item" v-if="selected.observacoes">
                <span class="info-lbl">Observações</span>
                <span class="info-val">{{ selected.observacoes }}</span>
              </div>
            </div>

            <div class="field" style="margin-top:16px">
              <label>Pontuação a atribuir <span class="hint">(deixe vazio para usar a calculada)</span></label>
              <input v-model.number="pontosCustom" type="number" min="0"
                :placeholder="selected.pontosGerados + ' pts (automático)'" />
            </div>

            <p v-if="aprovError" class="error-msg">{{ aprovError }}</p>
          </div>

          <div class="modal-footer">
            <button class="btn-negar" :disabled="aprovLoading" @click="aprovar('NEGADO')">
              ✕ Negar
            </button>
            <button class="btn-aprovar" :disabled="aprovLoading" @click="aprovar('APROVADO')">
              ✓ Aprovar{{ pontosCustom ? ` (${pontosCustom} pts)` : '' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const loading = ref(true)
const error = ref('')
const descartes = ref<any[]>([])
const filtroStatus = ref('PENDENTE')
const selected = ref<any>(null)
const fotoIndex = ref(0)
const pontosCustom = ref<number | null>(null)
const aprovLoading = ref(false)
const aprovError = ref('')

const COLORS: Record<string, string> = {
  'Plastico': '#3B82F6', 'Papel / Papelao': '#8B5CF6',
  'Vidro': '#10B981', 'Metal / Aluminio': '#FF9500', 'Organico': '#7ED321',
}
const EMOJIS: Record<string, string> = {
  'Plastico': 'Ã¢â™»ï¸', 'Papel / Papelao': 'ðŸ"„', 'Vidro': 'ðŸ¶',
  'Metal / Aluminio': 'ðŸ"§', 'Organico': 'ðŸŒ±',
}
const matBg = (nome: string) => '#2A4A4A'
const matEmoji = (nome: string) => '♻️'
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const statusLabel = (s: string) => ({ PENDENTE: 'Pendente', APROVADO: 'Aprovado', NEGADO: 'Negado' }[s] ?? s)

const pendentesCount = computed(() => descartes.value.filter(d => d.status === 'PENDENTE').length)
const filtrados = computed(() => filtroStatus.value ? descartes.value.filter(d => d.status === filtroStatus.value) : descartes.value)

function abrir(d: any) {
  if (d.status !== 'PENDENTE') return
  selected.value = d
  fotoIndex.value = 0
  pontosCustom.value = null
  aprovError.value = ''
}

function prevFoto() {
  if (selected.value?.fotoUrls?.length) {
    fotoIndex.value = (fotoIndex.value - 1 + selected.value.fotoUrls.length) % selected.value.fotoUrls.length
  }
}
function nextFoto() {
  if (selected.value?.fotoUrls?.length) {
    fotoIndex.value = (fotoIndex.value + 1) % selected.value.fotoUrls.length
  }
}

async function aprovar(status: 'APROVADO' | 'NEGADO') {
  aprovLoading.value = true
  aprovError.value = ''
  try {
    const payload: any = { status }
    if (pontosCustom.value) payload.pontosAtribuidos = pontosCustom.value
    await api.patch(`/descartes/${selected.value.id}/aprovar`, payload)
    selected.value.status = status
    descartes.value = descartes.value.map(d => d.id === selected.value.id ? { ...d, status } : d)
    selected.value = null
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
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
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
.loading, .error-state, .empty { text-align: center; padding: 60px 0; color: var(--color-emerald-100); }
.error-state { color: var(--color-amber); }
.list { display: flex; flex-direction: column; gap: 8px; }
.descarte-card {
  background: var(--color-surface); border-radius: var(--radius-lg);
  padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;
  border-left: 3px solid transparent; transition: all 0.15s;
}
.descarte-card.pendente { border-left-color: var(--color-amber); cursor: pointer; }
.descarte-card.pendente:hover { background: var(--color-surface-2); }
.descarte-card.aprovado { border-left-color: var(--color-lime); }
.descarte-card.negado { border-left-color: #ef4444; opacity: 0.7; }
.card-left { display: flex; gap: 14px; align-items: flex-start; flex: 1; }
.mat-icon {
  width: 44px; height: 44px; border-radius: 12px; background: var(--color-surface-2);
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.card-info { display: flex; flex-direction: column; gap: 4px; }
.card-top { display: flex; align-items: center; gap: 10px; }
.mat-nome { font-size: 15px; font-weight: 500; color: var(--color-white); }
.apto { font-size: 13px; }
.morador-nome { font-size: 13px; color: var(--color-white); }
.card-meta { display: flex; gap: 10px; font-size: 12px; }
.card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.status-badge {
  font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 100px;
}
.status-badge.pendente { background: var(--color-amber-10); color: var(--color-amber); border: 1px solid var(--color-amber-30); }
.status-badge.aprovado { background: var(--color-lime-10); color: var(--color-lime); border: 1px solid var(--color-lime-30); }
.status-badge.negado { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
.cta { font-size: 13px; font-weight: 500; }
/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal-box {
  background: var(--color-surface); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-xl); width: 100%; max-width: 560px;
  animation: fadeUp 0.2s ease;
}
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px 24px 0;
}
.modal-header h2 { font-size: 18px; font-weight: 600; color: var(--color-white); }
.btn-close { background: none; color: var(--color-emerald-100); font-size: 18px; }
.modal-body { padding: 20px 24px; }
.foto-carousel {
  position: relative; margin-bottom: 16px; border-radius: var(--radius-md); overflow: hidden;
  background: var(--color-bg); display: flex; align-items: center; justify-content: center; height: 280px;
}
.foto { max-width: 100%; max-height: 100%; object-fit: contain; }
.carousel-btn {
  position: absolute; top: 50%; transform: translateY(-50%);
  background: rgba(0,0,0,0.5); color: white; border: none; font-size: 24px;
  width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s;
}
.carousel-btn:hover { background: rgba(0,0,0,0.8); }
.carousel-btn.prev { left: 8px; }
.carousel-btn.next { right: 8px; }
.carousel-indicators {
  position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 6px;
}
.indicator {
  width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.4);
}
.indicator.active { background: white; }

.foto-placeholder {
  background: var(--color-bg); border: 1px dashed var(--color-surface-2);
  border-radius: var(--radius-md); padding: 32px; text-align: center;
  color: var(--color-emerald-100); font-size: 14px; margin-bottom: 16px; height: 280px;
  display: flex; align-items: center; justify-content: center;
}
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-lbl { font-size: 12px; color: var(--color-emerald-100); }
.info-val { font-size: 14px; color: var(--color-white); font-weight: 500; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: var(--color-emerald-100); }
.hint { font-weight: 400; font-size: 12px; color: #4a6a6a; }
.field input {
  background: var(--color-bg); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm); padding: 10px 14px;
  color: var(--color-white); font-size: 14px; outline: none;
}
.field input:focus { border-color: var(--color-lime); }
.error-msg {
  font-size: 13px; color: var(--color-amber);
  background: var(--color-amber-10); border: 1px solid var(--color-amber-30);
  border-radius: var(--radius-sm); padding: 10px 14px; margin-top: 8px;
}
.modal-footer { display: flex; gap: 12px; padding: 0 24px 24px; }
.btn-negar {
  flex: 1; padding: 12px; border-radius: var(--radius-sm);
  background: rgba(239,68,68,0.1); color: #ef4444;
  border: 1px solid rgba(239,68,68,0.3); font-size: 14px; font-weight: 600;
}
.btn-negar:hover { background: rgba(239,68,68,0.2); }
.btn-aprovar {
  flex: 1; padding: 12px; border-radius: var(--radius-sm);
  background: var(--color-lime); color: #0a1a0a; font-size: 14px; font-weight: 600;
}
.btn-aprovar:disabled, .btn-negar:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
