import { TestBed } from '@angular/core/testing';

import { Storage } from './storage';

describe('Storage', () => {
  let service: Storage

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(Storage)
    localStorage.clear()
  })

  it('deve ser criado', () => {
    expect(service).toBeTruthy()
  })

  it('deve salvar um objeto convertido em string no localstorage', () => {
    const mockData = {id: 1, name: 'Admin'}
    const key = 'user_session'
    service.setItem(key, mockData)

    const storedValue = localStorage.getItem(key)
    expect(storedValue).toBe(JSON.stringify(mockData))
  })

  it('deve recuperar e parsear um objeto do localstorage', () => {
    const mockData = { token: 'jwt-token-xyz'}
    const key = 'auth_token'
    localStorage.setItem(key, JSON.stringify(mockData))

    const result = service.getItem<{token: string}>(key)
    expect(result).toEqual(mockData)
  })

  it('deve retornar null se a chave não existir', () => {
    const result = service.getItem('nao_existe')
    expect(result).toBeNull()
  })

  it ('deve remover o item do localStorage', () => {
    const key = 'teste'
    localStorage.setItem(key, '123')
    service.removeItem(key)
    expect(localStorage.getItem(key)).toBeNull()
  })
});
