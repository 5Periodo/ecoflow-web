<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Recompensas</h1>
        <p class="page-sub text-muted">Gerencie o catálogo de recompensas e os resgates dos moradores</p>
      </div>
      <div class="header-actions">
        <button class="btn-novo" @click="abrirNovaRecompensa">+ Nova Recompensa</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="['tab-btn', { active: currentTab === 'catalogo' }]" @click="currentTab = 'catalogo'">Catálogo</button>
      <button :class="['tab-btn', { active: currentTab === 'resgates' }]" @click="currentTab = 'resgates'">
        Histórico de Resgates
        <span v-if="resgatesPendentesCount > 0" class="tab-badge">{{ resgatesPendentesCount }}</span>
      </button>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="loading-skeleton">
      <div v-for="n in 4" :key="n" class="skel-card"></div>
    </div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else>
      <!-- TAB: Catálogo -->
      <div v-if="currentTab === 'catalogo'" class="grid">
        <div v-if="recompensas.length === 0" class="empty-state">
          <div class="empty-icon">🎁</div>
          <h3>Nenhuma recompensa cadastrada</h3>
          <p>Crie recompensas para incentivar a reciclagem dos moradores.</p>
          <button class="btn-novo" @click="abrirNovaRecompensa">+ Criar primeira recompensa</button>
        </div>

        <div v-for="r in recompensas" :key="r.id" class="recompensa-card">
          <div class="card-status-badge" :class="r.status.toLowerCase()">{{ STATUS_LABELS[r.status] ?? r.status }}</div>
          <div class="card-icon">{{ r.tipo === 'CUPOM_PARCEIRO' ? '🎟️' : '💰' }}</div>
          <h3 class="card-title">{{ r.titulo }}</h3>
          <p class="card-desc text-muted">{{ r.descricao }}</p>

          <div class="card-meta">
            <span class="meta-item"><span class="icon">✨</span> {{ r.custoPontos }} pts</span>
            <span class="meta-item" v-if="r.quantidadeDisponivel !== -1">
              <span class="icon">📦</span> {{ r.quantidadeDisponivel }} restam
            </span>
            <span class="meta-item" v-else><span class="icon">📦</span> Ilimitado</span>
          </div>

          <!-- Ações separadas: Editar vs. Pausar/Reativar -->
          <div class="card-actions">
            <button class="btn-editar-card" @click="abrirEditarRecompensa(r)">✏️ Editar</button>
            <button
              v-if="r.status === 'ATIVA'"
              class="btn-pausar-card"
              @click="toggleStatus(r, 'PAUSADA')"
            >⏸ Pausar</button>
            <button
              v-else-if="r.status === 'PAUSADA'"
              class="btn-reativar-card"
              @click="toggleStatus(r, 'ATIVA')"
            >▶ Reativar</button>
          </div>
        </div>
      </div>

      <!-- TAB: Resgates -->
      <div v-else-if="currentTab === 'resgates'">
        <!-- Sub-filtro de status -->
        <div class="sub-tabs">
          <button :class="['sub-btn', { active: filtroResgate === '' }]" @click="filtroResgate = ''">
            Todos ({{ resgates.length }})
          </button>
          <button :class="['sub-btn', { active: filtroResgate === 'PENDENTE' }]" @click="filtroResgate = 'PENDENTE'">
            Pendentes
            <span v-if="resgatesPendentesCount > 0" class="badge-count">{{ resgatesPendentesCount }}</span>
          </button>
          <button :class="['sub-btn', { active: filtroResgate === 'UTILIZADO' }]" @click="filtroResgate = 'UTILIZADO'">
            Utilizados
          </button>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table class="apto-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Morador</th>
                  <th>Apto</th>
                  <th>Recompensa</th>
                  <th>Código / Cupom</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="resgatesFiltrados.length === 0">
                  <td colspan="7" class="text-center text-muted">Nenhum resgate encontrado.</td>
                </tr>
                <tr v-for="res in resgatesFiltrados" :key="res.id">
                  <td>{{ fmtDate(res.resgatadoEm) }}</td>
                  <td class="font-medium text-white">{{ res.morador?.nome }}</td>
                  <td>Apto {{ res.morador?.apartamento?.numero }}</td>
                  <td>{{ res.recompensa?.titulo }}</td>
                  <td><span class="code-badge">{{ res.codigoCupom }}</span></td>
                  <td>
                    <span class="status-badge" :class="res.status.toLowerCase()">
                      {{ STATUS_RESGATE_LABELS[res.status] ?? res.status }}
                    </span>
                  </td>
                  <td>
                    <button v-if="res.status === 'PENDENTE'" class="btn-utilizar" @click="pedirMarcarUtilizado(res)">
                      Marcar Utilizado
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Recompensa -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="fecharModal">
        <div class="modal-box">
          <div class="modal-header">
            <h2>{{ form.id ? 'Editar Recompensa' : 'Nova Recompensa' }}</h2>
            <button class="btn-close" @click="fecharModal">✕</button>
          </div>

          <form @submit.prevent="salvarRecompensa" class="modal-form">
            <div class="field">
              <label>Título</label>
              <input v-model="form.titulo" type="text" placeholder="Ex: Desconto de 10% na taxa" required />
            </div>

            <div class="field">
              <label>Descrição</label>
              <textarea v-model="form.descricao" placeholder="Detalhes de como funciona o resgate..." required rows="3"></textarea>
            </div>

            <div class="grid-2">
              <div class="field">
                <label>Tipo</label>
                <select v-model="form.tipo" required>
                  <option value="DESCONTO_CONDOMINIO">💰 Desconto no Condomínio</option>
                  <option value="CUPOM_PARCEIRO">🎟️ Cupom de Parceiro</option>
                </select>
              </div>
              <div class="field">
                <label>Custo em Pontos</label>
                <input v-model.number="form.custoPontos" type="number" min="1" required />
              </div>
            </div>

            <div class="field">
              <label>Quantidade disponível</label>
              <div class="qty-row">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="ilimitado" @change="onIlimitadoChange" />
                  <span>Ilimitado</span>
                </label>
                <input
                  v-if="!ilimitado"
                  v-model.number="form.quantidadeDisponivel"
                  type="number" min="1"
                  placeholder="Ex: 10"
                />
              </div>
            </div>

            <div class="field" v-if="form.id">
              <label>Status</label>
              <select v-model="form.status" required>
                <option value="ATIVA">✅ Ativa</option>
                <option value="PAUSADA">⏸ Pausada</option>
                <option value="ENCERRADA">🔴 Encerrada</option>
              </select>
            </div>

            <p v-if="modalError" class="error-msg">{{ modalError }}</p>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" @click="fecharModal">Cancelar</button>
              <button type="submit" class="btn-submit" :disabled="modalLoading">
                {{ modalLoading ? 'Salvando...' : 'Salvar Recompensa' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Confirm: marcar utilizado -->
    <ConfirmModal
      :show="showConfirmUtilizar"
      title="Confirmar entrega?"
      :description="`Confirmar que o resgate de '${resgateParaUtilizar?.recompensa?.titulo}' de ${resgateParaUtilizar?.morador?.nome} foi entregue/utilizado?`"
      confirm-label="Confirmar entrega"
      variant="info"
      @confirm="confirmarMarcarUtilizado"
      @cancel="showConfirmUtilizar = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { toast } from '@/services/toast'

const STATUS_LABELS: Record<string, string> = {
  ATIVA: 'Ativa', PAUSADA: 'Pausada', ENCERRADA: 'Encerrada'
}
const STATUS_RESGATE_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente', UTILIZADO: 'Utilizado', CANCELADO: 'Cancelado'
}

const currentTab   = ref('catalogo')
const loading      = ref(true)
const error        = ref('')
const filtroResgate = ref('')

const recompensas = ref<any[]>([])
const resgates    = ref<any[]>([])

const showModal    = ref(false)
const modalLoading = ref(false)
const modalError   = ref('')
const form = ref<any>({})
const ilimitado    = ref(false)

const showConfirmUtilizar    = ref(false)
const resgateParaUtilizar    = ref<any>(null)

const resgatesPendentesCount = computed(() => resgates.value.filter(r => r.status === 'PENDENTE').length)
const resgatesFiltrados      = computed(() =>
  filtroResgate.value
    ? resgates.value.filter(r => r.status === filtroResgate.value)
    : resgates.value
)

function resetForm() {
  form.value = {
    id: null, titulo: '', descricao: '',
    tipo: 'DESCONTO_CONDOMINIO', custoPontos: 100,
    quantidadeDisponivel: -1, status: 'ATIVA'
  }
  ilimitado.value = true
}

function onIlimitadoChange() {
  form.value.quantidadeDisponivel = ilimitado.value ? -1 : 10
}

async function carregarDados() {
  loading.value = true
  error.value = ''
  try {
    if (currentTab.value === 'catalogo') {
      const { data } = await api.get('/recompensas')
      recompensas.value = data
    } else {
      const { data } = await api.get('/recompensas/admin/resgates')
      resgates.value = data
    }
  } catch {
    error.value = 'Erro ao carregar dados. Tente novamente.'
  } finally {
    loading.value = false
  }
}

// Pré-carrega resgates para mostrar badge na tab
async function carregarResgatesCount() {
  try {
    const { data } = await api.get('/recompensas/admin/resgates')
    resgates.value = data
  } catch { /* silent */ }
}

onMounted(async () => {
  await carregarDados()
  carregarResgatesCount()
})
watch(currentTab, carregarDados)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function abrirNovaRecompensa() {
  resetForm()
  showModal.value = true
}

function abrirEditarRecompensa(r: any) {
  form.value = { ...r }
  ilimitado.value = r.quantidadeDisponivel === -1
  showModal.value = true
}

function fecharModal() {
  showModal.value = false
  modalError.value = ''
}

async function salvarRecompensa() {
  modalLoading.value = true
  modalError.value = ''
  try {
    const payload = {
      titulo: form.value.titulo,
      descricao: form.value.descricao,
      tipo: form.value.tipo,
      custoPontos: form.value.custoPontos,
      quantidadeDisponivel: ilimitado.value ? -1 : form.value.quantidadeDisponivel,
      status: form.value.status ?? 'ATIVA'
    }

    if (form.value.id) {
      await api.patch(`/recompensas/${form.value.id}`, payload)
      toast.success(`✅ Recompensa "${payload.titulo}" atualizada`)
    } else {
      await api.post('/recompensas', payload)
      toast.success(`🎁 Recompensa "${payload.titulo}" criada com sucesso`)
    }
    await carregarDados()
    fecharModal()
  } catch (err: any) {
    modalError.value = err.response?.data?.message ?? 'Erro ao salvar recompensa.'
  } finally {
    modalLoading.value = false
  }
}

async function toggleStatus(r: any, novoStatus: string) {
  try {
    await api.patch(`/recompensas/${r.id}`, { status: novoStatus })
    r.status = novoStatus
    const label = novoStatus === 'PAUSADA' ? '⏸ Recompensa pausada' : '▶ Recompensa reativada'
    toast.info(label)
  } catch {
    toast.error('Erro ao atualizar status da recompensa.')
  }
}

function pedirMarcarUtilizado(res: any) {
  resgateParaUtilizar.value = res
  showConfirmUtilizar.value = true
}

async function confirmarMarcarUtilizado() {
  try {
    await api.patch(`/recompensas/admin/resgates/${resgateParaUtilizar.value.id}/utilizar`)
    resgateParaUtilizar.value.status = 'UTILIZADO'
    showConfirmUtilizar.value = false
    toast.success(`✅ Resgate de ${resgateParaUtilizar.value.morador?.nome} marcado como utilizado`)
    resgateParaUtilizar.value = null
    await carregarDados()
  } catch {
    toast.error('Erro ao marcar resgate como utilizado.')
    showConfirmUtilizar.value = false
  }
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 600; color: var(--color-white); }
.page-sub { font-size: 14px; margin-top: 4px; }
.btn-novo {
  background: var(--color-lime); color: #0a1a0a;
  padding: 10px 20px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600;
  transition: opacity 0.2s; cursor: pointer;
}
.btn-novo:hover { opacity: 0.9; }

/* Tabs */
.tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--color-surface-2); padding-bottom: 0; }
.tab-btn {
  background: transparent; color: var(--color-emerald-100); border: none;
  font-size: 15px; font-weight: 500; padding: 10px 16px; border-bottom: 2px solid transparent;
  transition: all 0.2s; cursor: pointer; display: flex; align-items: center; gap: 6px; margin-bottom: -1px;
}
.tab-btn:hover { color: var(--color-white); }
.tab-btn.active { color: var(--color-lime); border-bottom-color: var(--color-lime); }
.tab-badge {
  background: var(--color-amber); color: #1a0a00;
  border-radius: 100px; padding: 1px 7px; font-size: 11px; font-weight: 700;
  animation: pulse-badge 2s infinite;
}
@keyframes pulse-badge {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,149,0,0.4); }
  50% { box-shadow: 0 0 0 4px rgba(255,149,0,0); }
}

/* Sub-tabs para resgates */
.sub-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.sub-btn {
  padding: 7px 16px; border-radius: 100px; font-size: 13px; font-weight: 500;
  color: var(--color-emerald-100); background: var(--color-surface);
  border: 1px solid var(--color-surface-2); transition: all 0.2s; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
}
.sub-btn.active { background: var(--color-lime-10); color: var(--color-lime); border-color: var(--color-lime-30); }
.badge-count {
  background: var(--color-amber); color: #1a0a00;
  border-radius: 100px; padding: 1px 6px; font-size: 11px; font-weight: 700;
}

/* Skeleton */
.loading-skeleton { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.skel-card {
  height: 220px; border-radius: var(--radius-xl);
  background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-2) 50%, var(--color-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.error-state { text-align: center; padding: 60px 0; color: var(--color-amber); }

/* Empty state */
.empty-state {
  grid-column: 1 / -1;
  text-align: center; padding: 60px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.empty-icon { font-size: 48px; }
.empty-state h3 { font-size: 20px; font-weight: 600; color: var(--color-white); margin: 0; }
.empty-state p  { font-size: 14px; color: var(--color-emerald-100); margin: 0; }

/* Grid de Recompensas */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.recompensa-card {
  background: var(--color-surface); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-xl); padding: 24px; position: relative;
  display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s;
}
.recompensa-card:hover { transform: translateY(-2px); }

.card-status-badge {
  position: absolute; top: 16px; right: 16px;
  font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 100px;
}
.card-status-badge.ativa    { background: var(--color-lime-10); color: var(--color-lime); }
.card-status-badge.pausada  { background: var(--color-amber-10); color: var(--color-amber); }
.card-status-badge.encerrada{ background: rgba(239,68,68,0.1); color: #ef4444; }

.card-icon { font-size: 32px; background: var(--color-surface-2); width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.card-title { font-size: 18px; font-weight: 600; color: var(--color-white); margin-top: 4px; }
.card-desc { font-size: 13px; line-height: 1.5; flex: 1; }
.card-meta { display: flex; gap: 12px; margin-top: 4px; flex-wrap: wrap; }
.meta-item { font-size: 13px; font-weight: 500; color: var(--color-white); display: flex; align-items: center; gap: 4px; }
.meta-item .icon { opacity: 0.7; }

.card-actions { display: flex; gap: 8px; margin-top: 4px; }
.btn-editar-card, .btn-pausar-card, .btn-reativar-card {
  flex: 1; padding: 8px; border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 500; transition: all 0.2s; cursor: pointer; text-align: center;
}
.btn-editar-card {
  background: transparent; border: 1px solid var(--color-emerald-100); color: var(--color-emerald-100);
}
.btn-editar-card:hover { background: var(--color-emerald-100); color: var(--color-surface); }
.btn-pausar-card {
  background: var(--color-amber-10); border: 1px solid var(--color-amber-30); color: var(--color-amber);
}
.btn-pausar-card:hover { background: rgba(255,149,0,0.15); }
.btn-reativar-card {
  background: var(--color-lime-10); border: 1px solid var(--color-lime-30); color: var(--color-lime);
}
.btn-reativar-card:hover { background: rgba(125,211,33,0.15); }

/* Tabela de Resgates */
.card { background: var(--color-surface); border-radius: var(--radius-xl); padding: 24px; }
.table-wrap { overflow-x: auto; }
.apto-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.apto-table th {
  text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 500;
  color: var(--color-emerald-100); border-bottom: 1px solid var(--color-surface-2);
}
.apto-table td {
  padding: 14px 16px; color: var(--color-emerald-100); border-bottom: 1px solid var(--color-surface-2);
}
.apto-table tr:hover td { background: var(--color-surface-2); }
.text-center { text-align: center; }
.font-medium { font-weight: 500; }
.text-white { color: var(--color-white); }
.code-badge {
  background: var(--color-surface-2); color: var(--color-white);
  padding: 4px 8px; border-radius: 4px; font-family: monospace; letter-spacing: 1px; font-size: 13px;
}
.status-badge { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 100px; }
.status-badge.pendente  { background: var(--color-amber-10); color: var(--color-amber); border: 1px solid var(--color-amber-30); }
.status-badge.utilizado { background: var(--color-lime-10); color: var(--color-lime); border: 1px solid var(--color-lime-30); }
.btn-utilizar {
  background: var(--color-lime); color: #0a1a0a; border: none;
  padding: 6px 12px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: opacity 0.2s;
}
.btn-utilizar:hover { opacity: 0.9; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.modal-box {
  background: var(--color-surface); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-xl); width: 100%; max-width: 520px; padding: 32px;
  animation: fadeUp 0.2s ease; max-height: 90vh; overflow-y: auto;
}
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-header h2 { font-size: 18px; font-weight: 600; color: var(--color-white); }
.btn-close { background: none; color: var(--color-emerald-100); font-size: 18px; cursor: pointer; }
.modal-form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: var(--color-emerald-100); }
.field input, .field select, .field textarea {
  background: var(--color-bg); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm); padding: 10px 14px; color: var(--color-white);
  font-size: 14px; outline: none; transition: border-color 0.2s; font-family: inherit;
}
.field input:focus, .field select:focus, .field textarea:focus { border-color: var(--color-lime); }
.field select option { background: var(--color-bg); }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* Quantidade ilimitado */
.qty-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--color-white); cursor: pointer; white-space: nowrap; }
.checkbox-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--color-lime); cursor: pointer; }
.qty-row input[type="number"] { flex: 1; min-width: 100px; }

.error-msg {
  font-size: 13px; color: var(--color-amber); background: var(--color-amber-10);
  border: 1px solid var(--color-amber-30); border-radius: var(--radius-sm); padding: 10px 14px;
}
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.btn-cancel { padding: 10px 16px; background: var(--color-surface-2); color: var(--color-emerald-100); border-radius: var(--radius-sm); font-size: 14px; cursor: pointer; }
.btn-submit { padding: 10px 16px; background: var(--color-lime); color: #0a1a0a; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
