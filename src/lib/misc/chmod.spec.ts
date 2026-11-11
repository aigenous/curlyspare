import { describe, expect, it } from 'vitest'
import { chmodFromOctal, chmodFromSymbolic } from './chmod'

describe('chmod', () => {
  it('converts octal and symbolic modes, including special bits', () => {
    expect(chmodFromOctal('755').ok && chmodFromOctal('755')).toMatchObject({
      mode: { octal: '0755', symbolic: 'rwxr-xr-x', setuid: false, sticky: false },
    })
    expect(chmodFromOctal('644').ok && chmodFromOctal('644')).toMatchObject({ mode: { symbolic: 'rw-r--r--' } })
    expect(chmodFromOctal('4755').ok && chmodFromOctal('4755')).toMatchObject({
      mode: { symbolic: 'rwsr-xr-x', setuid: true },
    })
    expect(chmodFromOctal('1644').ok && chmodFromOctal('1644')).toMatchObject({
      mode: { symbolic: 'rw-r--r-T', sticky: true },
    })
    expect(chmodFromSymbolic('rwxr-xr-x')).toMatchObject({ ok: true, mode: { octal: '0755' } })
    expect(chmodFromSymbolic('rwsr-xr-x')).toMatchObject({ ok: true, mode: { octal: '4755', setuid: true } })
  })

  it('rejects a mode that is neither octal nor symbolic', () => {
    expect(chmodFromOctal('899').ok).toBe(false)
    expect(chmodFromSymbolic('rwx').ok).toBe(false)
  })
})
