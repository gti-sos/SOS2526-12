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
        // Pre-inject the JWT into localStorage — initAuth() detects it and skips Auth0 entirely
        await page.addInitScript((token) => {
            localStorage.setItem('lph_jwt', token);
        }, testToken);

        page.on('dialog', dialog => dialog.accept());
        await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
        await expect(page.locator('h1', { hasText: 'Tasas de Natalidad' })).toBeVisible({ timeout: 30000 });
    });

    // 1. Restaurar y listar
    test('1. Restaurar datos y listar recursos', async ({ page }) => {
        const deletePromise = page.waitForResponse(
            res => res.url().includes('/api/v2/birth-death-growth-rates') && res.request().method() === 'DELETE',
            { timeout: 30000 }
        );
        await page.getByRole('button', { name: /Eliminar todos/i }).click();
        await deletePromise;
        await expect(page.locator('td', { hasText: 'No hay registros' })).toBeVisible({ timeout: 15000 });

        const loadPromise = page.waitForResponse(
            res => res.url().includes('loadInitialData'),
            { timeout: 30000 }
        );
        await page.getByRole('button', { name: /Restaurar/i }).click();
        await loadPromise;
        // Esperar a que aparezcan filas con datos reales (con boton Editar)
        await expect(page.getByRole('link', { name: /Editar/i }).first()).toBeVisible({ timeout: 15000 });
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

    // 7. Verificar que la pagina del grafico individual carga
    test('7. Grafico individual (analytics) carga correctamente', async ({ page }) => {
        // Test 6 borra todo, restaurar datos primero
        await page.getByRole('button', { name: /Restaurar/i }).click();
        await expect(page.getByRole('link', { name: /Editar/i }).first()).toBeVisible({ timeout: 15000 });

        await page.goto('/analytics/birth-death-growth-rates', { waitUntil: 'networkidle', timeout: 60000 });
        await expect(page.locator('h2', { hasText: 'Visualización Individual (LPH)' })).toBeVisible({ timeout: 15000 });

        // Highcharts renderiza dentro del div#container
        await expect(page.locator('#container .highcharts-container')).toBeVisible({ timeout: 15000 });
    });

    // 8. Verificar que la pagina del mapa carga
    test('8. Mapa geoespacial carga correctamente', async ({ page }) => {
        await page.goto('/analytics/birth-death-growth-rates/map', { waitUntil: 'networkidle', timeout: 60000 });
        await expect(page.locator('h2', { hasText: 'Mapa Geoespacial (LPH)' })).toBeVisible({ timeout: 15000 });

        // Leaflet inicializa el mapa — verificar que el contenedor tiene clase leaflet-container
        await expect(page.locator('#map-container.leaflet-container')).toBeAttached({ timeout: 15000 });
    });

    // 9. Verificar que la pagina de analytics grupal carga
    test('9. Analytics grupal carga correctamente', async ({ page }) => {
        await page.goto('/analytics', { waitUntil: 'networkidle', timeout: 60000 });
        await expect(page.locator('h1', { hasText: 'Panel de Analytics Integrado' })).toBeVisible({ timeout: 15000 });

        // Highcharts renderiza dentro del div#chart-container
        await expect(page.locator('#chart-container .highcharts-container')).toBeVisible({ timeout: 15000 });
    });
});
