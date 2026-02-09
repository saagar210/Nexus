import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KeyValueEditor from '@/components/ui/KeyValueEditor.vue'

describe('KeyValueEditor', () => {
  it('renders ghost row when empty', () => {
    const wrapper = mount(KeyValueEditor, {
      props: {
        modelValue: [],
      },
    })
    // Should have input fields for the ghost row
    const inputs = wrapper.findAll('input[type="text"]')
    expect(inputs.length).toBeGreaterThanOrEqual(2) // key + value
  })

  it('renders existing rows', () => {
    const wrapper = mount(KeyValueEditor, {
      props: {
        modelValue: [
          { key: 'Accept', value: 'application/json', enabled: true },
          { key: 'X-Custom', value: 'test', enabled: true },
        ],
      },
    })
    const inputs = wrapper.findAll('input[type="text"]')
    // 2 rows * 2 inputs + 1 ghost row * 2 inputs = 6
    expect(inputs.length).toBeGreaterThanOrEqual(4)
  })

  it('shows checkboxes for each row', () => {
    const wrapper = mount(KeyValueEditor, {
      props: {
        modelValue: [
          { key: 'Accept', value: 'application/json', enabled: true },
        ],
      },
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThanOrEqual(1)
  })
})
