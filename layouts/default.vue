<template>
  <div :class="['flex h-screen transition-colors duration-300', isDark ? 'bg-gray-900' : 'bg-gray-50']">
    <!-- Sidebar -->
    <SidebarMenu />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <HeaderBar />

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
const { isDark } = useTheme()
</script>
