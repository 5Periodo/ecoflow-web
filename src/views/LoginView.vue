<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Logo -->
      <div class="logo">
        <span class="logo-eco">Eco</span><span class="logo-flow">Flow</span>
      </div>
      <h1 class="login-title">Painel do Síndico</h1>
      <p class="login-sub">Entre com sua conta para acessar o painel de gestão</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field">
          <label for="email">E-mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="sindico@ecoflow.com"
            autocomplete="email"
            required
          />
        </div>
        <div class="field">
          <label for="senha">Senha</label>
          <input
            id="senha"
            v-model="senha"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button type="submit" class="btn-login" :disabled="loading">
          <span v-if="loading">Entrando...</span>
          <span v-else>Entrar no Painel</span>
        </button>
      </form>

      <p class="login-hint">Credencial de demo: sindico@ecoflow.com / ecoflow123</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const email = ref('sindico@ecoflow.com')
const senha = ref('ecoflow123')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await api.post('/auth/login/admin', { email: email.value, senha: senha.value })
    localStorage.setItem('ecoflow_token', data.access_token)
    localStorage.setItem('ecoflow_user', JSON.stringify(data.user))
    router.push('/resumo')
  } catch {
    error.value = 'E-mail ou senha inválidos. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  background: var(--color-surface);
  border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-xl);
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.logo {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -1px;
  margin-bottom: 16px;
}
.logo-eco  { color: var(--color-lime); }
.logo-flow { color: var(--color-white); }

.login-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-white);
}
.login-sub {
  font-size: 14px;
  color: var(--color-emerald-100);
  text-align: center;
  margin-bottom: 8px;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-emerald-100);
}
.field input {
  background: var(--color-bg);
  border: 1px solid var(--color-surface-2);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 14px;
  color: var(--color-white);
  transition: border-color 0.2s;
  outline: none;
}
.field input::placeholder { color: #5a7a7a; }
.field input:focus { border-color: var(--color-lime); }

.error-msg {
  font-size: 13px;
  color: var(--color-amber);
  background: var(--color-amber-10);
  border: 1px solid var(--color-amber-30);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
}

.btn-login {
  background: var(--color-lime);
  color: #0a1a0a;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  padding: 12px;
  transition: opacity 0.2s, transform 0.1s;
  margin-top: 4px;
}
.btn-login:hover { opacity: 0.9; }
.btn-login:active { transform: scale(0.98); }
.btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

.login-hint {
  font-size: 12px;
  color: #4a6a6a;
  margin-top: 8px;
  text-align: center;
}
</style>
