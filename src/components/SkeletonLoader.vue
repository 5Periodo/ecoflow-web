<template>
  <div class="skeleton-wrap" :style="{ height: height || 'auto' }">
    <slot v-if="!loading" />
    <template v-else>
      <div v-for="n in rows" :key="n" class="skeleton-row" :style="{ height: rowHeight }"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  loading: boolean
  rows?: number
  rowHeight?: string
  height?: string
}>(), {
  rows: 1,
  rowHeight: '20px',
})
</script>

<style scoped>
.skeleton-wrap { display: flex; flex-direction: column; gap: 10px; }
.skeleton-row {
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    var(--color-surface) 25%,
    var(--color-surface-2) 50%,
    var(--color-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  width: 100%;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
