import { test, expect } from '@playwright/test';

const URL = 'https://localhost:3000/birth-death-growth-rates';

test.describe('Pruebas E2E - Tasas de Natalidad, Mortalidad y Crecimiento', () => {

    test.describe.configure({ mode: 'serial' });
    test.slow();

    const codigoUnico = 'ZZ';
    const paisUnico = 'PaisTest';
    const anioUnico = '2030';

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
        await expect(page.locator('h1', { hasText: 'Tasas de Natalidad' })).toBeVisible({ timeout: 30000 });
    });

    // 1. Restaurar y listar
    test('1. Restaurar datos y listar recursos', async ({ page }) => {
        // Primero borramos todo para partir de estado limpio
        await page.getByRole('button', { name: /Eliminar todos/i }).click();
        await expect(page.locator('td', { hasText: 'No hay registros' })).toBeVisible({ timeout: 15000 });

        // Restauramos y esperamos la respuesta de la API
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

    // 3a. Buscar por nombre exacto
    test('3a. Buscar por nombre de pais', async ({ page }) => {
        await page.getByPlaceholder('Buscar por pais').fill(paisUnico);
        await page.getByRole('button', { name: /Buscar/i }).click();

        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 15000 });

        await page.getByRole('button', { name: /Limpiar/i }).click();
        await expect(page.locator('table')).toContainText('Slovenia', { timeout: 15000 });
    });

    // 3b. Buscar por código de país
    test('3b. Buscar por codigo de pais', async ({ page }) => {
        await page.getByPlaceholder('Buscar por codigo').fill(codigoUnico);
        await page.getByRole('button', { name: /Buscar/i }).click();

        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 15000 });

        await page.getByRole('button', { name: /Limpiar/i }).click();
        await expect(page.locator('table')).toContainText('Slovenia', { timeout: 15000 });
    });

    // 3c. Buscar por año exacto
    test('3c. Buscar por anio exacto', async ({ page }) => {
        await page.getByPlaceholder('Ej: 2022').fill(anioUnico);
        await page.getByRole('button', { name: /Buscar/i }).click();

        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 15000 });
        // Solo debe aparecer el registro de ese año exacto
        await expect(page.locator('table')).not.toContainText('Slovenia', { timeout: 5000 });

        await page.getByRole('button', { name: /Limpiar/i }).click();
        await expect(page.locator('table')).toContainText('Slovenia', { timeout: 15000 });
    });

    // 3d. Buscar por rango de años (desde)
    test('3d. Buscar por anio desde', async ({ page }) => {
        await page.getByPlaceholder('Ej: 2000').fill('2029');
        await page.getByRole('button', { name: /Buscar/i }).click();

        // El registro ZZ/2030 debe aparecer (>= 2029)
        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 15000 });

        await page.getByRole('button', { name: /Limpiar/i }).click();
        await expect(page.locator('table')).toContainText('Slovenia', { timeout: 15000 });
    });

    // 3e. Buscar por rango de años (hasta)
    test('3e. Buscar por anio hasta', async ({ page }) => {
        await page.getByPlaceholder('Ej: 2022').last().fill('2022');
        await page.getByRole('button', { name: /Buscar/i }).click();

        // Los registros iniciales (año 2022) deben aparecer, el ZZ/2030 no
        await expect(page.locator('table')).toContainText('Slovenia', { timeout: 15000 });
        await expect(page.locator('table')).not.toContainText(paisUnico, { timeout: 5000 });

        await page.getByRole('button', { name: /Limpiar/i }).click();
        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 15000 });
    });

    // 3f. Buscar por rango completo (desde + hasta)
    test('3f. Buscar por rango de anios desde-hasta', async ({ page }) => {
        await page.getByPlaceholder('Ej: 2000').fill('2020');
        await page.getByPlaceholder('Ej: 2022').last().fill('2022');
        await page.getByRole('button', { name: /Buscar/i }).click();

        // Solo los de 2020-2022 (los datos iniciales son de 2021-2022)
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

        // El primer input no disabled es country_name (código y año están disabled)
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
        // Tras la edición el nombre es paisUnico + ' Editado'
        const fila = page.locator('tr').filter({ hasText: paisUnico + ' Editado' });
        await fila.getByRole('button', { name: /Eliminar/i }).click();

        await expect(page.locator('table')).not.toContainText(paisUnico + ' Editado', { timeout: 15000 });
    });

    // 6. Borrar todos los recursos
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
