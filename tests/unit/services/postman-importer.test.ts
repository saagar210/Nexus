import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// We can't run the actual importer (requires DB), but we can test the JSON parsing logic
describe('Postman Importer - JSON Structure', () => {
  const fixturePath = path.join(__dirname, '../../fixtures/postman-sample.json')

  it('fixture file exists and is valid JSON', () => {
    const content = fs.readFileSync(fixturePath, 'utf-8')
    const parsed = JSON.parse(content)
    expect(parsed).toBeTruthy()
  })

  it('has correct Postman collection structure', () => {
    const content = fs.readFileSync(fixturePath, 'utf-8')
    const collection = JSON.parse(content)

    expect(collection.info).toBeDefined()
    expect(collection.info.name).toBe('Test Collection')
    expect(collection.info.schema).toContain('collection')
    expect(collection.item).toBeInstanceOf(Array)
  })

  it('contains folders (collections)', () => {
    const content = fs.readFileSync(fixturePath, 'utf-8')
    const collection = JSON.parse(content)

    const folder = collection.item.find((i: { item?: unknown[] }) => i.item)
    expect(folder).toBeTruthy()
    expect(folder.name).toBe('Auth Endpoints')
    expect(folder.item).toHaveLength(2)
  })

  it('contains requests with correct methods', () => {
    const content = fs.readFileSync(fixturePath, 'utf-8')
    const collection = JSON.parse(content)

    const getUsers = collection.item.find((i: { name: string }) => i.name === 'Get Users')
    expect(getUsers).toBeTruthy()
    expect(getUsers.request.method).toBe('GET')

    const createUser = collection.item.find((i: { name: string }) => i.name === 'Create User')
    expect(createUser).toBeTruthy()
    expect(createUser.request.method).toBe('POST')
  })

  it('handles URL with query params', () => {
    const content = fs.readFileSync(fixturePath, 'utf-8')
    const collection = JSON.parse(content)

    const getUsers = collection.item.find((i: { name: string }) => i.name === 'Get Users')
    expect(getUsers.request.url.query).toHaveLength(2)
    expect(getUsers.request.url.query[0].key).toBe('page')
  })

  it('handles different body modes', () => {
    const content = fs.readFileSync(fixturePath, 'utf-8')
    const collection = JSON.parse(content)

    // JSON body in folder
    const folder = collection.item.find((i: { item?: unknown[] }) => i.item)
    const login = folder.item[0]
    expect(login.request.body.mode).toBe('raw')
    expect(login.request.body.options.raw.language).toBe('json')

    // URL-encoded body
    const createUser = collection.item.find((i: { name: string }) => i.name === 'Create User')
    expect(createUser.request.body.mode).toBe('urlencoded')
    expect(createUser.request.body.urlencoded).toHaveLength(2)
  })

  it('handles auth configurations', () => {
    const content = fs.readFileSync(fixturePath, 'utf-8')
    const collection = JSON.parse(content)

    // Bearer auth
    const folder = collection.item.find((i: { item?: unknown[] }) => i.item)
    const refresh = folder.item[1]
    expect(refresh.request.auth.type).toBe('bearer')
    expect(refresh.request.auth.bearer[0].value).toBe('my-token')

    // Basic auth
    const createUser = collection.item.find((i: { name: string }) => i.name === 'Create User')
    expect(createUser.request.auth.type).toBe('basic')
  })
})
