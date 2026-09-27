import axe from 'axe-core'

/**
 * Runs axe on the rendered document and fails on critical/serious violations.
 * Color contrast needs real layout and is checked in the Playwright suite instead.
 */
export async function expectNoSeriousA11yViolations(root: Element = document.body) {
  const results = await axe.run(root, {
    rules: { 'color-contrast': { enabled: false } },
    resultTypes: ['violations'],
  })
  const serious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  )
  const summary = serious.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`,
  )
  expect(summary).toEqual([])
}
