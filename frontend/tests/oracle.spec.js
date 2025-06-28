import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

test.describe('Clean Oracle E2E Tests', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addInitScript(() => {
      window.localStorage.clear();
    });

    // Mock API calls
    await page.route('**/api/register', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ uuid: uuidv4() }),
      });
    });

    await page.route('**/api/oracle', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'これはモックサーバーからの神託です。あなたの部屋は…まあ、もう少し綺麗にできるでしょう。',
          point: 75,
        }),
      });
    });
  });

  test('should register a room and get an oracle', async ({ page }) => {
    await page.goto('/');
    // 1. 「神の部屋」の登録画面���表示されることを確認
    await expect(page.getByText('神の部屋の登録')).toBeVisible();

    // 2. ダミー画像をアップロードし、登録が成功することを確認
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('画像を選択').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test_image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('dummy image data'),
    });

    await page.getByRole('button', { name: 'アップロード' }).click();

    // 3. 「民の部屋」のアップロード画面に遷移することを確認
    await expect(page.getByText('部屋のきれいさを判定します')).toBeVisible();

    // 4. ダミー画像をアップロードし、神託が表示されることを確認
    const oracleFileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('画像を選択').click();
    const oracleFileChooser = await oracleFileChooserPromise;
    await oracleFileChooser.setFiles({
      name: 'test_oracle_image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('dummy oracle image data'),
    });

    await page.getByRole('button', { name: 'アップロード' }).click();

    // Wait for the oracle message to appear
    const oracleMessage = page.getByTestId('oracle-message');
    await expect(oracleMessage).toBeVisible();
    await expect(oracleMessage).toContainText('これはモックサーバーからの神託です。');

    // 5. 「再度トライ」ボタンをクリックし、アップロード画面に戻ることを確認
    await page.getByRole('button', { name: '再度トライ' }).click();
    await page.waitForFunction(() => !document.querySelector('[data-testid="oracle-message"]'));
    await expect(page.getByText('現在の部屋の画像をアップロードしてください。')).toBeVisible();
  });
});
