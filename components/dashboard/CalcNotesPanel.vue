<template>
  <div class="calc-notes-panel crm-dashboard-theme">
    <button class="calc-toggle" @click="open = !open">
      <span class="calc-toggle-icon">{{ open ? '▼' : '▶' }}</span>
      <span>📐 Ghi chú cách tính các chỉ số</span>
    </button>
    <transition name="slide">
      <div v-if="open" class="calc-body">
        <slot />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const open = ref(false);
</script>

<style scoped>
.calc-notes-panel { margin-top: 20px; border: 1px solid var(--border, rgba(148,163,184,.15)); border-radius: 12px; background: var(--card, rgba(30,41,59,.5)); overflow: hidden; }
.calc-toggle { display: flex; align-items: center; gap: 8px; width: 100%; padding: 12px 18px; background: transparent; border: none; color: var(--text-dim, #94a3b8); font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .2s; text-align: left; }
.calc-toggle:hover { color: var(--purple-light, #a78bfa); background: rgba(124,58,237,.05); }
.calc-toggle-icon { font-size: .65rem; width: 14px; transition: transform .2s; }
.calc-body { padding: 0 18px 18px; font-size: .76rem; color: var(--text-muted, #94a3b8); line-height: 1.65; }
.calc-body :deep(table) { width: 100%; border-collapse: collapse; margin-top: 8px; }
.calc-body :deep(th) { text-align: left; padding: 8px 10px; background: rgba(124,58,237,.08); color: var(--purple-light, #a78bfa); font-size: .72rem; font-weight: 600; border-bottom: 1px solid rgba(148,163,184,.1); }
.calc-body :deep(td) { padding: 6px 10px; border-bottom: 1px solid rgba(148,163,184,.06); vertical-align: top; }
.calc-body :deep(td:first-child) { font-weight: 600; color: var(--text, #e2e8f0); white-space: nowrap; min-width: 160px; }
.calc-body :deep(code) { background: rgba(124,58,237,.1); color: var(--cyan, #67e8f9); padding: 1px 5px; border-radius: 4px; font-size: .7rem; }
.calc-body :deep(.warn) { color: #f59e0b; font-style: italic; }

.slide-enter-active, .slide-leave-active { transition: all .25s ease; max-height: 800px; overflow: hidden; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; }
</style>
