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
      <button :class="['tab-btn', { active: currentTab === 'resgates' }]" @click="currentTab = 'resgates'">Histórico de Resgates</button>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="loading">Carregando dados...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else>
      <!-- TAB: Catálogo de Recompensas -->
      <div v-if="currentTab === 'catalogo'" class="grid">
        <div v-if="recompensas.length === 0" class="empty">Nenhuma recompensa cadastrada.</div>
        
        <div v-for="r in recompensas" :key="r.id" class="recompensa-card">
          <div class="card-status" :class="r.status.toLowerCase()">{{ r.status }}</div>
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
          
          <button class="btn-edit-card" @click="abrirEditarRecompensa(r)">Editar / Pausar</button>
        </div>
      </div>

      <!-- TAB: Histórico de Resgates -->
      <div v-else-if="currentTab === 'resgates'" class="card">
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
              <tr v-if="resgates.length === 0">
                <td colspan="7" class="text-center text-muted">Nenhum resgate encontrado.</td>
              </tr>
              <tr v-for="res in resgates" :key="res.id">
                <td>{{ fmtDate(res.resgatadoEm) }}</td>
                <td class="font-medium text-white">{{ res.morador?.nome }}</td>
                <td>Apto {{ res.morador?.apartamento?.numero }}</td>
                <td>{{ res.recompensa?.titulo }}</td>
                <td><span class="code-badge">{{ res.codigoCupom }}</span></td>
                <td>
                  <span class="status-badge" :class="res.status.toLowerCase()">{{ res.status }}</span>
                </td>
                <td>
                  <button v-if="res.status === 'PENDENTE'" class="btn-utilizar" @click="marcarUtilizado(res.id)">
                    Marcar Utilizado
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Recompensa -->
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
                  <option value="DESCONTO_CONDOMINIO">Desconto no Condomínio</option>
                  <option value="CUPOM_PARCEIRO">Cupom de Parceiro</option>
                </select>
              </div>
              <div class="field">
                <label>Custo em Pontos</label>
                <input v-model.number="form.custoPontos" type="number" min="1" required />
              </div>
            </div>

            <div class="grid-2">
              <div class="field">
                <label>Quantidade Disponível</label>
                <input v-model.number="form.quantidadeDisponivel" type="number" min="-1" />
                <span class="hint">-1 para ilimitado</span>
              </div>
              <div class="field" v-if="form.id">
                <label>Status</label>
                <select v-model="form.status" required>
                  <option value="ATIVA">Ativa</option>
                  <option value="PAUSADA">Pausada</option>
                  <option value="ENCERRADA">Encerrada</option>
                </select>
              </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '@/services/api'

const currentTab = ref('catalogo')
const loading = ref(true)
const error = ref('')

const recompensas = ref<any[]>([])
const resgates = ref<any[]>([])

// Modal form
const showModal = ref(false)
const modalLoading = ref(false)
const modalError = ref('')
const form = ref<any>({})

function resetForm() {
  form.value = {
    id: null,
    titulo: '',
    descricao: '',
    tipo: 'DESCONTO_CONDOMINIO',
    custoPontos: 100,
    quantidadeDisponivel: -1,
    status: 'ATIVA'
  }
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
  } catch (err) {
    error.value = 'Erro ao carregar dados. Tente novamente.'
  } finally {
    loading.value = false
  }
}

onMounted(carregarDados)
watch(currentTab, carregarDados)

const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })

function abrirNovaRecompensa() {
  resetForm()
  showModal.value = true
}

function abrirEditarRecompensa(r: any) {
  form.value = { ...r }
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
      quantidadeDisponivel: form.value.quantidadeDisponivel,
      status: form.value.status
    }

    if (form.value.id) {
      await api.patch(`/recompensas/${form.value.id}`, payload)
    } else {
      await api.post('/recompensas', payload)
    }
    await carregarDados()
    fecharModal()
  } catch (err: any) {
    modalError.value = err.response?.data?.message ?? 'Erro ao salvar recompensa.'
  } finally {
    modalLoading.value = false
  }
}

async function marcarUtilizado(id: string) {
  if (!confirm('Confirmar que este resgate foi entregue/utilizado pelo morador?')) return
  try {
    await api.patch(`/recompensas/admin/resgates/${id}/utilizar`)
    await carregarDados()
  } catch (err) {
    alert('Erro ao marcar como utilizado.')
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
  transition: opacity 0.2s;
}
.btn-novo:hover { opacity: 0.9; }

.tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--color-surface-2); padding-bottom: 16px; }
.tab-btn {
  background: transparent; color: var(--color-emerald-100); border: none;
  font-size: 15px; font-weight: 500; padding: 8px 16px; border-radius: var(--radius-sm);
  transition: all 0.2s;
}
.tab-btn:hover { color: var(--color-white); background: var(--color-surface-2); }
.tab-btn.active { color: var(--color-lime); background: var(--color-lime-10); }

.loading, .error-state, .empty { text-align: center; padding: 60px 0; color: var(--color-emerald-100); }
.error-state { color: var(--color-amber); }

/* Grid de Recompensas */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.recompensa-card {
  background: var(--color-surface); border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-xl); padding: 24px; position: relative;
  display: flex; flex-direction: column; gap: 12px;
}
.card-status {
  position: absolute; top: 16px; right: 16px; font-size: 11px; font-weight: 700;
  padding: 4px 8px; border-radius: 100px;
}
.card-status.ativa { background: var(--color-lime-10); color: var(--color-lime); }
.card-status.pausada { background: var(--color-amber-10); color: var(--color-amber); }
.card-status.encerrada { background: rgba(239,68,68,0.1); color: #ef4444; }

.card-icon { font-size: 32px; background: var(--color-surface-2); width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.card-title { font-size: 18px; font-weight: 600; color: var(--color-white); margin-top: 4px; }
.card-desc { font-size: 13px; line-height: 1.5; flex: 1; }
.card-meta { display: flex; gap: 12px; margin-top: 8px; }
.meta-item { font-size: 13px; font-weight: 500; color: var(--color-white); display: flex; align-items: center; gap: 4px; }
.meta-item .icon { opacity: 0.7; }
.btn-edit-card {
  margin-top: 12px; background: transparent; border: 1px solid var(--color-emerald-100);
  color: var(--color-emerald-100); padding: 8px; border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 500; transition: all 0.2s; text-align: center;
}
.btn-edit-card:hover { background: var(--color-emerald-100); color: var(--color-surface); }

/* Tabela de Resgates */
.card { background: var(--color-surface); border-radius: var(--radius-xl); padding: 24px; }
.table-wrap { overflow-x: auto; }
.apto-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.apto-table th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 500; color: var(--color-emerald-100); border-bottom: 1px solid var(--color-surface-2); }
.apto-table td { padding: 14px 16px; color: var(--color-emerald-100); border-bottom: 1px solid var(--color-surface-2); }
.apto-table tr:hover td { background: var(--color-surface-2); }
.code-badge { background: var(--color-surface-2); color: var(--color-white); padding: 4px 8px; border-radius: 4px; font-family: monospace; letter-spacing: 1px; font-size: 13px; }
.status-badge { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 100px; }
.status-badge.pendente { background: var(--color-amber-10); color: var(--color-amber); border: 1px solid var(--color-amber-30); }
.status-badge.utilizado { background: var(--color-lime-10); color: var(--color-lime); border: 1px solid var(--color-lime-30); }
.btn-utilizar {
  background: var(--color-lime); color: #0a1a0a; border: none; padding: 6px 12px;
  border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;
}
.btn-utilizar:hover { opacity: 0.9; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-box { background: var(--color-surface); border: 1px solid var(--color-surface-2); border-radius: var(--radius-xl); width: 100%; max-width: 500px; padding: 32px; animation: fadeUp 0.2s ease; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-header h2 { font-size: 18px; font-weight: 600; color: var(--color-white); }
.btn-close { background: none; color: var(--color-emerald-100); font-size: 18px; }

.modal-form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: var(--color-emerald-100); }
.hint { font-size: 12px; color: #4a6a6a; font-weight: 400; }
.field input, .field select, .field textarea {
  background: var(--color-bg); border: 1px solid var(--color-surface-2); border-radius: var(--radius-sm);
  padding: 10px 14px; color: var(--color-white); font-size: 14px; outline: none; transition: border-color 0.2s; font-family: inherit;
}
.field input:focus, .field select:focus, .field textarea:focus { border-color: var(--color-lime); }
.field select option { background: var(--color-bg); }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.error-msg { font-size: 13px; color: var(--color-amber); background: var(--color-amber-10); border: 1px solid var(--color-amber-30); border-radius: var(--radius-sm); padding: 10px 14px; }

.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.btn-cancel { padding: 10px 16px; background: var(--color-surface-2); color: var(--color-emerald-100); border-radius: var(--radius-sm); font-size: 14px; }
.btn-submit { padding: 10px 16px; background: var(--color-lime); color: #0a1a0a; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
