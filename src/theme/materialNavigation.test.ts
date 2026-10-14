import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getMaterialNavigationKeyframes, runMaterialNavigationTransition } from './materialNavigation'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = '' })
function environment(reduce = false) {
  vi.stubGlobal('matchMedia', () => ({ matches: reduce }))
  const target = document.createElement('div')
  document.body.append(target)
  const animate = vi.fn((_frames: Keyframe[] | PropertyIndexedKeyframes | null, _options?: number | KeyframeAnimationOptions) => ({ finished: Promise.resolve(), cancel: vi.fn() }) as unknown as Animation)
  target.animate = animate
  document.documentElement.animate = animate
  return { target, animate }
}
describe('Material navigation', () => {
  it('hides incoming snapshots before JavaScript playback begins', () => {
    const css = readFileSync('src/theme/motion.css', 'utf8')
    expect(css).toMatch(/html\[data-material-navigation\]::view-transition-new\(material-navigation-page\)\s*\{\s*opacity:\s*0;?\s*\}/)
  })
  it('reverses shared Z depth and X direction, including RTL', () => {
    expect(getMaterialNavigationKeyframes('shared-axis-z').incoming[0].transform).toBe('scale(0.8)')
    expect(getMaterialNavigationKeyframes('shared-axis-z', 'back').incoming[0].transform).toBe('scale(1.1)')
    expect(getMaterialNavigationKeyframes('shared-axis-x', 'forward', false, true).incoming[0].transform).toBe('translateX(-30px)')
    expect(getMaterialNavigationKeyframes('shared-axis-x', 'back').outgoing[2].transform).toBe('translateX(30px)')
  })
  it('fades peer destinations sequentially and scales only the incoming page', () => {
    const frames = getMaterialNavigationKeyframes('fade-through')
    expect(frames.incoming[0].transform).toBe('scale(0.92)')
    expect(frames.outgoing[2].transform).toBe('none')
    expect(frames.incoming[1]).toEqual({ opacity: 0, offset: 0.35 })
    expect(frames.outgoing[1]).toEqual({ opacity: 0, offset: 0.35 })
  })
  it('overlaps peer content without an empty opacity handoff', () => {
    const frames = getMaterialNavigationKeyframes('crossfade')
    expect(frames.incoming).toEqual([{ transform: 'scale(0.92)', opacity: 0 }, { transform: 'none', opacity: 1 }])
    expect(frames.outgoing).toEqual([{ transform: 'none', opacity: 1 }, { transform: 'none', opacity: 0 }])
  })
  it('retains a short fade without movement for reduced motion', async () => {
    const { target, animate } = environment(true)
    await runMaterialNavigationTransition({ target: () => target, update: vi.fn() })
    expect((animate.mock.calls[0][0] as Keyframe[]).every((frame: Keyframe) => !frame.transform || frame.transform === 'none')).toBe(true)
    expect((animate.mock.calls[0][1] as KeyframeAnimationOptions).duration).toBe(150)
  })
  it('animates the incoming content when snapshots are unavailable', async () => {
    const { target, animate } = environment()
    const update = vi.fn()
    await runMaterialNavigationTransition({ target: () => target, update })
    expect(update).toHaveBeenCalledOnce()
    expect(animate).toHaveBeenCalledOnce()
    expect(target.style.viewTransitionName).toBe('')
  })
  it.each([['0.45s', 450], ['450ms', 450], [' 0.65s ', 650], ['0ms', 0], ['', 450], ['-10ms', 450]])('reads CSS time %s as %i milliseconds', async (token, expected) => {
    const { target, animate } = environment()
    target.style.setProperty('--md-sys-motion-duration-long1', token)
    await runMaterialNavigationTransition({ target: () => target, update: vi.fn() })
    expect((animate.mock.calls[0][1] as KeyframeAnimationOptions).duration).toBe(expected)
  })
  it('a late snapshot cannot overwrite a newer navigation or clear its name', async () => {
    const { target } = environment()
    const callbacks: (() => Promise<void>)[] = []
    const finishes: (() => void)[] = []
    const snapshot = vi.fn((update: () => Promise<void>) => {
      callbacks.push(update)
      let finish!: () => void
      const ready = new Promise<void>(resolve => { finish = resolve })
      finishes.push(finish)
      return { ready, updateCallbackDone: Promise.resolve(), skipTransition: finish }
    })
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: snapshot })
    const first = vi.fn(), latest = vi.fn()
    try {
      const a = runMaterialNavigationTransition({ target: () => target, update: first })
      const b = runMaterialNavigationTransition({ target: () => target, update: latest })
      await callbacks[1]()
      await callbacks[0]()
      await a
      expect(first).not.toHaveBeenCalled()
      expect(latest).toHaveBeenCalledOnce()
      expect(target.style.viewTransitionName).toBe('material-navigation-page')
      finishes[1]()
      await b
      expect(target.style.viewTransitionName).toBe('')
      expect(document.documentElement.dataset.materialNavigation).toBeUndefined()
    } finally { Reflect.deleteProperty(document, 'startViewTransition') }
  })
  it('keeps snapshot styles until the browser removes the transition tree', async () => {
    const { target } = environment()
    let finish!: () => void
    const finished = new Promise<void>(resolve => { finish = resolve })
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: (update: () => Promise<void>) => {
      const committed = update()
      return { ready: committed, updateCallbackDone: committed, finished, skipTransition: finish }
    } })
    try {
      const navigation = runMaterialNavigationTransition({ target: () => target, update: vi.fn() })
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(document.documentElement.dataset.materialNavigation).toBe('shared-axis-z')
      expect(document.documentElement.style.viewTransitionName).toBe('none')

      expect(target.style.viewTransitionName).toBe('material-navigation-page')
      finish()
      await navigation
      expect(document.documentElement.dataset.materialNavigation).toBeUndefined()
      expect(target.style.viewTransitionName).toBe('')
      expect(document.documentElement.style.viewTransitionName).toBe('')
    } finally { Reflect.deleteProperty(document, 'startViewTransition') }
  })
  it('preserves outgoing geometry when the next page has a taller header and different width', async () => {
    const { target } = environment()
    const bounds = vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ left: 96, top: 64, width: 1184, height: 656 } as DOMRect)
    const root = document.documentElement
    root.style.setProperty('--m3-navigation-old-top', '3px')
    let finish!: () => void
    const finished = new Promise<void>(resolve => { finish = resolve })
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: (update: () => Promise<void>) => {
      const committed = update()
      return { ready: committed, updateCallbackDone: committed, finished, skipTransition: finish }
    } })
    try {
      const navigation = runMaterialNavigationTransition({ target: () => target, update: () => {
        bounds.mockReturnValue({ left: 128, top: 136, width: 1120, height: 584 } as DOMRect)
      } })
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(root.style.getPropertyValue('--m3-navigation-old-width')).toBe('1184px')
      expect(root.style.getPropertyValue('--m3-navigation-old-height')).toBe('656px')
      expect(root.style.getPropertyValue('--m3-navigation-old-left')).toBe('-32px')
      expect(root.style.getPropertyValue('--m3-navigation-old-top')).toBe('-72px')
      finish()
      await navigation
      expect(root.style.getPropertyValue('--m3-navigation-old-width')).toBe('')
      expect(root.style.getPropertyValue('--m3-navigation-old-top')).toBe('3px')
    } finally {
      finish()
      root.style.removeProperty('--m3-navigation-old-top')
      Reflect.deleteProperty(document, 'startViewTransition')
    }
  })
  it('reacquires replaced content after an async router commit', async () => {
    const { target, animate } = environment()
    let current = target
    await runMaterialNavigationTransition({ target: () => current, update: async () => {
      await Promise.resolve()
      current = document.createElement('div'); current.animate = animate
      target.replaceWith(current)
    } })
    expect(animate).toHaveBeenCalledOnce()
  })
})
