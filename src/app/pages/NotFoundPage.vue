<script setup lang="ts">
import AppButton from '@/shared/ui/AppButton.vue'
</script>

<template>
  <main class="grid min-h-dvh place-items-center px-4">
    <div class="flex flex-col items-center gap-4 text-center">
      <p class="text-sm font-semibold text-primary">404</p>
      <h1 class="text-2xl font-semibold">Page not found</h1>
      <p class="text-muted">The page you are looking for does not exist or has been moved.</p>
      <AppButton to="/" variant="primary">Go to overview</AppButton>
    </div>
  </main>
</template>
