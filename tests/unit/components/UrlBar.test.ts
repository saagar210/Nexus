import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import UrlBar from '@/components/request/UrlBar.vue'
import { useRequestStore } from '@/stores/request'
import { useResponseStore } from '@/stores/response'

// Mock window.api
const mockInvoke = vi.fn().mockResolvedValue({
  success: true,
  data: {
    statusCode: 200,
    statusText: 'OK',
    headers: {},
    body: '{}',
    size: 2,
    isTruncated: false,
    timing: { startTime: 0, dnsTime: 0, connectTime: 0, tlsTime: 0, firstByteTime: 0, totalTime: 100 },
  },
})

vi.stubGlobal('window', {
  ...window,
  api: { invoke: mockInvoke },
})

describe('UrlBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders with default method GET', () => {
    const wrapper = mount(UrlBar)
    expect(wrapper.text()).toContain('GET')
  })

  it('renders Send button when not loading', () => {
    const wrapper = mount(UrlBar)
    expect(wrapper.text()).toContain('Send')
    expect(wrapper.text()).not.toContain('Cancel')
  })

  it('shows Cancel when loading', () => {
    const responseStore = useResponseStore()
    responseStore.isLoading = true

    const wrapper = mount(UrlBar)
    expect(wrapper.text()).toContain('Cancel')
  })

  it('has a text input for URL', () => {
    const wrapper = mount(UrlBar)
    const input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toContain('URL')
  })

  it('does not send when URL is empty', async () => {
    const wrapper = mount(UrlBar)
    // Call executeSend directly via exposed method
    const vm = wrapper.vm as { executeSend: () => Promise<void> }
    await vm.executeSend()

    expect(mockInvoke).not.toHaveBeenCalledWith('http:execute', expect.anything())
  })

  it('sends request when URL is set', async () => {
    const requestStore = useRequestStore()
    requestStore.url = 'https://example.com'

    const wrapper = mount(UrlBar)
    const vm = wrapper.vm as { executeSend: () => Promise<void> }
    await vm.executeSend()
    await flushPromises()

    expect(mockInvoke).toHaveBeenCalledWith('http:execute', expect.objectContaining({
      url: 'https://example.com',
      method: 'GET',
    }))
  })

  it('emits request-sent after execution', async () => {
    const requestStore = useRequestStore()
    requestStore.url = 'https://example.com'

    const wrapper = mount(UrlBar)
    const vm = wrapper.vm as { executeSend: () => Promise<void> }
    await vm.executeSend()
    await flushPromises()

    expect(wrapper.emitted('request-sent')).toBeTruthy()
  })

  it('sets response store on successful response', async () => {
    const requestStore = useRequestStore()
    const responseStore = useResponseStore()
    requestStore.url = 'https://example.com'

    const wrapper = mount(UrlBar)
    const vm = wrapper.vm as { executeSend: () => Promise<void> }
    await vm.executeSend()
    await flushPromises()

    expect(responseStore.statusCode).toBe(200)
    expect(responseStore.isLoading).toBe(false)
  })

  it('sets error on failed response', async () => {
    mockInvoke.mockResolvedValueOnce({ success: false, error: 'Connection refused' })

    const requestStore = useRequestStore()
    const responseStore = useResponseStore()
    requestStore.url = 'https://example.com'

    const wrapper = mount(UrlBar)
    const vm = wrapper.vm as { executeSend: () => Promise<void> }
    await vm.executeSend()
    await flushPromises()

    expect(responseStore.error).toBe('Connection refused')
    expect(responseStore.isLoading).toBe(false)
  })

  it('cancels request when loading and send is called', async () => {
    const requestStore = useRequestStore()
    const responseStore = useResponseStore()
    requestStore.url = 'https://example.com'
    responseStore.isLoading = true

    const wrapper = mount(UrlBar)
    const vm = wrapper.vm as { executeSend: () => Promise<void> }
    await vm.executeSend()
    await flushPromises()

    expect(mockInvoke).toHaveBeenCalledWith('http:cancel')
  })
})
