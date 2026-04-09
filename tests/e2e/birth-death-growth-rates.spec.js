import { test, expect } from '@playwright/test';

const URL = '/birth-death-growth-rates';

test.describe('Pruebas E2E - Tasas de Natalidad, Mortalidad y Crecimiento', () => {

    test.describe.configure({ mode: 'serial' });
    test.slow();

    const codigoUnico = 'ZZ';
    const paisUnico = 'PaisTest';
    const anioUnico = '2030';

    let testToken;

    test.beforeAll(async ({ request }) => {
        const res = await request.get('/auth/test-token');
        const data = await res.json();
        testToken = data.token;
    });

    test.beforeEach(async ({ page }) => {
        // Mock auth/status so the page thinks we're logged in
        await page.route('**/auth/status', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ authenticated: true, user: 'playwright-test', avatar: null })
            });
        });
        // Mock auth/jwt to return our test token
        await page.route('**/auth/jwt', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ token: testToken })
            });
        });
        // Pre-inject the JWT into localStorage before the page loads
        await page.addInitScript((token) => {
            localStorage.setItem('lph_jwt', token);
        }, testToken);

        page.on('dialog', dialog => dialog.accept());
        await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
        await expect(page.locator('h1', { hasText: 'Tasas de Natalidad' })).toBeVisible({ timeout: 30000 });
    });

    // 1. Restaurar y listar
    test('1. Restaurar datos y listar recursos', async ({ page }) => {
        await page.getByRole('button', { name: /Eliminar todos/i }).click();
        await expect(page.locator('td', { hasText: 'No hay registros' })).toBeVisible({ timeout: 15000 });

        const loadPromise = page.waitForResponse(
            res => res.url().includes('loadInitialData') && res.status() === 200,
            { timeout: 30000 }
        );
        await page.getByRole('button', { name: /Restaurar/i }).click();
        await loadPromise;

        await expect(page.locator('table')).toContainText('Slovenia', { timeout: 15000 });
    });

    // 2. Crear recurso nuevo
    test('2. Crear un recurso nuevo', async ({ page }) => {
        await page.getByPlaceholder('Codigo (ej. ES) *').fill(codigoUnico);
        await page.getByPlaceholder('Pais (ej. Espana) *').fill(paisUnico);
        await page.getByPlaceholder('Anio (ej. 2022) *').fill(anioUnico);

        const postPromise = page.waitForResponse(
            res => res.url().includes('/api/v2/birth-death-growth-rates') && res.request().method() === 'POST',
            { timeout: 30000 }
        );
        await page.getByRole('button', { name: /Anadir registro/i }).click();
        await postPromise;

        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 15000 });
    });

    // 3a. Buscar por nombre
    test('3a. Buscar por nombre de pais', async ({ page }) => {
        await page.getByPlaceholder('Buscar por pais').fill(paisUnico);
        await page.getByRole('button', { name: /Buscar/i }).click();

        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 15000 });

        await page.getByRole('button', { name: /Limpiar/i }).click();
        await expect(page.locator('table')).toContainText('Slovenia', { timeout: 15000 });
    });

    // 3b. Buscar por código
    test('3b. Buscar por codigo de pais', async ({ page }) => {
        await page.getByPlaceholder('Buscar por codigo').fill(codigoUnico);
        await page.getByRole('button', { name: /Buscar/i }).click();

        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 15000 });

        await page.getByRole('button', { name: /Limpiar/i }).click();
        await expect(page.locator('table')).toContainText('Slovenia', { timeout: 15000 });
    });

    // 3c. Buscar por año exacto
    test('3c. Buscar por anio exacto', async ({ page }) => {
        await page.getByLabel('Año exacto').fill(anioUnico);
        await page.getByRole('button', { name: /Buscar/i }).click();

        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 15000 });
        await expect(page.locator('table')).not.toContainText('Slovenia', { timeout: 5000 });

        await page.getByRole('button', { name: /Limpiar/i }).click();
        await expect(page.locator('table')).toContainText('Slovenia', { timeout: 15000 });
    });

    // 3d. Buscar por año desde
    test('3d. Buscar por anio desde', async ({ page }) => {
        await page.getByPlaceholder('Ej: 2000').fill('2029');
        await page.getByRole('button', { name: /Buscar/i }).click();

        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 15000 });

        await page.getByRole('button', { name: /Limpiar/i }).click();
        await expect(page.locator('table')).toContainText('Slovenia', { timeout: 15000 });
    });

    // 3e. Buscar por año hasta
    test('3e. Buscar por anio hasta', async ({ page }) => {
        await page.getByPlaceholder('Ej: 2022').last().fill('2022');
        await page.getByRole('button', { name: /Buscar/i }).click();

        await expect(page.locator('table')).toContainText('Slovenia', { timeout: 15000 });
        await expect(page.locator('table')).not.toContainText(paisUnico, { timeout: 5000 });

        await page.getByRole('button', { name: /Limpiar/i }).click();
        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 15000 });
    });

    // 3f. Buscar por rango completo
    test('3f. Buscar por rango de anios desde-hasta', async ({ page }) => {
        await page.getByPlaceholder('Ej: 2000').fill('2020');
        await page.getByPlaceholder('Ej: 2022').last().fill('2022');
        await page.getByRole('button', { name: /Buscar/i }).click();

        await expect(page.locator('table')).toContainText('Slovenia', { timeout: 15000 });
        await expect(page.locator('table')).not.toContainText(paisUnico, { timeout: 5000 });

        await page.getByRole('button', { name: /Limpiar/i }).click();
        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 15000 });
    });

    // 4. Editar recurso
    test('4. Editar un recurso', async ({ page }) => {
        const fila = page.locator('tr').filter({ hasText: paisUnico });
        await fila.getByRole('link', { name: /Editar/i }).click();

        await expect(page).toHaveURL(new RegExp(`/birth-death-growth-rates/${codigoUnico}/${anioUnico}`), { timeout: 15000 });
        await expect(page.locator('h1', { hasText: 'Editar registro' })).toBeVisible({ timeout: 15000 });

        await page.locator('input:not([disabled])').first().fill(paisUnico + ' Editado');

        const putPromise = page.waitForResponse(
            res => res.url().includes(`/api/v2/birth-death-growth-rates/${codigoUnico}/${anioUnico}`) && res.request().method() === 'PUT',
            { timeout: 30000 }
        );
        await page.getByRole('button', { name: /Guardar cambios/i }).click();
        await putPromise;

        await expect(page).toHaveURL(new RegExp('/birth-death-growth-rates$'), { timeout: 15000 });
        await expect(page.locator('table')).toContainText(paisUnico + ' Editado', { timeout: 15000 });
    });

    // 5. Borrar recurso concreto
    test('5. Borrar un recurso concreto', async ({ page }) => {
        const fila = page.locator('tr').filter({ hasText: paisUnico + ' Editado' });
        await fila.getByRole('button', { name: /Eliminar/i }).click();

        await expect(page.locator('table')).not.toContainText(paisUnico + ' Editado', { timeout: 15000 });
    });

    // 6. Borrar todos
    test('6. Borrar todos los recursos', async ({ page }) => {
        const loadPromise = page.waitForResponse(
            res => res.url().includes('loadInitialData') && res.status() === 200,
            { timeout: 30000 }
        );
        await page.getByRole('button', { name: /Restaurar/i }).click();
        await loadPromise;

        await expect(page.locator('table')).toContainText('Slovenia', { timeout: 15000 });

        await page.getByRole('button', { name: /Eliminar todos/i }).click();
        await expect(page.locator('td', { hasText: 'No hay registros' })).toBeVisible({ timeout: 15000 });
    });
});
