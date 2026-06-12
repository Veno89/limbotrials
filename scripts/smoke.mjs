import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const browserCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browserPath = browserCandidates.find((candidate) => existsSync(candidate));
const outputDirectory = '.smoke';
const errors = [];

if (!browserPath) {
  throw new Error('No supported Chrome or Edge executable found. Set CHROME_PATH to run the smoke test.');
}

await mkdir(outputDirectory, { recursive: true });
const server = await createServer({
  server: { host: '127.0.0.1', port: 4173 },
});

let browser;
try {
  await server.listen();
  browser = await chromium.launch({ executablePath: browserPath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${outputDirectory}/landing-page.png`, fullPage: true });
  await page.locator('[data-start-game]').first().click();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${outputDirectory}/menu.png` });
  await page.mouse.click(640, 455);
  await page.waitForTimeout(500);
  await page.mouse.click(895, 355);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outputDirectory}/settings.png` });
  await page.mouse.click(640, 668);
  await page.waitForTimeout(500);
  await page.mouse.click(640, 325);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${outputDirectory}/character-select.png` });
  await page.mouse.click(640, 585);
  await page.waitForTimeout(3000);
  await page.keyboard.press('h');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outputDirectory}/chest-objective.png` });
  await page.keyboard.press('y');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/loot-reveal.png` });
  await page.waitForTimeout(750);
  await page.screenshot({ path: `${outputDirectory}/artifact-hud.png` });
  await page.mouse.move(48, 132);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/artifact-tooltip.png` });
  await page.keyboard.press('g');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/shield-visual.png` });
  await page.keyboard.press('u');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/temporary-buff.png` });
  await page.keyboard.down('d');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/haunted-hover-right.png` });
  await page.keyboard.up('d');
  await page.keyboard.down('w');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/haunted-hover-back.png` });
  await page.keyboard.up('w');
  await page.keyboard.press('F6');
  await page.waitForTimeout(1200);
  await page.keyboard.press('F8');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outputDirectory}/balance-live.png` });
  await page.keyboard.press('F8');
  await page.keyboard.press('l');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outputDirectory}/evolution.png` });
  for (let index = 0; index < 5; index += 1) {
    await page.keyboard.press('1');
    await page.waitForTimeout(300);
  }
  await page.keyboard.press('k');
  await page.keyboard.press('j');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${outputDirectory}/action-bar.png` });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outputDirectory}/stats-gameplay.png` });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(250);
  await page.keyboard.press('l');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outputDirectory}/upgrade.png` });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outputDirectory}/stats-upgrade.png` });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(250);
  await page.mouse.move(640, 385);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outputDirectory}/upgrade-hover.png` });
  for (const movementKey of ['w', 'a', 's', 'd']) {
    await page.keyboard.press(movementKey);
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outputDirectory}/upgrade-after-wasd.png` });
  await page.mouse.click(775, 642);
  await page.waitForTimeout(500);
  await page.keyboard.press('l');
  await page.waitForTimeout(500);
  await page.keyboard.press('1');
  await page.waitForTimeout(500);
  await page.keyboard.press('c');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outputDirectory}/curse.png` });
  await page.keyboard.press('1');
  await page.waitForTimeout(500);
  await page.keyboard.press('F7');
  await page.waitForTimeout(2200);
  await page.keyboard.press('g');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outputDirectory}/crimson-orbit.png` });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/crimson-orbit-stats.png` });
  await page.keyboard.press('Tab');
  await page.keyboard.press('n');
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('1');
    await page.waitForTimeout(120);
  }
  await page.keyboard.press('F9');
  await page.waitForTimeout(2600);
  await page.keyboard.press('g');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/weapon-identity-lab.png` });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/weapon-identity-stats.png` });
  await page.keyboard.press('Tab');
  for (let index = 0; index < 7; index += 1) {
    await page.waitForTimeout(900);
    await page.keyboard.press('g');
    await page.keyboard.press('1');
    await page.waitForTimeout(120);
    await page.screenshot({ path: `${outputDirectory}/weapon-identity-${index}.png` });
  }
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('1');
    await page.waitForTimeout(120);
  }
  await page.keyboard.press('F10');
  await page.waitForTimeout(700);
  await page.keyboard.press('g');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/upgrade-effects-stats.png` });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1800);
  await page.keyboard.press('g');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/upgrade-effects-lab.png` });
  await page.keyboard.press('F8');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/upgrade-effects-threat.png` });
  await page.keyboard.press('F8');
  for (let index = 0; index < 6; index += 1) {
    await page.waitForTimeout(700);
    await page.keyboard.press('g');
    await page.keyboard.press('1');
    await page.waitForTimeout(120);
    await page.screenshot({ path: `${outputDirectory}/upgrade-effects-${index}.png` });
  }
  await page.keyboard.press('F3');
  await page.waitForTimeout(1600);
  for (let index = 0; index < 7; index += 1) {
    await page.keyboard.press('g');
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${outputDirectory}/elite-charge-${index}.png` });
  }
  await page.keyboard.press('F4');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${outputDirectory}/arena.png` });
  for (let index = 0; index < 28; index += 1) {
    await page.keyboard.press('g');
    await page.keyboard.press('1');
    await page.waitForTimeout(500);
  }
  await page.keyboard.press('g');
  await page.keyboard.press('1');
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${outputDirectory}/warden-rebuild.png` });
  await page.keyboard.press('p');
  const averageFps = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let frames = 0;
        const startedAt = performance.now();
        const sample = (time) => {
          frames += 1;
          if (time - startedAt >= 4000) {
            resolve((frames * 1000) / (time - startedAt));
            return;
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
  );
  await page.screenshot({ path: `${outputDirectory}/stress.png` });
  console.log(`200-enemy stress sample: ${Number(averageFps).toFixed(1)} average FPS.`);
  for (let index = 0; index < 5; index += 1) {
    await page.keyboard.press('1');
    await page.waitForTimeout(250);
  }
  await page.keyboard.press('o');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${outputDirectory}/results.png` });
  await page.mouse.click(640, 490);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outputDirectory}/balance-overview.png` });
  await page.mouse.click(505, 125);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/balance-weapons.png` });
  await page.mouse.click(1045, 125);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/balance-choices.png` });
  await page.mouse.click(775, 125);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDirectory}/balance-pressure.png` });

  const canvasCount = await page.locator('canvas').count();
  if (canvasCount !== 1) {
    errors.push(`Expected one Phaser canvas, found ${canvasCount}.`);
  }
} finally {
  await browser?.close();
  await server.close();
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Smoke test passed. Captured gameplay, live telemetry, results, and balance-report screenshots.');
}
