import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer, preview } from 'vite';

process.env.VITE_DISABLE_RUN_ARCHIVE = 'true';

const production = process.argv.includes('--production');
const port = production ? 4174 : 4173;
const outputDirectory = `.smoke/${production ? 'production' : 'development'}`;
const errors = [];
const GAME_WIDTH = 1920;
const GAME_HEIGHT = 1080;
const browserCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browserPath = browserCandidates.find((candidate) => existsSync(candidate));

if (!browserPath) {
  throw new Error('No supported Chrome or Edge executable found. Set CHROME_PATH to run the smoke test.');
}

// Each run owns its mode-specific directory. Clearing it up-front prevents a
// partial failure from leaving later screenshots that belong to an older run.
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
const server = production
  ? await preview({ preview: { host: '127.0.0.1', port, strictPort: true } })
  : await createServer({ server: { host: '127.0.0.1', port, strictPort: true } });

if (!production) {
  await server.listen();
}

let browser;
try {
  browser = await chromium.launch({ executablePath: browserPath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console: ${message.text()}`);
    }
  });

  const canvas = page.locator('canvas');
  const clickGame = async (logicalX, logicalY) => {
    const box = await canvas.boundingBox();
    if (!box) {
      throw new Error('The Phaser canvas is not visible.');
    }
    await page.mouse.click(
      box.x + (logicalX / GAME_WIDTH) * box.width,
      box.y + (logicalY / GAME_HEIGHT) * box.height,
    );
  };
  const waitForDataset = async (key, expected) => {
    await page.waitForFunction(
      ({ datasetKey, value }) => document.body.dataset[datasetKey] === value,
      { datasetKey: key, value: expected },
      { timeout: 10_000 },
    );
  };
  const waitForDatasetAbsent = async (key) => {
    await page.waitForFunction(
      (datasetKey) => document.body.dataset[datasetKey] === undefined,
      key,
      { timeout: 5_000 },
    );
  };
  const assertDatasetAbsent = async (key, label) => {
    const value = await page.evaluate((datasetKey) => document.body.dataset[datasetKey], key);
    if (value !== undefined) errors.push(`${label}: expected body.dataset.${key} to be absent, got ${value}.`);
  };
  const assertGameSurface = async (label) => {
    const canvasCount = await canvas.count();
    const state = await page.evaluate(() => ({
      gameRunning: document.body.classList.contains('game-running'),
      exitButton: Boolean(document.querySelector('[data-exit-game]')),
    }));
    const box = canvasCount === 1 ? await canvas.boundingBox() : null;
    if (canvasCount !== 1) errors.push(`${label}: expected one Phaser canvas, found ${canvasCount}.`);
    if (!box || box.width <= 0 || box.height <= 0) errors.push(`${label}: Phaser canvas is not visibly laid out.`);
    if (!state.gameRunning) errors.push(`${label}: body is missing the game-running state.`);
    if (!state.exitButton) errors.push(`${label}: game exit control is missing.`);
  };

  await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${outputDirectory}/01-landing.png`, fullPage: true });
  await page.locator('[data-start-game]').first().click();
  await canvas.waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForTimeout(1_500);
  await waitForDataset('limboScene', 'main-menu');
  await assertGameSurface(`${production ? 'Production' : 'Development'} main menu`);
  await page.screenshot({ path: `${outputDirectory}/02-main-menu.png` });

  // Phaser renders at 1920x1080 and scales to the viewport. Always translate
  // logical scene coordinates through the current canvas bounds.
  await clickGame(960, 652);
  await waitForDataset('limboScene', 'settings');
  await page.screenshot({ path: `${outputDirectory}/03-settings.png` });
  await clickGame(960, 1028);
  await waitForDataset('limboScene', 'main-menu');
  await clickGame(960, 472);
  await waitForDataset('limboScene', 'character-select');
  await page.screenshot({ path: `${outputDirectory}/04-character-select.png` });
  await clickGame(960, 765);
  await waitForDataset('limboScene', 'gameplay');
  await page.waitForTimeout(1_500);
  await assertGameSurface(`${production ? 'Production' : 'Development'} gameplay`);
  await page.screenshot({ path: `${outputDirectory}/05-gameplay.png` });

  await page.keyboard.press('Escape');
  await waitForDataset('limboScene', 'pause');
  await page.screenshot({ path: `${outputDirectory}/06-pause.png` });
  await clickGame(960, 292);
  await waitForDataset('limboScene', 'gameplay');

  if (!production) {
    const openDevToolsTab = async () => {
      await page.keyboard.press('F12');
      await waitForDataset('devMode', 'open');
      await clickGame(1060, 195);
      await page.waitForTimeout(100);
    };

    await openDevToolsTab();
    await clickGame(990, 315);
    await waitForDataset('devGameSpeed', '2');
    await clickGame(370, 565);
    await waitForDataset('devGameplayGuides', 'true');
    await page.screenshot({ path: `${outputDirectory}/07-dev-tools.png` });

    // Exercise a named semantic Tesla role and verify the tool overlay yielded
    // control back to the live gameplay scene.
    await clickGame(600, 450);
    await waitForDatasetAbsent('devMode');
    await assertGameSurface('Gameplay after DevMode Tesla role');
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${outputDirectory}/08-dev-tesla-role.png` });

    // Reset is meaningful only if a fresh encounter can reopen DevMode with
    // simulation controls restored to their scene defaults.
    await openDevToolsTab();
    await clickGame(1430, 315);
    await waitForDatasetAbsent('devMode');
    await waitForDataset('limboScene', 'gameplay');
    await page.waitForTimeout(500);
    await openDevToolsTab();
    await waitForDataset('devGameSpeed', '1');
    await waitForDataset('devGameplayGuides', 'false');
    await page.screenshot({ path: `${outputDirectory}/09-dev-reset-verified.png` });
    await page.keyboard.press('Escape');
    await waitForDatasetAbsent('devMode');

    await page.keyboard.press('F11');
    await waitForDataset('contentLab', 'open');
    await page.screenshot({ path: `${outputDirectory}/10-content-lab.png` });
    for (let index = 0; index < 7; index += 1) {
      await page.keyboard.press('Period');
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(600);
    await page.keyboard.press('Minus');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('q');
    await page.keyboard.press('Space');
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${outputDirectory}/10-content-lab-vvfx-controls.png` });
    await page.keyboard.press('Escape');
    await waitForDatasetAbsent('contentLab');
    await assertGameSurface('Gameplay after Content Lab');
    await page.keyboard.press('o');
    await waitForDataset('limboScene', 'result-loss');
    await page.waitForTimeout(300);
    const resultFormBox = await page.locator('.result-name-form').boundingBox();
    const resultCanvasBox = await canvas.boundingBox();
    if (!resultFormBox || !resultCanvasBox) {
      errors.push('Result screen: run-data form or canvas is not visibly laid out.');
    } else {
      const formCenterX = resultFormBox.x + resultFormBox.width / 2;
      const canvasCenterX = resultCanvasBox.x + resultCanvasBox.width / 2;
      const horizontalTolerance = resultCanvasBox.width * 0.02;
      const normalizedTop = (resultFormBox.y - resultCanvasBox.y) / resultCanvasBox.height;
      const normalizedBottom = (resultFormBox.y + resultFormBox.height - resultCanvasBox.y) / resultCanvasBox.height;
      if (Math.abs(formCenterX - canvasCenterX) > horizontalTolerance) {
        errors.push('Result screen: run-data form is not centered over the game canvas.');
      }
      if (normalizedTop < 0.48 || normalizedBottom > 0.72) {
        errors.push('Result screen: run-data form overlaps the summary or action-button regions.');
      }
    }
    await page.screenshot({ path: `${outputDirectory}/11-results.png` });
  } else {
    await page.keyboard.press('F12');
    await page.waitForTimeout(250);
    await assertDatasetAbsent('devMode', 'Production DevMode gate');
    await page.keyboard.press('F11');
    await page.waitForTimeout(250);
    await assertDatasetAbsent('contentLab', 'Production Content Lab gate');
    await waitForDataset('limboScene', 'gameplay');
    await assertGameSurface('Production gameplay after dev-tool shortcuts');
  }

  if ((await canvas.count()) !== 1) {
    errors.push(`Expected one Phaser canvas before exit, found ${await canvas.count()}.`);
  }
  await page.locator('[data-exit-game]').click();
  await canvas.waitFor({ state: 'detached', timeout: 5_000 });
  await page.locator('[data-start-game]').first().waitFor({ state: 'visible', timeout: 5_000 });
  const returnedToSite = await page.evaluate(() => !document.body.classList.contains('game-running'));
  if (!returnedToSite) errors.push('Exit flow left the body in the game-running state.');
  await assertDatasetAbsent('limboScene', 'Exit scene marker cleanup');
  await page.screenshot({ path: `${outputDirectory}/12-returned-to-site.png`, fullPage: true });
} catch (error) {
  errors.push(`smoke: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
} finally {
  await browser?.close();
  if (production) {
    await new Promise((resolve, reject) => {
      server.httpServer.close((error) => (error ? reject(error) : resolve()));
    });
  } else {
    await server.close();
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${production ? 'Production' : 'Development'} smoke test passed. Evidence: ${outputDirectory}`);
}
