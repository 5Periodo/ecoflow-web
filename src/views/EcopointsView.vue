<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">EcoPoints</h1>
        <p class="page-sub text-muted">Gerencie os pontos de coleta do condomínio</p>
      </div>
      <button class="btn-novo" @click="abrirNovoEcoPoint">+ Novo EcoPoint</button>
    </div>

    <!-- Lista de EcoPoints -->
    <div v-if="loading" class="ecopoints-grid">
      <div v-for="n in 6" :key="n" class="skel-ep"></div>
    </div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else-if="ecopoints.length === 0" class="empty-state">
      <div class="empty-icon">📍</div>
      <h3>Nenhum EcoPoint cadastrado</h3>
      <p>Crie pontos de coleta para que os moradores registrem seus descartes.</p>
      <button class="btn-novo" @click="abrirNovoEcoPoint">+ Criar primeiro EcoPoint</button>
    </div>

    <div v-else class="ecopoints-grid">
      <div v-for="ep in ecopoints" :key="ep.id" class="ep-card" @click="abrir(ep)">
        <div class="ep-header">
          <div class="ep-icon">📍</div>
          <span class="ep-status" :class="ep.status.toLowerCase()">{{ STATUS_LABELS[ep.status] ?? ep.status }}</span>
        </div>
        <h3 class="ep-title">{{ ep.descricao }}</h3>
        <p class="ep-loc text-muted">📌 {{ ep.localizacao }}</p>
        <div class="ep-footer">
          <span class="ep-action">Ver QR Code →</span>
        </div>
      </div>
    </div>

    <!-- Modal: Novo EcoPoint -->
    <Teleport to="body">
      <div v-if="showNewForm" class="modal-overlay" @click.self="showNewForm = false">
        <div class="modal-box">
          <div class="modal-header">
            <h2>Criar Novo EcoPoint</h2>
            <button class="btn-close" @click="showNewForm = false">✕</button>
          </div>
          <form @submit.prevent="criar" class="modal-form">
            <div class="field">
              <label>Descrição / Nome</label>
              <input v-model="form.descricao" type="text" placeholder="Ex: Ponto de Coleta — Hall Bloco A" required />
            </div>
            <div class="field">
              <label>Localização</label>
              <input v-model="form.localizacao" type="text" placeholder="Ex: Térreo, ao lado da portaria" required />
            </div>
            <p v-if="formError" class="error-msg">{{ formError }}</p>
            <div class="modal-footer">
              <button type="button" class="btn-cancel" @click="showNewForm = false">Cancelar</button>
              <button type="submit" class="btn-submit" :disabled="formLoading">
                <span v-if="formLoading" class="btn-spinner"></span>
                {{ formLoading ? 'Criando...' : '🔲 Criar e Gerar QR Code' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Detalhes e QR Code -->
    <Teleport to="body">
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal-box modal-wide">
          <div class="qr-header">
            <div>
              <h3 class="qr-title">{{ selected.descricao }}</h3>
              <p class="qr-sub text-muted">📌 {{ selected.localizacao }}</p>
            </div>
            <button class="btn-cancel-sm" @click="selected = null">✕</button>
          </div>

          <div class="qr-body">
            <div class="qr-canvas-wrap">
              <canvas ref="qrCanvas" class="qr-canvas"></canvas>
              <button class="btn-download" @click="downloadQR">
                ⬇ Baixar QR Code
              </button>
            </div>

            <div class="qr-info">
              <!-- Status -->
              <div class="field">
                <label>Status do ponto</label>
                <select v-model="selectedStatus" @change="mudarStatus">
                  <option value="ATIVO">✅ Ativo</option>
                  <option value="INATIVO">❌ Inativo</option>
                  <option value="MANUTENCAO">🔧 Em Manutenção</option>
                </select>
              </div>

              <!-- Hash (apenas para cópia, não destaque) -->
              <div class="info-item">
                <span class="info-lbl">Código QR</span>
                <div class="hash-row">
                  <code class="info-val-code">{{ selected.qrCodeHash }}</code>
                  <button class="btn-copy" @click="copiarHash" :title="copiado ? 'Copiado!' : 'Copiar código'">
                    {{ copiado ? '✅' : '📋' }}
                  </button>
                </div>
              </div>

              <p v-if="statusError" class="error-msg">{{ statusError }}</p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import api from '@/services/api'
import { toast } from '@/services/toast'

const STATUS_LABELS: Record<string, string> = {
  ATIVO: 'Ativo', INATIVO: 'Inativo', MANUTENCAO: 'Em Manutenção'
}

const loading   = ref(true)
const error     = ref('')
const ecopoints = ref<any[]>([])

const showNewForm = ref(false)
const formLoading = ref(false)
const formError   = ref('')
const form = ref({ descricao: '', localizacao: '' })

const selected       = ref<any>(null)
const selectedStatus = ref('')
const statusError    = ref('')
const qrCanvas       = ref<HTMLCanvasElement | null>(null)
const copiado        = ref(false)

async function gerarQR() {
  await nextTick()
  if (!qrCanvas.value || !selected.value) return
  await QRCode.toCanvas(qrCanvas.value, selected.value.qrCodeHash, {
    width: 200,
    color: { dark: '#FFFFFF', light: '#1A3A3A' }
  })
}

watch(selected, (v) => { if (v) gerarQR() })

function abrirNovoEcoPoint() {
  form.value = { descricao: '', localizacao: '' }
  formError.value = ''
  showNewForm.value = true
}

function downloadQR() {
  if (!qrCanvas.value || !selected.value) return
  const link = document.createElement('a')
  link.download = `ecopoint-${selected.value.descricao.replace(/\s+/g, '-')}.png`
  link.href = qrCanvas.value.toDataURL()
  link.click()
}

async function copiarHash() {
  if (!selected.value) return
  await navigator.clipboard.writeText(selected.value.qrCodeHash)
  copiado.value = true
  setTimeout(() => { copiado.value = false }, 2000)
}

function abrir(ep: any) {
  selected.value = { ...ep }
  selectedStatus.value = ep.status
  statusError.value = ''
  copiado.value = false
}

async function mudarStatus() {
  if (!selected.value) return
  statusError.value = ''
  const novoStatus = selectedStatus.value
  try {
    await api.patch(`/ecopoints/${selected.value.id}`, { status: novoStatus })
    selected.value.status = novoStatus
    const idx = ecopoints.value.findIndex(e => e.id === selected.value.id)
    if (idx !== -1) ecopoints.value[idx].status = novoStatus
    toast.success(`📍 Status atualizado para "${STATUS_LABELS[novoStatus]}"`)
  } catch (err: any) {
    statusError.value = err.response?.data?.message ?? 'Erro ao atualizar status.'
    selectedStatus.value = selected.value.status
  }
}

async function criar() {
  formError.value = ''
  formLoading.value = true
  try {
    const qrCodeHash = `ECOFLOW-${uuidv4().toUpperCase().slice(0, 12)}`
    const { data } = await api.post('/ecopoints', {
      descricao: form.value.descricao,
      localizacao: form.value.localizacao,
      qrCodeHash,
    })
    ecopoints.value.unshift(data)
    showNewForm.value = false
    form.value = { descricao: '', localizacao: '' }
    toast.success(`📍 EcoPoint "${data.descricao}" criado com sucesso`)
    abrir(data)
  } catch (err: any) {
    formError.value = err.response?.data?.message ?? 'Erro ao criar EcoPoint.'
  } finally {
    formLoading.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/ecopoints')
    ecopoints.value = data
  } catch {
    error.value = 'Erro ao carregar EcoPoints.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 600; color: var(--color-white); }
.page-sub { font-size: 14px; margin-top: 4px; }
.btn-novo {
  background: var(--color-lime); color: #0a1a0a;
  padding: 10px 20px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer;
}
.btn-novo:hover { opacity: 0.9; }

/* Skeleton */
.ecopoints-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.skel-ep {
  height: 160px; border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-2) 50%, var(--color-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.error-state { text-align: center; padding: 60px 0; color: var(--color-amber); }

/* Empty state */
.empty-state {
  grid-column: 1 / -1; text-align: center; padding: 60px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  background: var(--color-surface); border-radius: var(--radius-xl);
}
.empty-icon { font-size: 48px; }
.empty-state h3 { font-size: 20px; font-weight: 600; color: var(--color-white); margin: 0; }
.empty-state p  { font-size: 14px; color: var(--color-emerald-100); margin: 0; }

/* Cards */
.ep-card {
  background: var(--color-surface); border-radius: var(--radius-lg);
  padding: 20px; display: flex; flex-direction: column; gap: 8px; cursor: pointer;
  transition: all 0.2s; border: 1px solid transparent;
}
.ep-card:hover { background: var(--color-surface-2); border-color: var(--color-lime-30); transform: translateY(-2px); }
.ep-header { display: flex; justify-content: space-between; align-items: center; }
.ep-icon { font-size: 24px; }
.ep-status {
  font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 100px; text-transform: uppercase;
}
.ep-status.ativo      { background: var(--color-lime-10); color: var(--color-lime); border: 1px solid var(--color-lime-30); }
.ep-status.inativo    { background: var(--color-amber-10); color: var(--color-amber); border: 1px solid var(--color-amber-30); }
.ep-status.manutencao { background: rgba(59,130,246,0.1); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); }
.ep-title { font-size: 15px; font-weight: 600; color: var(--color-white); }
.ep-loc   { font-size: 13px; }
.ep-footer { margin-top: 4px; }
.ep-action { font-size: 12px; color: var(--color-lime); font-weight: 500; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.modal-box {
  background: var(--color-surface); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-xl); width: 100%; max-width: 480px;
  animation: fadeUp 0.2s ease; padding: 28px;
}
.modal-wide { max-width: 600px; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-header h2 { font-size: 18px; font-weight: 600; color: var(--color-white); }
.btn-close { background: none; color: var(--color-emerald-100); font-size: 18px; cursor: pointer; }
.modal-form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: var(--color-emerald-100); }
.field input, .field select {
  background: var(--color-bg); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm); padding: 10px 14px; color: var(--color-white);
  font-size: 14px; outline: none; transition: border-color 0.2s;
}
.field input:focus, .field select:focus { border-color: var(--color-lime); }
.field select option { background: var(--color-bg); }
.error-msg {
  font-size: 13px; color: var(--color-amber); background: var(--color-amber-10);
  border: 1px solid var(--color-amber-30); border-radius: var(--radius-sm); padding: 10px 14px;
}
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
.btn-cancel { padding: 10px 16px; background: var(--color-surface-2); color: var(--color-emerald-100); border-radius: var(--radius-sm); font-size: 14px; cursor: pointer; }
.btn-submit {
  padding: 10px 20px; background: var(--color-lime); color: #0a1a0a;
  border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
}
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-spinner {
  width: 14px; height: 14px; border: 2px solid rgba(10,26,10,0.3);
  border-top-color: #0a1a0a; border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* QR Modal */
.qr-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.qr-title { font-size: 18px; font-weight: 600; color: var(--color-white); }
.qr-sub { font-size: 14px; margin-top: 4px; }
.btn-cancel-sm { background: none; color: var(--color-emerald-100); font-size: 18px; cursor: pointer; }
.btn-cancel-sm:hover { color: var(--color-white); }
.qr-body { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
.qr-canvas-wrap { display: flex; flex-direction: column; gap: 12px; align-items: center; }
.qr-canvas { border-radius: var(--radius-md); flex-shrink: 0; }
.btn-download {
  padding: 10px 20px; background: var(--color-lime); color: #0a1a0a;
  border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; width: 100%;
}
.btn-download:hover { opacity: 0.9; }
.qr-info { display: flex; flex-direction: column; gap: 16px; flex: 1; min-width: 200px; }
.info-item { display: flex; flex-direction: column; gap: 6px; }
.info-lbl { font-size: 12px; color: var(--color-emerald-100); }
.hash-row { display: flex; align-items: center; gap: 8px; }
.info-val-code {
  font-size: 11px; color: var(--color-lime);
  background: var(--color-bg); padding: 8px 10px; border-radius: 6px; word-break: break-all; flex: 1;
}
.btn-copy {
  background: var(--color-surface-2); border: 1px solid var(--color-surface-2);
  border-radius: 6px; padding: 6px 8px; font-size: 14px; cursor: pointer; transition: background 0.2s;
  flex-shrink: 0;
}
.btn-copy:hover { background: #2a4a4a; }
</style>
