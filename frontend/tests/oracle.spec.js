import { test, expect } from '@playwright/test';

test.describe('Clean Oracle E2E Tests', () => {
  test('should register a room and get an oracle', async ({ page }) => {
    // Mock /api/register endpoint
    await page.route('**/api/register', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ uuid: 'test-uuid-123' }),
      });
    });

    // Mock /api/oracle endpoint
    await page.route('**/api/oracle', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: '<html><p>これはテストの神託です。点数: 75</p></html>',
          point: 75,
        }),
      });
    });

    await page.goto('/');

    // 1. 「神の部屋」の登録画面が表示されることを確認
    await expect(page.getByText('神の部屋を登録してください')).toBeVisible();

    // 2. ダミー画像をアップロードし、登録が成功することを確認
    // Note: Playwright's setInputFiles doesn't trigger form submission automatically for some setups.
    // We might need to click a submit button if there is one.
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('画像を選択').click(); // Assuming there's a button to trigger file input
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test_image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('dummy image data'),
    });

    // Assuming there's a submit button after file selection, or it auto-submits
    // If there's no explicit submit button, the file input change might trigger it.
    // For now, let's assume the file input change is enough or there's an implicit submission.
    // If not, you'll need to add a click on a submit button here.
    await page.getByRole('button', { name: '登録' }).click();

    // 3. 「民の部屋」のアップロード画面に遷移することを確認
    await expect(page.getByText('神託を授けます')).toBeVisible();

    // 4. ダミー画像をアップロードし、神託が表示されることを確認
    const oracleFileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('アップロード').click(); // Assuming this button triggers file input for oracle
    const oracleFileChooser = await oracleFileChooserPromise;
    await oracleFileChooser.setFiles({
      name: 'test_oracle_image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('dummy oracle image data'),
    });

    // Assuming there's a submit button after file selection, or it auto-submits
    await page.getByRole('button', { name: 'アップロード' }).click();

    // Wait for the oracle message to appear
    await expect(page.getByText('これはテストの神託です。点数: 75')).toBeVisible();
  });
});
