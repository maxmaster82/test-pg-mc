import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { z } from 'zod'
import { moneyInput, requiredText } from './rules'
import { useZodForm } from './useZodForm'

const schema = z.object({ name: requiredText('Name', 2, 10), price: moneyInput('Price', 10_000) })

function setup(initial = { name: '', price: '' }) {
  let form!: ReturnType<typeof useZodForm<{ name: string; price: string }, z.output<typeof schema>>>
  mount(
    defineComponent({
      setup() {
        form = useZodForm(schema, initial)
        return () => h('div')
      },
    }),
  )
  return form
}

describe('useZodForm', () => {
  it('shows no errors until a field is touched', () => {
    const form = setup()
    expect(form.errors.value).toEqual({})
    form.touch('name')
    expect(form.errors.value).toEqual({ name: 'Name is required' })
  })

  it('updates visible errors live after touch', async () => {
    const form = setup()
    form.touch('price')
    form.setValue('price', '1.234')
    await Promise.resolve()
    expect(form.errors.value.price).toBe('Price can have at most 2 decimal places')
    form.setValue('price', '12.5')
    await Promise.resolve()
    expect(form.errors.value.price).toBeUndefined()
  })

  it('submits parsed output only when valid', async () => {
    const form = setup()
    const onValid = vi.fn()
    await form.handleSubmit(onValid)()
    expect(onValid).not.toHaveBeenCalled()
    expect(Object.keys(form.errors.value)).toEqual(['name', 'price'])

    form.setValue('name', '  Gold ')
    form.setValue('price', '12,5')
    await form.handleSubmit(onValid)()
    expect(onValid).toHaveBeenCalledWith({ name: 'Gold', price: 1250 })
  })

  it('tracks dirtiness against the initial values and reset', () => {
    const form = setup({ name: 'Gold', price: '1.00' })
    expect(form.isDirty.value).toBe(false)
    form.setValue('name', 'Silver')
    expect(form.isDirty.value).toBe(true)
    form.reset({ name: 'Silver', price: '1.00' })
    expect(form.isDirty.value).toBe(false)
  })

  it('shows server field errors until the field changes', async () => {
    const form = setup({ name: 'Gold', price: '1.00' })
    form.setServerErrors({ name: 'A ticket with this name already exists' })
    expect(form.errors.value.name).toBe('A ticket with this name already exists')
    form.setValue('name', 'Golden')
    await Promise.resolve()
    expect(form.errors.value.name).toBeUndefined()
  })

  it('exposes submitting state while the handler runs', async () => {
    const form = setup({ name: 'Gold', price: '1.00' })
    let resolve!: () => void
    const pending = form.handleSubmit(() => new Promise<void>((r) => (resolve = r)))()
    await Promise.resolve()
    expect(form.isSubmitting.value).toBe(true)
    resolve()
    await pending
    expect(form.isSubmitting.value).toBe(false)
  })
})
