import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen, within } from '@testing-library/react'
import ts from 'typescript'
import { beforeEach, expect, it, vi } from 'vitest'
import * as components from '../../src'
import { Gallery } from './Gallery'

beforeEach(() => { window.location.hash = ''; window.scrollTo = vi.fn() })

it('uses every exported component implementation in a gallery example', () => {
  const used = new Set<unknown>()
  const directory = resolve('gallery/src')
  for (const file of readdirSync(directory).filter(name => name.endsWith('.tsx') && !name.endsWith('.test.tsx'))) {
    const source = ts.createSourceFile(file, readFileSync(resolve(directory, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const references = new Map<string, number>()
    function visit(node: ts.Node) {
      if (ts.isIdentifier(node)) references.set(node.text, (references.get(node.text) ?? 0) + 1)
      ts.forEachChild(node, visit)
    }
    visit(source)
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text !== '../../src') continue
      const bindings = statement.importClause?.namedBindings
      if (!bindings || !ts.isNamedImports(bindings)) continue
      for (const binding of bindings.elements) {
        if (binding.isTypeOnly || (references.get(binding.name.text) ?? 0) < 2) continue
        used.add(components[(binding.propertyName ?? binding.name).text as keyof typeof components])
      }
    }
  }
  const missing = Object.entries(components).filter(([name, value]) =>
    /^Material[A-Z]/.test(name) && (typeof value === 'function' || (value && typeof value === 'object' && '$$typeof' in value)) && !used.has(value),
  ).map(([name]) => name)
  expect(missing).toEqual([])
})

it('opens navigation deep links and controls each preview independently', () => {
  window.location.hash = 'navigation-bars'
  const { container } = render(<Gallery />)
  const panel = within(container.querySelector('#navigation-bars-panel') as HTMLElement)
  const categories = within(container.querySelector('[aria-label="Component categories"]') as HTMLElement)
  const three = within(panel.getByRole('navigation', { name: 'Three destinations' }))
  const four = within(panel.getByRole('navigation', { name: 'Four destinations, icons only' }))
  const fiveBar = panel.getByRole('navigation', { name: 'Five destinations, selected label' })
  const five = within(fiveBar)
  expect(three.getAllByRole('button')).toHaveLength(3)
  expect(four.getAllByRole('button')).toHaveLength(4)
  expect(five.getAllByRole('button')).toHaveLength(5)
  expect(four.getByRole('button', { name: 'Home' }).querySelector('.material-navigation-bar-item__label')).toBeNull()
  const search = five.getByRole('button', { name: 'Search' })
  expect(search).toHaveAttribute('data-label-visible', 'false')
  fireEvent.click(search)
  expect(search).toHaveAttribute('aria-current', 'page')
  expect(search).toHaveAttribute('data-label-visible', 'true')
  expect(search.querySelector('.gallery-symbol')).toHaveStyle({ fontVariationSettings: "'FILL' 1" })
  expect(three.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  expect(five.getByRole('button', { name: 'Profile' })).toBeDisabled()
  const library = five.getByRole('button', { name: 'Library' })
  library.focus()
  fireEvent.keyDown(library, { key: 'ArrowRight' })
  expect(five.getByRole('button', { name: 'Home' })).toHaveFocus()
  fireEvent.click(panel.getByRole('switch', { name: 'Right-to-left navigation bars' }))
  expect(fiveBar.closest('[dir]')).toHaveAttribute('dir', 'rtl')
  fireEvent.click(categories.getByRole('button', { name: 'Cards' }))
  expect(panel.queryByRole('navigation', { name: 'Three destinations' })).not.toBeInTheDocument()
})

it('controls the standalone toggle FAB and custom decorated editor', () => {
  const { container } = render(<Gallery />)
  const actions = within(container.querySelector('#actions-panel') as HTMLElement)
  const categories = within(container.querySelector('[aria-label="Component categories"]') as HTMLElement)
  const toggle = actions.getByRole('button', { name: 'Toggle standalone actions' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(categories.getByRole('button', { name: 'App bars' }))
  const appBars = within(container.querySelector('#app-bars-panel') as HTMLElement)
  fireEvent.click(appBars.getByRole('button', { name: 'Open profile' }))
  expect(screen.getByText('Profile opened')).toBeVisible()
  fireEvent.click(categories.getByRole('button', { name: 'Text fields' }))
  const fields = within(container.querySelector('#text-fields-panel') as HTMLElement)
  const editor = fields.getByRole('textbox', { name: 'Custom editor' })
  fireEvent.focus(editor)
  expect(editor.closest('[data-focused]')).toHaveAttribute('data-focused', 'true')
  fireEvent.change(editor, { target: { value: 'Hello' } })
  expect(editor).toHaveValue('Hello')
  expect(editor).toHaveAccessibleDescription('5 characters')
  fireEvent.blur(editor)
  expect(editor.closest('[data-focused]')).toHaveAttribute('data-focused', 'false')
})
