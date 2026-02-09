import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MethodBadge from '@/components/collection/MethodBadge.vue'

describe('MethodBadge', () => {
  it('renders method text', () => {
    const wrapper = mount(MethodBadge, {
      props: { method: 'GET' },
    })
    expect(wrapper.text()).toBe('GET')
  })

  it('renders short label for DELETE', () => {
    const wrapper = mount(MethodBadge, {
      props: { method: 'DELETE' },
    })
    expect(wrapper.text()).toBe('DEL')
  })

  it('renders short label for OPTIONS', () => {
    const wrapper = mount(MethodBadge, {
      props: { method: 'OPTIONS' },
    })
    expect(wrapper.text()).toBe('OPT')
  })

  it('renders short label for PATCH', () => {
    const wrapper = mount(MethodBadge, {
      props: { method: 'PATCH' },
    })
    expect(wrapper.text()).toBe('PAT')
  })

  it('applies correct color class for GET', () => {
    const wrapper = mount(MethodBadge, {
      props: { method: 'GET' },
    })
    expect(wrapper.classes()).toContain('text-method-get')
  })

  it('applies correct color class for POST', () => {
    const wrapper = mount(MethodBadge, {
      props: { method: 'POST' },
    })
    expect(wrapper.classes()).toContain('text-method-post')
  })
})
