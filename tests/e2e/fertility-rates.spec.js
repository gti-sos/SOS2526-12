import { test, expect } from '@playwright/test';

const URL_FRONTEND = 'https://sos2526-12.onrender.com/age-specific-fertility-rates';

test.describe('Pruebas E2E - Frontend Gestión de Fertilidad', () => {

    test.describe.configure({ mode: 'serial' });
    test.slow(); 

    const codigoUnico = 'Z' + Date.now().toString().slice(-2);
    const anioUnico = '2050';

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        
        const getInicial = page.waitForResponse(res => 
            res.url().includes('/api/v2/age-specific-fertility-rates') && res.request().method() === 'GET'
        );
        await page.goto(URL_FRONTEND);
        await getInicial; 
 
        await expect(page.locator('h1', { hasText: 'Tasas de Fertilidad por Países' })).toBeVisible({ timeout: 15000 });
    });

    test('1. Listar recursos (Vaciar y Restaurar)', async ({ page }) => {
        const deletePromise = page.waitForResponse(res => res.request().method() === 'DELETE');
        await page.click('button:has-text("🗑️ Vaciar tabla")');
        await deletePromise;

        const loadPromise = page.waitForResponse(res => res.url().includes('loadInitialData'));
        await page.click('button:has-text("📥 Restaurar datos")');
        await loadPromise;

        await expect(page.locator('.mensaje-exito')).toBeVisible({ timeout: 15000 }); 
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar.' })).not.toBeVisible();
    });

    test('2. Crear un recurso', async ({ page }) => {
        await page.fill('input[placeholder="Código (ej. ES)"]', codigoUnico);
        await page.fill('input[placeholder="País (ej. España)"]', 'PaisPrueba'); 
        await page.fill('input[placeholder="Año (ej. 2022)"]', anioUnico);
        await page.fill('input[placeholder="Tasa 15-19"]', '1.5');
        await page.fill('input[placeholder="Tasa 20-24"]', '2.5');

        const postPromise = page.waitForResponse(res => res.request().method() === 'POST');
        await page.click('button:has-text("Añadir")');
        await postPromise;

        await expect(page.locator('.mensaje-creacion')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('table')).toContainText(codigoUnico);
    });

    test('3. Buscar recursos', async ({ page }) => {
        await page.fill('input[placeholder="Desde año"]', anioUnico);
        await page.fill('input[placeholder="Hasta año"]', anioUnico);
        
        const searchPromise = page.waitForResponse(res => res.url().includes('from=') && res.request().method() === 'GET');
        await page.click('button:has-text("Buscar")');
        await searchPromise;
        
        await expect(page.locator('table')).toContainText(codigoUnico);
    });

    test('4. Editar recurso (Vista separada)', async ({ page }) => {
        // Buscamos la fila del país y ahora hacemos clic en el nuevo botón "✏️ Editar"
        const filaNueva = page.locator('tr', { hasText: codigoUnico });
        await filaNueva.locator('a:has-text("✏️ Editar")').click();
        
        await expect(page.locator('h1', { hasText: '✏️ Editar Recurso' })).toBeVisible({ timeout: 15000 });
        
        const inputTasa1519 = page.locator('.input-group', { hasText: 'Tasa (15 a 19 años)' }).locator('input');
        await inputTasa1519.fill('9.9');
        
        const putPromise = page.waitForResponse(res => res.request().method() === 'PUT');
        await page.click('button:has-text("💾 Guardar Cambios")');
        await putPromise;
        
        await expect(page.locator('h1', { hasText: 'Tasas de Fertilidad por Países' })).toBeVisible({ timeout: 15000 });
        const filaEditada = page.locator('tr', { hasText: codigoUnico });
        await expect(filaEditada).toContainText('9.9');
    });

    test('5. Borrar un recurso concreto', async ({ page }) => {
        const filaNueva = page.locator('tr', { hasText: codigoUnico });
        const deleteOnePromise = page.waitForResponse(res => res.request().method() === 'DELETE');
        await filaNueva.locator('button:has-text("🗑️ Eliminar")').click();
        await deleteOnePromise;
        
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('table')).not.toContainText(codigoUnico);
    });

    test('6. Borrar todos los recursos', async ({ page }) => {
        const loadPromise = page.waitForResponse(res => res.url().includes('loadInitialData'));
        await page.click('button:has-text("📥 Restaurar datos")');
        await loadPromise;

        const deleteAllPromise = page.waitForResponse(res => res.request().method() === 'DELETE');
        await page.click('button:has-text("🗑️ Vaciar tabla")');
        await deleteAllPromise;

        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar.' })).toBeVisible();
    });
});