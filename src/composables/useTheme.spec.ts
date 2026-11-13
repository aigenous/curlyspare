// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { LEGACY_THEME_STORAGE_KEY, THEME_STORAGE_KEY, migrateTheme } from './useTheme'

beforeEach(() => {
  localStorage.clear()
})

describe('migrateTheme', () => {
  it('copies the legacy key onto curlyspare.theme and deletes the old key', () => {
    localStorage.setItem(LEGACY_THEME_STORAGE_KEY, 'dark')

    expect(migrateTheme()).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(localStorage.getItem(LEGACY_THEME_STORAGE_KEY)).toBeNull()
  })

  it('does nothing when the legacy key is absent', () => {
    expect(migrateTheme()).toBeNull()
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(LEGACY_THEME_STORAGE_KEY)).toBeNull()
  })
})
