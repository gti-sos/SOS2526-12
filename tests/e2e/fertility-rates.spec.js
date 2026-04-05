import { test, expect } from '@playwright/test';

const URL_FRONTEND = 'https://sos2526-12.onrender.com/age-specific-fertility-rates';

test.describe('Pruebas E2E - Gestion de Fertilidad', () => {

    // Ejecutar en serie para que los tests no se pisen entre ellos
    test.describe.configure({ mode: 'serial' });
    test.slow(); 

    const codigoUnico = 'Z' + Date.now().toString().slice(-2);
    const paisUnico = 'PaisTest_' + Date.now().toString().slice(-4);
    const anioUnico = '2026';

    test.beforeEach(async ({ page }) => {
        // Aceptamos las alertas nativas (el confirm de borrar)
        page.on('dialog', dialog => dialog.accept());
        
        // Vamos a la URL y le decimos a Playwright que espere a que la red se calme
        await page.goto(URL_FRONTEND, { waitUntil: 'networkidle' });

        // Buscamos el h1 de forma más directa y tolerante
        await expect(page.locator('h1')).toContainText('Tasas de Fertilidad por Paises', { timeout: 15000 });
    });

    test('1. Restaurar datos y listar recursos', async ({ page }) => {
        // Vaciar
        await page.getByRole('button', { name: 'Vaciar tabla' }).click();
        
        // Restaurar
        await page.getByRole('button', { name: 'Restaurar datos' }).click();

        // Esperamos a que aparezca el div con la clase exacta de tu Svelte
        await expect(page.locator('.mensaje-exito')).toBeVisible({ timeout: 15000 }); 
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar.' })).not.toBeVisible();
    });

    test('2. Crear un recurso nuevo', async ({ page }) => {
        await page.getByPlaceholder('Codigo (ej. ES)').fill(codigoUnico);
        await page.getByPlaceholder('Pais (ej. Espana)').fill(paisUnico);
        await page.getByPlaceholder('Ano (ej. 2022)').fill(anioUnico);
        await page.getByPlaceholder('Tasa 15-19').fill('1.5');
        await page.getByPlaceholder('Tasa 20-24').fill('2.5');

        await page.getByRole('button', { name: 'Anadir' }).click();
        
        await expect(page.locator('.mensaje-creacion')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('table')).toContainText(paisUnico);
    });

    test('3. Buscar recursos por pais', async ({ page }) => {
        await page.getByPlaceholder('Pais (ej. Spain)').fill(paisUnico);
        await page.getByRole('button', { name: 'Buscar' }).click();
        
        // Damos un respiro para que la tabla se filtre
        await page.waitForTimeout(1000);
        await expect(page.locator('table')).toContainText(paisUnico);
        
        await page.getByRole('button', { name: 'Limpiar' }).click();
    });

    test('4. Navegar a la vista de edicion', async ({ page }) => {
        const fila = page.locator('tr').filter({ hasText: paisUnico });
        await fila.getByRole('link', { name: 'Editar' }).click();
        
        await expect(page).toHaveURL(new RegExp(`/age-specific-fertility-rates/${codigoUnico}/${anioUnico}`));
    });

    test('5. Borrar un recurso concreto', async ({ page }) => {
        const fila = page.locator('tr').filter({ hasText: paisUnico });
        await fila.getByRole('button', { name: 'Eliminar' }).click();
        
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('table')).not.toContainText(paisUnico);
    });

    test('6. Vaciar toda la tabla', async ({ page }) => {
        await page.getByRole('button', { name: 'Vaciar tabla' }).click();
        
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar.' })).toBeVisible();
    });
});