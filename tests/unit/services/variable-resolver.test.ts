import { describe, it, expect } from 'vitest'
import { resolveVariables, resolveRequestVariables } from '../../../electron/main/services/variable-resolver'

describe('Variable Resolver', () => {
  describe('resolveVariables', () => {
    it('replaces known variables', () => {
      const result = resolveVariables('{{base_url}}/api', { base_url: 'https://api.example.com' })
      expect(result).toBe('https://api.example.com/api')
    })

    it('leaves unknown variables untouched', () => {
      const result = resolveVariables('{{base_url}}/{{path}}', { base_url: 'https://example.com' })
      expect(result).toBe('https://example.com/{{path}}')
    })

    it('handles multiple occurrences of same variable', () => {
      const result = resolveVariables('{{host}}:{{port}}/{{host}}', { host: 'localhost', port: '8080' })
      expect(result).toBe('localhost:8080/localhost')
    })

    it('returns unchanged text with no variables', () => {
      const result = resolveVariables('https://example.com/api', { key: 'value' })
      expect(result).toBe('https://example.com/api')
    })

    it('returns unchanged text with empty variables map', () => {
      const result = resolveVariables('{{foo}}', {})
      expect(result).toBe('{{foo}}')
    })

    it('handles empty string', () => {
      const result = resolveVariables('', { key: 'val' })
      expect(result).toBe('')
    })

    it('handles variables with underscores and numbers', () => {
      const result = resolveVariables('{{api_key_2}}', { api_key_2: 'abc123' })
      expect(result).toBe('abc123')
    })
  })

  describe('resolveRequestVariables', () => {
    it('resolves variables in url, headers, and body', () => {
      const result = resolveRequestVariables(
        {
          url: '{{base}}/users',
          headers: { Authorization: 'Bearer {{token}}', Accept: 'application/json' },
          body: '{"key": "{{secret}}"}',
        },
        { base: 'https://api.example.com', token: 'my-token', secret: 'shh' }
      )

      expect(result.url).toBe('https://api.example.com/users')
      expect(result.headers['Authorization']).toBe('Bearer my-token')
      expect(result.headers['Accept']).toBe('application/json')
      expect(result.body).toBe('{"key": "shh"}')
    })

    it('handles undefined body', () => {
      const result = resolveRequestVariables(
        { url: '{{base}}', headers: {} },
        { base: 'http://localhost' }
      )

      expect(result.url).toBe('http://localhost')
      expect(result.body).toBeUndefined()
    })
  })
})
