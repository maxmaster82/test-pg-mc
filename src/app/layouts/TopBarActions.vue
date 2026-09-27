<script setup lang="ts">
import { isApiMockingEnabled } from '@/shared/config/mock-settings'
import DemoControls from '@/app/demo/DemoControls.vue'
import ThemeMenuItems from '@/app/preferences/ThemeMenuItems.vue'
import UserMenu from '@/modules/auth/components/UserMenu.vue'
</script>

<template>
  <DemoControls v-if="isApiMockingEnabled" />
  <UserMenu>
    <ThemeMenuItems />
  </UserMenu>
</template>
