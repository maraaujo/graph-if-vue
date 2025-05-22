export const finish = `<script setup lang="ts">
import { VOtpInput } from 'vuetify/labs/VOtpInput'

const loading = ref(false)
const snackbar = ref(false)
const snackbarColor = ref('default')
const otp = ref('')
const text = ref('')
const expectedOtp = ref('133707')

const onFinish = (rsp: any) => {
  loading.value = true

  setTimeout(() => {
    loading.value = false
    snackbarColor.value = (rsp === expectedOtp.value) ? 'success' : 'warning'
    text.value = \`Processed OTP with "\${rsp}" (\${snackbarColor.value})\`
    snackbar.value = true
  }, 3500)
}
</script>

<template>
  <div>
    <VOtpInput
      v-model="otp"
      :loading="loading"
      @finish="onFinish"
    />

    <div>
      Expected value: <span class="font-weight-bold">{{ expectedOtp }}</span>
    </div>

    <div class="text-caption">
      Type or copy/paste.
    </div>

    <VSnackbar
      v-model="snackbar"
      variant="tonal"
      :color="snackbarColor"
      :timeout="2000"
    >
      {{ text }}
    </VSnackbar>
  </div>
</template>
`
export const hidden = `<script setup lang="ts">
import { VOtpInput } from 'vuetify/labs/VOtpInput'

const otp = ref('')
</script>

<template>
  <VOtpInput
    v-model="otp"
    type="password"
    length="5"
  />
</template>
`
export const variant = `<script setup lang="ts">
import { VOtpInput } from 'vuetify/labs/VOtpInput'

type Variant = 'solo' | 'solo-inverted' | 'outlined' | 'solo-filled' | 'underlined' | 'filled' | 'plain' | undefined

const selectedVariant = ref<Variant>('outlined')
const variant = ['solo', 'solo-inverted', 'outlined', 'filled', 'underlined', 'solo-filled', 'plain']
const selected = ref()
</script>

<template>
  <VTabs v-model="selectedVariant">
    <VTab
      v-for="i in variant"
      :key="i"
      :value="i"
    >
      {{ i }}
    </VTab>
  </VTabs>

  <VOtpInput
    v-model="selected"
    label="Text field"
    :variant="selectedVariant"
  />
</template>
`
