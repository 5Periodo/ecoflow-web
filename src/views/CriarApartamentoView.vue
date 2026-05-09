<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Criar Apartamento</h1>
        <p class="page-sub text-muted">Cadastre um novo apartamento e associe um morador</p>
      </div>
    </div>

    <div class="form-card">
      <form @submit.prevent="submit">
        <section class="section">
          <h2 class="section-title">Dados do Apartamento</h2>
          <div class="field-row">
            <div class="field">
              <label>Número do Apartamento</label>
              <input v-model="form.numero" type="text" placeholder="Ex: 305" required />
            </div>
            <div class="field">
              <label>Bloco <span class="hint">(opcional)</span></label>
              <input v-model="form.bloco" type="text" placeholder="Ex: A" />
            </div>
          </div>
        </section>

        <div class="divider" />

        <section class="section">
          <h2 class="section-title">Morador</h2>
          <div class="tabs">
            <button type="button" :class="['tab', { active: moradorTab === 'existente' }]" @click="moradorTab = 'existente'">
              Selecionar existente
            </button>
            <button type="button" :class="['tab', { active: moradorTab === 'novo' }]" @click="moradorTab = 'novo'">
              Criar novo morador
            </button>
          </div>

          <div v-if="moradorTab === 'existente'" class="field">
            <label>Morador</label>
            <select v-model="form.moradorId">
              <option value="">Sem morador por enquanto</option>
              <option v-for="m in moradores" :key="m.id" :value="m.id">
                {{ m.nome }} — {{ m.email }}
              </option>
            </select>
          </div>

          <div v-else class="novo-morador-preview">
            <p class="text-muted" v-if="!novoMoradorCriado">
              O formulário de criação será aberto ao enviar o apartamento.
            </p>
            <div v-else class="morador-badge">
              ✅ {{ novoMoradorCriado.moradorId ? 'Morador criado!' : novoMoradorCriado.nome }}
            </div>
            <button type="button" class="btn-outline" @click="showMoradorModal = true">
              + Preencher dados do novo morador
            </button>
          </div>
        </section>

        <p v-if="error" class="error-msg">{{ error }}</p>
        <p v-if="success" class="success-msg">{{ success }}</p>

        <div class="form-actions">
          <router-link to="/apartamentos" class="btn-cancel">Cancelar</router-link>
          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? 'Salvando...' : 'Criar Apartamento' }}
          </button>
        </div>
      </form>
    </div>

    <MoradorModal
      :show="showMoradorModal"
      @close="showMoradorModal = false"
      @created="onMoradorCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import MoradorModal from '@/components/MoradorModal.vue'

const router = useRouter()
const moradorTab = ref<'existente' | 'novo'>('existente')
const moradores = ref<any[]>([])
const showMoradorModal = ref(false)
const novoMoradorCriado = ref<any>(null)
const loading = ref(false)
const error = ref('')
const success = ref('')

const form = ref({ numero: '', bloco: '', moradorId: '' })

onMounted(async () => {
  const { data } = await api.get('/moradores')
  moradores.value = data
})

function onMoradorCreated(data: any) {
  novoMoradorCriado.value = data
  showMoradorModal.value = false
}

async function submit() {
  if (moradorTab.value === 'novo' && !novoMoradorCriado.value) {
    showMoradorModal.value = true
    return
  }
  error.value = ''
  loading.value = true
  try {
    const payload: any = { numero: form.value.numero }
    if (form.value.bloco) payload.bloco = form.value.bloco
    const { data } = await api.post('/apartamentos', payload)

    // Se selecionou morador existente, associa via atualização (MVP: morador já tem apartamentoId no cadastro)
    // Para MVP o morador é criado com apartamentoId direto. Aqui abrimos o modal passando o apartamentoId criado.
    success.value = `Apartamento ${data.numero} criado com sucesso!`
    setTimeout(() => router.push('/apartamentos'), 1500)
  } catch (err: any) {
    error.value = err.response?.data?.message ?? 'Erro ao criar apartamento.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 600; color: var(--color-white); }
.page-sub { font-size: 14px; margin-top: 4px; }

.form-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 32px;
  max-width: 680px;
}
.section { margin-bottom: 8px; }
.section-title { font-size: 16px; font-weight: 600; color: var(--color-white); margin-bottom: 16px; }
.divider { height: 1px; background: var(--color-surface-2); margin: 24px 0; }

.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: var(--color-emerald-100); }
.hint { font-weight: 400; font-size: 12px; color: #4a6a6a; }
.field input, .field select {
  background: var(--color-bg);
  border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  color: var(--color-white); font-size: 14px; outline: none;
  transition: border-color 0.2s;
}
.field input:focus, .field select:focus { border-color: var(--color-lime); }
.field select option { background: var(--color-bg); }

.tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.tab {
  padding: 8px 16px; border-radius: 100px; font-size: 13px; font-weight: 500;
  color: var(--color-emerald-100);
  background: var(--color-bg);
  border: 1px solid var(--color-surface-2);
  transition: all 0.2s;
}
.tab.active { background: var(--color-lime-10); color: var(--color-lime); border-color: var(--color-lime-30); }

.novo-morador-preview { display: flex; flex-direction: column; gap: 12px; }
.morador-badge {
  background: var(--color-lime-10); border: 1px solid var(--color-lime-30);
  color: var(--color-lime); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 14px;
}
.btn-outline {
  align-self: flex-start; padding: 8px 16px;
  background: transparent; border: 1px solid var(--color-lime-30);
  color: var(--color-lime); border-radius: var(--radius-sm); font-size: 13px; font-weight: 500;
}
.btn-outline:hover { background: var(--color-lime-10); }

.error-msg {
  font-size: 13px; color: var(--color-amber);
  background: var(--color-amber-10); border: 1px solid var(--color-amber-30);
  border-radius: var(--radius-sm); padding: 10px 14px; margin-top: 8px;
}
.success-msg {
  font-size: 13px; color: var(--color-lime);
  background: var(--color-lime-10); border: 1px solid var(--color-lime-30);
  border-radius: var(--radius-sm); padding: 10px 14px; margin-top: 8px;
}

.form-actions { display: flex; gap: 12px; margin-top: 24px; }
.btn-cancel {
  padding: 10px 20px;
  background: var(--color-surface-2);
  color: var(--color-emerald-100);
  border-radius: var(--radius-sm); font-size: 14px; display: flex; align-items: center;
}
.btn-submit {
  flex: 1; padding: 10px;
  background: var(--color-lime);
  color: #0a1a0a;
  border-radius: var(--radius-sm); font-size: 14px; font-weight: 600;
}
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
