<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="show" class="confirm-overlay" @click.self="cancel">
        <div class="confirm-box" :class="variant">
          <div class="confirm-icon">{{ iconMap[variant] }}</div>
          <h3 class="confirm-title">{{ title }}</h3>
          <p class="confirm-desc">{{ description }}</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="cancel">{{ cancelLabel }}</button>
            <button class="btn-confirm" :class="variant" @click="confirm" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              {{ loading ? 'Aguarde...' : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  show: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}>(), {
  description: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'danger',
  loading: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const iconMap = { danger: '⚠️', warning: '🔔', info: 'ℹ️' }

function confirm() { emit('confirm') }
function cancel()  { emit('cancel') }
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(6px);
}

.confirm-box {
  background: var(--color-surface);
  border: 1px solid var(--color-surface-2);
  border-radius: 20px;
  padding: 36px 32px;
  width: 100%;
  max-width: 440px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}

.confirm-icon { font-size: 40px; line-height: 1; }

.confirm-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-white);
  margin: 0;
}

.confirm-desc {
  font-size: 14px;
  color: var(--color-emerald-100);
  line-height: 1.6;
  margin: 0;
  max-width: 340px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  width: 100%;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  background: var(--color-surface-2);
  color: var(--color-emerald-100);
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-cancel:hover { background: #2a4a4a; }

.btn-confirm {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-confirm.danger  { background: #ef4444; color: white; }
.btn-confirm.warning { background: var(--color-amber); color: #1a0a00; }
.btn-confirm.info    { background: var(--color-lime); color: #0a1a0a; }
.btn-confirm:hover   { opacity: 0.88; }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Transition */
.confirm-enter-active { animation: popIn 0.25s ease; }
.confirm-leave-active { animation: popIn 0.2s ease reverse; }
@keyframes popIn {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
</style>
