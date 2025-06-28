import { test, expect } from '@playwright/test';

test.describe('Clean Oracle E2E Tests', () => {
  test('should register a room and get an oracle', async ({ page }) => {
    await page.goto('/');

    // 1. 「神の部屋」の登録画面が表示されることを確認
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
    await expect(page.getByText('神託を授けます')).toBeVisible();

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
    await expect(page.getByText('これはモックサーバーからの神託です。あなたの部屋は…まあ、もう少し綺麗にできるでしょう。')).toBeVisible();
  });
});

