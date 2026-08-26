/**
 * Not a test suite: rasterises public/favicon.svg into exact-size PNGs so
 * browsers never downscale a large icon into a blurry tab favicon.
 * Run with: npx playwright test e2e/gen-icons.spec.ts --workers=1
 */
import { readFileSync } from 'node:fs'
import { test } from '@playwright/test'

const SIZES = [16, 32, 48, 180, 192, 512]

test('generate favicon pngs', async ({ page }) => {
  const svg = readFileSync('public/favicon.svg', 'utf8')

  for (const size of SIZES) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(
      `<body style="margin:0;width:${size}px;height:${size}px;overflow:hidden">
         <div id="icon" style="width:${size}px;height:${size}px">${svg
           .replace('<svg', `<svg width="${size}" height="${size}"`)
           .replace(/\n/g, '')}</div>
       </body>`,
    )
    await page.locator('#icon').screenshot({
      path: size === 180 ? 'public/apple-touch-icon.png' : `public/favicon-${size}.png`,
      omitBackground: true,
    })
  }
})
