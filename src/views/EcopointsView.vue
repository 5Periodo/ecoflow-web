<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">EcoPoints</h1>
        <p class="page-sub text-muted">Gerencie os pontos de coleta do condomínio</p>
      </div>
      <button class="btn-novo" @click="showForm = true">+ Novo EcoPoint</button>
    </div>

    <!-- Formulário de criação -->
    <div v-if="showForm" class="form-card">
      <h2 class="form-title">Criar novo EcoPoint</h2>
      <form @submit.prevent="criar" class="form">
        <div class="field">
          <label>Descrição / Nome</label>
          <input v-model="form.descricao" type="text" placeholder="Ex: Ponto de Coleta - Hall Bloco A" required />
        </div>
        <div class="field">
          <label>Localização</label>
          <input v-model="form.localizacao" type="text" placeholder="Ex: Térreo, ao lado da portaria" required />
        </div>
        <p v-if="formError" class="error-msg">{{ formError }}</p>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="showForm = false; formError = ''">Cancelar</button>
          <button type="submit" class="btn-submit" :disabled="formLoading">
            {{ formLoading ? 'Criando...' : 'Criar e Gerar QR Code' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Lista de EcoPoints -->
    <div v-if="loading" class="loading">Carregando EcoPoints...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>
    <div v-else class="ecopoints-grid">
      <div v-for="ep in ecopoints" :key="ep.id" class="ep-card" @click="abrir(ep)">
        <div class="ep-header">
          <div class="ep-icon">📍</div>
          <span class="ep-status" :class="ep.status.toLowerCase()">{{ ep.status }}</span>
        </div>
        <h3 class="ep-title">{{ ep.descricao }}</h3>
        <p class="ep-loc text-muted">{{ ep.localizacao }}</p>
        <code class="ep-hash">{{ ep.qrCodeHash }}</code>
      </div>
    </div>

    <!-- Modal do EcoPoint (Detalhes, Status e QR Code) -->
    <Teleport to="body">
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal-box">
          <div class="qr-header">
            <div>
              <h3 class="qr-title">{{ selected.descricao }}</h3>
              <p class="qr-sub text-muted">{{ selected.localizacao }}</p>
            </div>
            <button class="btn-cancel-sm" @click="selected = null">✕</button>
          </div>
          <div class="qr-body">
            <canvas ref="qrCanvas" class="qr-canvas"></canvas>
            <div class="qr-info">
              <div class="info-item">
                <span class="info-lbl">QR Code Hash</span>
                <code class="info-val-code">{{ selected.qrCodeHash }}</code>
              </div>
              <div class="field">
                <label>Status</label>
                <select v-model="selectedStatus" @change="mudarStatus">
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                  <option value="MANUTENCAO">Em Manutenção</option>
                </select>
              </div>
              <p v-if="statusError" class="error-msg">{{ statusError }}</p>
              <button class="btn-download" @click="downloadQR">⬇ Baixar QR Code</button>
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

const loading = ref(true)
const error = ref('')
const ecopoints = ref<any[]>([])
const showForm = ref(false)
const formLoading = ref(false)
const formError = ref('')
const form = ref({ descricao: '', localizacao: '' })

const selected = ref<any>(null)
const selectedStatus = ref('')
const statusError = ref('')
const qrCanvas = ref<HTMLCanvasElement | null>(null)

async function gerarQR() {
  await nextTick()
  if (!qrCanvas.value || !selected.value) return
  await QRCode.toCanvas(qrCanvas.value, selected.value.qrCodeHash, {
    width: 200,
    color: { dark: '#FFFFFF', light: '#1A3A3A' }
  })
}

watch(selected, (v) => { if (v) gerarQR() })

function downloadQR() {
  if (!qrCanvas.value || !selected.value) return
  const link = document.createElement('a')
  link.download = `ecopoint-${selected.value.qrCodeHash}.png`
  link.href = qrCanvas.value.toDataURL()
  link.click()
}

function abrir(ep: any) {
  selected.value = { ...ep }
  selectedStatus.value = ep.status
  statusError.value = ''
}

async function mudarStatus() {
  if (!selected.value) return
  statusError.value = ''
  try {
    await api.patch(`/ecopoints/${selected.value.id}`, { status: selectedStatus.value })
    selected.value.status = selectedStatus.value
    // Atualiza a lista principal
    const idx = ecopoints.value.findIndex(e => e.id === selected.value.id)
    if (idx !== -1) ecopoints.value[idx].status = selectedStatus.value
  } catch (err: any) {
    statusError.value = err.response?.data?.message ?? 'Erro ao atualizar status.'
    // Reverte visualmente em caso de erro
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
    showForm.value = false
    form.value = { descricao: '', localizacao: '' }
    abrir(data) // Já abre o recém-criado
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
  padding: 10px 20px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600;
}
.btn-novo:hover { opacity: 0.9; }
.loading, .error-state { text-align: center; padding: 60px 0; color: var(--color-emerald-100); }
.error-state { color: var(--color-amber); }
/* Form */
.form-card {
  background: var(--color-surface); border-radius: var(--radius-xl);
  padding: 28px; margin-bottom: 24px; border: 1px solid var(--color-lime-30);
}
.form-title { font-size: 17px; font-weight: 600; color: var(--color-white); margin-bottom: 20px; }
.form { display: flex; flex-direction: column; gap: 16px; }
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
.form-actions { display: flex; gap: 12px; }
.btn-cancel {
  padding: 10px 20px; background: var(--color-surface-2); color: var(--color-emerald-100);
  border-radius: var(--radius-sm); font-size: 14px;
}
.btn-submit {
  flex: 1; padding: 10px; background: var(--color-lime); color: #0a1a0a;
  border-radius: var(--radius-sm); font-size: 14px; font-weight: 600;
}
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

/* Grid */
.ecopoints-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;
}
.ep-card {
  background: var(--color-surface); border-radius: var(--radius-lg);
  padding: 20px; display: flex; flex-direction: column; gap: 8px; cursor: pointer;
  transition: background 0.2s; border: 1px solid transparent;
}
.ep-card:hover { background: var(--color-surface-2); border-color: var(--color-lime-30); }
.ep-header { display: flex; justify-content: space-between; align-items: center; }
.ep-icon { font-size: 24px; }
.ep-status {
  font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 100px; text-transform: uppercase;
}
.ep-status.ativo { background: var(--color-lime-10); color: var(--color-lime); border: 1px solid var(--color-lime-30); }
.ep-status.inativo { background: var(--color-amber-10); color: var(--color-amber); border: 1px solid var(--color-amber-30); }
.ep-status.manutencao { background: rgba(59,130,246,0.1); color: var(--color-blue); border: 1px solid rgba(59,130,246,0.3); }
.ep-title { font-size: 15px; font-weight: 600; color: var(--color-white); }
.ep-loc { font-size: 13px; }
.ep-hash { font-size: 11px; color: var(--color-emerald-100); background: var(--color-bg); padding: 4px 8px; border-radius: 4px; word-break: break-all; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal-box {
  background: var(--color-surface); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-xl); width: 100%; max-width: 520px;
  animation: fadeUp 0.2s ease; padding: 24px;
}
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
.qr-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.qr-title { font-size: 18px; font-weight: 600; color: var(--color-white); }
.qr-sub { font-size: 14px; margin-top: 4px; }
.btn-cancel-sm { background: none; color: var(--color-emerald-100); font-size: 18px; }
.btn-cancel-sm:hover { color: var(--color-white); }
.qr-body { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
.qr-canvas { border-radius: var(--radius-md); flex-shrink: 0; }
.qr-info { display: flex; flex-direction: column; gap: 16px; flex: 1; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-lbl { font-size: 12px; color: var(--color-emerald-100); }
.info-val-code {
  font-size: 12px; color: var(--color-lime);
  background: var(--color-bg); padding: 8px 12px; border-radius: 6px; word-break: break-all;
}
.btn-download {
  padding: 10px 20px; background: var(--color-lime); color: #0a1a0a; margin-top: 8px;
  border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; align-self: flex-start;
}
</style>
