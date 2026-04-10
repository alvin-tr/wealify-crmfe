<template>
  <div class="space-y-3">
    <div class="flex flex-col md:flex-row md:items-start gap-3 filters-container">
      <UInput
        v-model="local.search"
        placeholder="Search leads..."
        title="Search leads"
        icon="i-heroicons-magnifying-glass"
        class="w-full md:w-64"
        @input="commit({ search: local.search })"
      />
      <div class="flex flex-wrap items-center gap-2 w-full">
        <div class="filter-control">
          <USelect
            v-model="local.status"
            :items="statusItems"
            placeholder="Filter by status"
            title="Filter by status"
            class="w-full"
            :disabled="loading"
            @update:model-value="commit({ status: local.status })"
          />
        </div>
        <div class="filter-control">
          <USelect
            v-model="local.stage"
            :items="stageItems"
            placeholder="Filter by stage"
            title="Filter by stage"
            class="w-full"
            :disabled="loading"
            @update:model-value="commit({ stage: local.stage })"
          />
        </div>
        <div class="filter-control">
          <USelect
            v-model="local.source"
            :items="sourceItems"
            placeholder="Filter by source"
            title="Filter by source"
            class="w-full"
            :disabled="loading"
            @update:model-value="commit({ source: local.source })"
          />
        </div>
        <div class="filter-action">
          <UButton
            icon="i-heroicons-arrow-path"
            variant="soft"
            color="primary"
            size="sm"
            :disabled="isPristine"
            aria-label="Reset lead filters"
            @click="$emit('reset')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import type { LeadReferenceItem } from '~/composables/useLeads'

const props = defineProps<{
  reference: { statuses: LeadReferenceItem[]; stages: LeadReferenceItem[]; sources: LeadReferenceItem[] } | null
  filters: { search: string; status: number | null; stage: number | null; source: number | null }
  loading?: boolean
}>()

const emit = defineEmits<{ 'update:filters': [Partial<typeof props.filters>] }>()

const local = reactive({ ...props.filters })

watch(
  () => props.filters,
  (value) => {
    Object.assign(local, value)
  },
  { deep: true },
)

const commit = (patch: Partial<typeof props.filters>) => {
  emit('update:filters', patch)
}

const statusItems = computed(() => {
  const base = [{ label: 'All statuses', value: null as number | null }]
  const items = (props.reference?.statuses || []).map((status) => ({
    label: status.name,
    value: status.id,
  }))
  return [...base, ...items]
})

const stageItems = computed(() => {
  const base = [{ label: 'All stages', value: null as number | null }]
  const items = (props.reference?.stages || []).map((stage) => ({
    label: stage.name,
    value: stage.id,
  }))
  return [...base, ...items]
})

const sourceItems = computed(() => {
  const base = [{ label: 'All sources', value: null as number | null }]
  const items = (props.reference?.sources || []).map((source) => ({
    label: source.name,
    value: source.id,
  }))
  return [...base, ...items]
})

const isPristine = computed(() => {
  return (
    !local.search?.length &&
    (local.status === null || typeof local.status === 'undefined') &&
    (local.stage === null || typeof local.stage === 'undefined') &&
    (local.source === null || typeof local.source === 'undefined')
  )
})
</script>

<style scoped>
.filters-container {
  min-height: 4.5rem;
}

.filter-control {
  width: 100%;
}

@media (min-width: 768px) {
  .filter-control {
    width: 16rem;
  }
}

.filter-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

@media (min-width: 768px) {
  .filter-action {
    width: auto;
  }
}
</style>
