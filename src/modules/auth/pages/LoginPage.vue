<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errorMessage, isApiError } from '@/shared/api/errors'
import AppButton from '@/shared/ui/AppButton.vue'
import AppIcon from '@/shared/ui/AppIcon.vue'
import TextField from '@/shared/ui/TextField.vue'
import { useHeadingFocus } from '@/shared/composables/route-focus'
import { useZodForm } from '@/shared/validation/useZodForm'
import BrandMark from '@/app/layouts/BrandMark.vue'
import { safeRedirect } from '../redirect'
import { loginSchema } from '../schemas'
import { useAuthStore } from '../store'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = useZodForm(loginSchema, { email: '', password: '' })
const failure = ref<string | null>(null)
const alertRef = useTemplateRef<HTMLElement>('alert')
const sessionExpired = computed(() => route.query.reason === 'expired')
useHeadingFocus(useTemplateRef<HTMLElement>('heading'))

const onSubmit = form.handleSubmit(async ({ email, password }) => {
  failure.value = null
  try {
    await auth.login(email, password)
    await router.replace(safeRedirect(route.query.redirect))
  } catch (error) {
    failure.value =
      isApiError(error) && error.code === 'INVALID_CREDENTIALS'
        ? 'Invalid email or password.'
        : errorMessage(error)
    // Reset (not setValue) so the cleared password is not immediately flagged as "required".
    form.reset({ email, password: '' })
    await nextTick()
    alertRef.value?.focus()
  }
})
</script>

<template>
  <main class="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
    <div class="w-full max-w-sm">
      <div class="mb-8 flex justify-center"><BrandMark /></div>
      <section
        class="rounded-(--radius-card) border border-line bg-surface p-6 shadow-(--shadow-card) sm:p-8"
      >
        <h1 ref="heading" tabindex="-1" class="text-xl font-semibold">Sign in</h1>
        <p class="mt-1 text-sm text-muted">Administrator access to the ticketing portal.</p>

        <p
          v-if="sessionExpired && !failure"
          class="mt-4 rounded-(--radius-control) bg-info-soft p-3 text-sm text-info"
          role="status"
        >
          Your session has expired. Please sign in again.
        </p>
        <div
          v-if="failure"
          ref="alert"
          role="alert"
          tabindex="-1"
          class="mt-4 flex items-start gap-2 rounded-(--radius-control) bg-danger-soft p-3 text-sm text-danger"
        >
          <AppIcon name="alert" :size="18" />
          <span>{{ failure }}</span>
        </div>

        <form class="mt-6 flex flex-col gap-4" novalidate @submit="onSubmit">
          <TextField
            v-bind="form.field('email')"
            label="Email"
            type="email"
            autocomplete="username"
            required
          />
          <TextField
            v-bind="form.field('password')"
            label="Password"
            type="password"
            autocomplete="current-password"
            required
          />
          <AppButton
            type="submit"
            variant="primary"
            :loading="form.isSubmitting.value"
            class="mt-2 w-full"
          >
            {{ form.isSubmitting.value ? 'Signing in…' : 'Sign in' }}
          </AppButton>
        </form>
      </section>

      <aside
        class="mt-6 rounded-(--radius-card) border border-dashed border-line-strong p-4 text-sm text-muted"
      >
        <p class="font-medium text-fg">Demo credentials</p>
        <p class="mt-1">
          Email: <code class="text-fg">admin@ticketadmin.test</code><br />
          Password: <code class="text-fg">demo-password</code>
        </p>
        <p class="mt-2 text-xs">Authentication is mocked in the browser; no real account exists.</p>
      </aside>
    </div>
  </main>
</template>
