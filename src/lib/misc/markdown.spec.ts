// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

describe('markdown preview', () => {
  it('renders GFM and strips active content', () => {
    const html = renderMarkdown('# Tytuł\n\n**grube** i `kod`\n\n- punkt\n')
    expect(html).toContain('<h1>Tytuł</h1>')
    expect(html).toContain('<strong>grube</strong>')
    expect(html).toContain('<code>kod</code>')
    expect(html).toContain('<li>punkt</li>')
  })

  it('removes scripts, event handlers, and javascript links', () => {
    const html = renderMarkdown(
      '<script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">link</a>',
    )
    expect(html.toLowerCase()).not.toContain('<script')
    expect(html.toLowerCase()).not.toContain('onerror')
    expect(html.toLowerCase()).not.toContain('javascript:')
    expect(html).toContain('link')
    expect(html).toContain('src="x"')
    expect(html).not.toContain('Obraz z zewnętrznego adresu')
  })

  it('blocks remote images by default', () => {
    const html = renderMarkdown(
      [
        '![kot](https://cdn.example/kot.png)',
        '<img alt="pies" src="http://pliki.example/pies.png">',
        '<img src="//obrazy.example/nocat.png" srcset="//obrazy.example/nocat.png 1x, https://obrazy.example/nocat@2.png 2x">',
        '<picture><source srcset="https://cdn.example/foto.webp"><img alt="foto" src="https://cdn.example/foto.png"></picture>',
        '<svg><image href="https://cdn.example/wykres.png"></image></svg>',
        '<svg><image xlink:href="https://cdn.example/xlink.png"></image></svg>',
        '[strona](https://example.com/docs)',
      ].join('\n\n'),
    )

    expect(html).not.toContain('cdn.example')
    expect(html).not.toContain('pliki.example')
    expect(html).not.toContain('obrazy.example')
    expect(html).not.toContain('srcset')
    expect(html.toLowerCase()).not.toContain('<img')
    expect(html.toLowerCase()).not.toContain('<image')
    expect(html).toContain('kot')
    expect(html).toContain('pies')
    expect(html).toContain('foto')
    expect(html).toContain('Obraz z zewnętrznego adresu')
    expect(html).toContain('https://example.com/docs')
  })

  it('allows remote images when external addresses are enabled', () => {
    const html = renderMarkdown(
      '![kot](https://cdn.example/kot.png)\n\n<img src="//obrazy.example/a.png" srcset="https://obrazy.example/a.png 2x" onerror="alert(1)">',
      { allowRemoteImages: true },
    )

    expect(html).toContain('src="https://cdn.example/kot.png"')
    expect(html).toContain('src="//obrazy.example/a.png"')
    expect(html).toContain('srcset="https://obrazy.example/a.png 2x"')
    expect(html.toLowerCase()).not.toContain('onerror')
    expect(html).not.toContain('Obraz z zewnętrznego adresu')
  })

  it('keeps data URIs while remote images are blocked', () => {
    const png =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const gif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    const html = renderMarkdown(
      [
        `<img alt="piksel" src="${png}" srcset="https://cdn.example/piksel.png 1x, ${gif} 2x">`,
        `<svg><image href="${gif}"></image></svg>`,
        '![zdalny](https://cdn.example/inny.png)',
      ].join('\n\n'),
    )

    expect(html).toContain(png)
    expect(html).toContain(gif)
    expect(html).toContain('piksel')
    expect(html).toContain('zdalny')
    expect(html).not.toContain('cdn.example')
    expect(html).not.toContain('https://')
    expect(html).not.toContain('http://')
  })
})
