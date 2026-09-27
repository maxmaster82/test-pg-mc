<script setup lang="ts">
import { RouterView } from 'vue-router'
import { usePreferencesStore } from '@/app/preferences/store'
import ConfirmHost from '@/shared/ui/ConfirmHost.vue'
import ToastRegion from '@/shared/ui/ToastRegion.vue'

// Instantiating the store applies the theme and keeps "System" in sync with the OS.
usePreferencesStore()
</script>

<template>
  <RouterView />
  <ToastRegion />
  <ConfirmHost />
</template>
