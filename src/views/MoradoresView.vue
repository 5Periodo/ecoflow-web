<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Moradores</h1>
        <p class="page-sub text-muted">Gerencie os moradores do condomínio</p>
      </div>
      <button class="btn-novo" @click="showMoradorModal = true">+ Novo Morador</button>
    </div>

    <div v-if="loading" class="loading">Carregando moradores...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else class="card">
      <div class="table-wrap">
        <table class="apto-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Apartamento</th>
              <th>Nível</th>
              <th>Pontos</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="moradores.length === 0">
              <td colspan="6" class="text-center text-muted">Nenhum morador cadastrado.</td>
            </tr>
            <tr v-for="m in moradores" :key="m.id">
              <td class="font-medium text-white">{{ m.nome }}</td>
              <td>{{ m.email }}</td>
              <td><span class="badge text-lime border-lime">Apto {{ m.apartamento?.numero }}{{ m.apartamento?.bloco ? ' / ' + m.apartamento.bloco : '' }}</span></td>
              <td>
                <div class="nivel-badge">
                  <img :src="'/assets/niveis/' + m.nivel?.icone + '.png'" alt="" class="nivel-icon" @error="$event.target.style.display='none'" />
                  {{ m.nivel?.nome }}
                </div>
              </td>
              <td class="text-lime font-medium">{{ m.pontosTotal }} pts</td>
              <td>
                <button class="btn-edit" @click="abrirEditar(m)">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Editar Morador -->
    <Teleport to="body">
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal-box">
          <div class="modal-header">
            <h2>Editar Morador</h2>
            <button class="btn-close" @click="selected = null">✕</button>
          </div>

          <form @submit.prevent="salvar" class="modal-form">
            <div class="field">
              <label>Nome completo</label>
              <input v-model="form.nome" type="text" required />
            </div>
            <div class="field">
              <label>E-mail</label>
              <input v-model="form.email" type="email" required />
            </div>
            <div class="field">
              <label>Nova Senha <span class="hint">(Deixe vazio para não alterar)</span></label>
              <input v-model="form.senha" type="password" placeholder="••••••••" />
            </div>
            <div class="field">
              <label>Apartamento</label>
              <select v-model="form.apartamentoId" required>
                <option v-for="ap in apartamentos" :key="ap.id" :value="ap.id">
                  Apto {{ ap.numero }}{{ ap.bloco ? ` / Bloco ${ap.bloco}` : '' }}
                </option>
              </select>
            </div>

            <p v-if="editError" class="error-msg">{{ editError }}</p>

            <div class="modal-footer">
              <button type="button" class="btn-delete" @click="confirmarExclusao" :disabled="editLoading">Remover Morador</button>
              <div class="right-actions">
                <button type="button" class="btn-cancel" @click="selected = null">Cancelar</button>
                <button type="submit" class="btn-submit" :disabled="editLoading">
                  {{ editLoading ? 'Salvando...' : 'Salvar Alterações' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal Novo Morador (reutilizado) -->
    <MoradorModal
      :show="showMoradorModal"
      @close="showMoradorModal = false"
      @created="onMoradorCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import MoradorModal from '@/components/MoradorModal.vue'

const loading = ref(true)
const error = ref('')
const moradores = ref<any[]>([])
const apartamentos = ref<any[]>([])

const showMoradorModal = ref(false)

const selected = ref<any>(null)
const form = ref({ nome: '', email: '', senha: '', apartamentoId: '' })
const editLoading = ref(false)
const editError = ref('')

async function carregar() {
  loading.value = true
  try {
    const [resM, resA] = await Promise.all([
      api.get('/moradores'),
      api.get('/apartamentos')
    ])
    moradores.value = resM.data
    apartamentos.value = resA.data
  } catch {
    error.value = 'Erro ao carregar moradores.'
  } finally {
    loading.value = false
  }
}

onMounted(carregar)

function onMoradorCreated() {
  carregar() // Recarrega a lista
}

function abrirEditar(m: any) {
  selected.value = m
  form.value = {
    nome: m.nome,
    email: m.email,
    senha: '',
    apartamentoId: m.apartamento.id || m.apartamentoId
  }
  editError.value = ''
}

async function salvar() {
  editLoading.value = true
  editError.value = ''
  try {
    const payload: any = {
      nome: form.value.nome,
      email: form.value.email,
      apartamentoId: form.value.apartamentoId
    }
    if (form.value.senha) payload.senha = form.value.senha

    await api.patch(`/moradores/${selected.value.id}`, payload)
    
    // Atualiza local
    const m = moradores.value.find(x => x.id === selected.value.id)
    if (m) {
      m.nome = payload.nome
      m.email = payload.email
      if (m.apartamento?.id !== payload.apartamentoId) {
        m.apartamento = apartamentos.value.find(a => a.id === payload.apartamentoId)
      }
    }
    selected.value = null
  } catch (err: any) {
    editError.value = err.response?.data?.message ?? 'Erro ao salvar.'
  } finally {
    editLoading.value = false
  }
}

async function confirmarExclusao() {
  if (!confirm(`Tem certeza que deseja remover ${selected.value.nome}? Todos os descartes e resgates dele serão apagados.`)) return
  
  editLoading.value = true
  try {
    await api.delete(`/moradores/${selected.value.id}`)
    moradores.value = moradores.value.filter(x => x.id !== selected.value.id)
    selected.value = null
  } catch (err: any) {
    editError.value = err.response?.data?.message ?? 'Erro ao excluir.'
  } finally {
    editLoading.value = false
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
}
.btn-novo:hover { opacity: 0.9; }

.loading, .error-state { text-align: center; padding: 60px 0; color: var(--color-emerald-100); }
.error-state { color: var(--color-amber); }

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
.apto-table tr:last-child td { border-bottom: none; }
.apto-table tr:hover td { background: var(--color-surface-2); }
.text-center { text-align: center; }
.text-lime { color: var(--color-lime); }
.font-medium { font-weight: 500; }
.text-white { color: var(--color-white); }

.badge {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px;
  border-radius: 100px; font-size: 12px; font-weight: 600;
  background: var(--color-lime-10); border: 1px solid var(--color-lime-30);
}
.nivel-badge {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px;
  background: var(--color-bg); border: 1px solid var(--color-surface-2);
  border-radius: 100px; font-size: 12px; color: var(--color-white);
}
.nivel-icon { width: 14px; height: 14px; }

.btn-edit {
  background: transparent; border: 1px solid var(--color-emerald-100); color: var(--color-emerald-100);
  padding: 6px 12px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 500;
  transition: all 0.2s;
}
.btn-edit:hover { background: var(--color-emerald-100); color: var(--color-surface); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px);
}
.modal-box {
  background: var(--color-surface); border: 1px solid var(--color-surface-2); border-radius: var(--radius-xl); width: 100%; max-width: 480px; padding: 32px; animation: fadeUp 0.2s ease;
}
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-header h2 { font-size: 18px; font-weight: 600; color: var(--color-white); }
.btn-close { background: none; color: var(--color-emerald-100); font-size: 18px; }
.btn-close:hover { color: var(--color-white); }

.modal-form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: var(--color-emerald-100); }
.hint { font-weight: 400; font-size: 12px; color: #4a6a6a; }
.field input, .field select {
  background: var(--color-bg); border: 1px solid var(--color-surface-2); border-radius: var(--radius-sm); padding: 10px 14px; color: var(--color-white); font-size: 14px; outline: none; transition: border-color 0.2s;
}
.field input:focus, .field select:focus { border-color: var(--color-lime); }
.field select option { background: var(--color-bg); }

.error-msg { font-size: 13px; color: var(--color-amber); background: var(--color-amber-10); border: 1px solid var(--color-amber-30); border-radius: var(--radius-sm); padding: 10px 14px; }

.modal-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
.right-actions { display: flex; gap: 12px; }
.btn-delete {
  padding: 10px 16px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-sm); font-size: 13px; font-weight: 500;
}
.btn-delete:hover { background: rgba(239,68,68,0.2); }
.btn-cancel { padding: 10px 16px; background: var(--color-surface-2); color: var(--color-emerald-100); border-radius: var(--radius-sm); font-size: 14px; }
.btn-submit { padding: 10px 16px; background: var(--color-lime); color: #0a1a0a; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; }
.btn-submit:disabled, .btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
