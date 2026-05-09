<template>
  <div class="onboarding-page">
    <div class="onboarding-card">
      <!-- Logo -->
      <div class="logo">
        <img src="@/assets/logo.png" alt="EcoFlow" class="logo-img" />
      </div>

      <!-- Step: Boas-vindas -->
      <div v-if="step === 1" class="step-content">
        <div class="welcome-icon">🌱</div>
        <h1 class="step-title">Bem-vindo ao EcoFlow!</h1>
        <p class="step-sub">
          Sua plataforma de gestão inteligente de resíduos e gamificação para condomínios.
          Vamos configurar seu condomínio em poucos passos.
        </p>
        <ul class="feature-list">
          <li>✅ Dashboard em tempo real de reciclagem</li>
          <li>✅ Gamificação com pontos para moradores</li>
          <li>✅ Ranking e metas mensais do condomínio</li>
          <li>✅ QR Codes para os pontos de coleta</li>
        </ul>
        <button class="btn-primary" @click="step = 2">
          Configurar meu Condomínio →
        </button>
      </div>

      <!-- Step: Criar Condomínio -->
      <div v-else-if="step === 2" class="step-content">
        <div class="step-badge">Passo 1 de 1</div>
        <h1 class="step-title">Dados do Condomínio</h1>
        <p class="step-sub">Essas informações serão usadas em todo o painel.</p>

        <form @submit.prevent="criarCondominio" class="form">
          <div class="field">
            <label>Nome do Condomínio</label>
            <input v-model="form.nome" type="text" placeholder="Ex: Residencial Jardim Verde" required />
          </div>
          <div class="field">
            <label>Meta mensal de reciclagem (kg)</label>
            <input v-model.number="form.metaMensalKg" type="number" min="1" placeholder="Ex: 1200" required />
            <span class="field-hint">Quantidade de kg que o condomínio deve reciclar por mês</span>
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <div class="form-actions">
            <button type="button" class="btn-ghost" @click="step = 1">← Voltar</button>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Criando...' : 'Criar e Acessar Dashboard' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const step = ref(1)
const loading = ref(false)
const error = ref('')
const form = ref({ nome: '', metaMensalKg: 1200 })

async function criarCondominio() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await api.post('/condominios', form.value)
    // Salva o condominioId criado para atualizar o usuário logado
    const user = JSON.parse(localStorage.getItem('ecoflow_user') || '{}')
    user.condominioId = data.id
    localStorage.setItem('ecoflow_user', JSON.stringify(user))
    localStorage.setItem('ecoflow_onboarding_done', '1')
    router.push('/resumo')
  } catch (err: any) {
    error.value = err.response?.data?.message ?? 'Erro ao criar condomínio. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.onboarding-card {
  background: var(--color-surface);
  border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-xl);
  padding: 48px 40px;
  width: 100%; max-width: 520px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.logo {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}
.logo-img {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.step-content {
  width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.welcome-icon { font-size: 56px; }
.step-badge {
  font-size: 12px; font-weight: 600;
  color: var(--color-lime);
  background: var(--color-lime-10);
  border: 1px solid var(--color-lime-30);
  border-radius: 100px;
  padding: 4px 12px;
}
.step-title { font-size: 22px; font-weight: 700; color: var(--color-white); text-align: center; }
.step-sub { font-size: 14px; color: var(--color-emerald-100); text-align: center; line-height: 1.6; }

.feature-list {
  list-style: none; width: 100%;
  display: flex; flex-direction: column; gap: 8px;
  margin: 8px 0;
}
.feature-list li { font-size: 14px; color: var(--color-emerald-100); }

.form {
  width: 100%; display: flex; flex-direction: column; gap: 16px; margin-top: 8px;
}
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: var(--color-emerald-100); }
.field-hint { font-size: 12px; color: #4a6a6a; }
.field input {
  background: var(--color-bg);
  border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  color: var(--color-white); font-size: 14px; outline: none;
  transition: border-color 0.2s;
}
.field input:focus { border-color: var(--color-lime); }

.error-msg {
  font-size: 13px; color: var(--color-amber);
  background: var(--color-amber-10);
  border: 1px solid var(--color-amber-30);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
}

.form-actions { display: flex; gap: 12px; }

.btn-primary {
  flex: 1; padding: 12px;
  background: var(--color-lime);
  color: #0a1a0a;
  border-radius: var(--radius-sm);
  font-size: 15px; font-weight: 600;
  transition: opacity 0.2s;
}
.btn-primary:hover { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-ghost {
  padding: 12px 20px;
  background: var(--color-surface-2);
  color: var(--color-emerald-100);
  border-radius: var(--radius-sm);
  font-size: 14px;
}
.btn-ghost:hover { color: var(--color-white); }
</style>
