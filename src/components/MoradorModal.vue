<!-- Modal reutilizável para criação de morador -->
<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-box">
        <div class="modal-header">
          <h2>Novo Morador</h2>
          <button class="btn-close" @click="$emit('close')">✕</button>
        </div>

        <form @submit.prevent="submit" class="modal-form">
          <div class="field">
            <label>Nome completo</label>
            <input v-model="form.nome" type="text" placeholder="Ex: João Silva" required />
          </div>
          <div class="field">
            <label>E-mail</label>
            <input v-model="form.email" type="email" placeholder="morador@email.com" required />
          </div>
          <div class="field">
            <label>Senha inicial <span class="hint">(padrão: ecoflow123)</span></label>
            <input v-model="form.senha" type="password" placeholder="Deixe vazio para usar padrão" />
          </div>
          <div v-if="props.apartamentoId === undefined" class="field">
            <label>Apartamento</label>
            <select v-model="form.apartamentoId" required>
              <option value="" disabled>Selecione...</option>
              <option v-for="ap in apartamentos" :key="ap.id" :value="ap.id">
                Apto {{ ap.numero }}{{ ap.bloco ? ` / Bloco ${ap.bloco}` : '' }}
              </option>
            </select>
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="$emit('close')">Cancelar</button>
            <button type="submit" class="btn-submit" :disabled="loading">
              {{ loading ? 'Criando...' : 'Criar Morador' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import api from '@/services/api'

const props = defineProps<{
  show: boolean
  apartamentoId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', morador: any): void
}>()

const form = ref({ nome: '', email: '', senha: '', apartamentoId: props.apartamentoId ?? '' })
const apartamentos = ref<any[]>([])
const error = ref('')
const loading = ref(false)

watch(() => props.show, (v) => {
  if (v) {
    form.value = { nome: '', email: '', senha: '', apartamentoId: props.apartamentoId ?? '' }
    error.value = ''
  }
})

onMounted(async () => {
  if (!props.apartamentoId) {
    const { data } = await api.get('/apartamentos')
    apartamentos.value = data
  }
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const payload: any = {
      nome: form.value.nome,
      email: form.value.email,
      apartamentoId: props.apartamentoId ?? form.value.apartamentoId,
    }
    if (form.value.senha) payload.senha = form.value.senha
    const { data } = await api.post('/moradores', payload)
    emit('created', data)
    emit('close')
  } catch (err: any) {
    error.value = err.response?.data?.message ?? 'Erro ao criar morador.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal-box {
  background: var(--color-surface);
  border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-xl);
  width: 100%; max-width: 480px;
  padding: 32px;
  animation: fadeUp 0.2s ease;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px;
}
.modal-header h2 { font-size: 18px; font-weight: 600; color: var(--color-white); }
.btn-close { background: none; color: var(--color-emerald-100); font-size: 18px; }
.btn-close:hover { color: var(--color-white); }

.modal-form { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: var(--color-emerald-100); }
.hint { font-weight: 400; font-size: 12px; color: #4a6a6a; }
.field input, .field select {
  background: var(--color-bg);
  border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  color: var(--color-white);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.field input:focus, .field select:focus { border-color: var(--color-lime); }
.field select option { background: var(--color-bg); }

.error-msg {
  font-size: 13px; color: var(--color-amber);
  background: var(--color-amber-10);
  border: 1px solid var(--color-amber-30);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
}

.modal-footer { display: flex; gap: 12px; margin-top: 8px; }
.btn-cancel {
  flex: 1; padding: 10px;
  background: var(--color-surface-2);
  color: var(--color-emerald-100);
  border-radius: var(--radius-sm);
  font-size: 14px;
}
.btn-cancel:hover { color: var(--color-white); }
.btn-submit {
  flex: 1; padding: 10px;
  background: var(--color-lime);
  color: #0a1a0a;
  border-radius: var(--radius-sm);
  font-size: 14px; font-weight: 600;
}
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
