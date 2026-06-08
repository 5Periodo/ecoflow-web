<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="t in toast.state.toasts"
          :key="t.id"
          class="toast"
          :class="t.type"
          @click="toast.remove(t.id)"
        >
          <span class="toast-icon">{{ icons[t.type] }}</span>
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close" @click.stop="toast.remove(t.id)">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { toast } from '@/services/toast'

const icons = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  pointer-events: all;
  font-size: 14px;
  font-weight: 500;
  transition: transform 0.2s;
}
.toast:hover { transform: translateX(-4px); }

.toast.success {
  background: rgba(125, 211, 33, 0.12);
  border-color: rgba(125, 211, 33, 0.35);
  color: #a8e063;
}
.toast.error {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
  color: #f87171;
}
.toast.warning {
  background: rgba(255, 149, 0, 0.12);
  border-color: rgba(255, 149, 0, 0.35);
  color: #ffb340;
}
.toast.info {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.35);
  color: #93c5fd;
}

.toast-icon { font-size: 16px; flex-shrink: 0; }
.toast-msg  { flex: 1; line-height: 1.4; }
.toast-close {
  background: none;
  border: none;
  color: inherit;
  opacity: 0.5;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
  padding: 2px 4px;
}
.toast-close:hover { opacity: 1; }

/* Transition */
.toast-enter-active { animation: slideIn 0.3s ease; }
.toast-leave-active { animation: slideIn 0.25s ease reverse; }
@keyframes slideIn {
  from { opacity: 0; transform: translateX(100%); }
  to   { opacity: 1; transform: translateX(0); }
}
</style>
