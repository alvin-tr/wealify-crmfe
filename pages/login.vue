<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="bg-white shadow-xl rounded-2xl p-8 space-y-8">
        <div class="space-y-2 text-center">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
            <UIcon name="i-heroicons-lock-closed" class="w-7 h-7" />
          </div>
          <h1 class="text-2xl font-semibold text-gray-900">Sign in to CRM</h1>
          <p class="text-sm text-gray-500">Enter your credentials to access the dashboard.</p>
        </div>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="flex flex-col gap-2">
            <label for="username" class="text-sm font-medium text-gray-700">Username</label>
            <UInput
              id="username"
              v-model="form.username"
              size="lg"
              placeholder="Enter your username"
              icon="i-heroicons-user"
              autocomplete="username"
              :disabled="isSubmitting"
              :ui="inputUi"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-medium text-gray-700">Password</label>
            <UInput
              id="password"
              v-model="form.password"
              type="password"
              size="lg"
              placeholder="Enter your password"
              icon="i-heroicons-key"
              autocomplete="current-password"
              :disabled="isSubmitting"
              :ui="inputUi"
            />
          </div>

          <div v-if="errorMessage" class="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {{ errorMessage }}
          </div>

          <UButton
            type="submit"
            color="primary"
            size="lg"
            block
            :loading="isSubmitting"
          :disabled="!canSubmit"
            icon="i-heroicons-arrow-right-on-rectangle"
          >
            Sign in
          </UButton>
        </form>

        <p class="text-xs text-center text-gray-400">
          Protected CRM dashboard. Contact your administrator if you need assistance.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'

definePageMeta({
  layout: false,
})

const router = useRouter()
const auth = useAuth()

const form = reactive({
  username: '',
  password: '',
})

const errorMessage = ref('')
const isSubmitting = computed(() => auth.loading.value)

const canSubmit = computed(() => {
  return form.username.trim().length > 0 && form.password.trim().length > 0 && !isSubmitting.value
})

const inputUi = computed(() => {
  const base =
    'rounded-2xl border px-4 py-3 text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500'
  const errored =
    'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/40 text-red-600 placeholder:text-red-400'
  const normal = 'border-gray-200 text-gray-900 placeholder:text-gray-400'

  return {
    base: `${base} ${errorMessage.value ? errored : normal}`,
    leading: 'ps-4',
    leadingIcon: errorMessage.value ? 'text-red-400' : 'text-gray-400',
  }
})

const handleSubmit = async () => {
  if (!canSubmit.value) return
  errorMessage.value = ''

  try {
    await auth.login(form.username.trim(), form.password)
    await auth.refreshUser()
    await router.push('/')
  } catch (error: any) {
    const message =
      error?.data?.message ||
      error?.message ||
      'Unable to sign in. Please check your credentials and try again.'
    errorMessage.value = message
    form.username = ''
    form.password = ''
  } finally {
    // allow resubmission immediately
  }
}
</script>


