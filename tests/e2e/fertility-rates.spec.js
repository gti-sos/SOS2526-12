import { test, expect } from '@playwright/test';

const URL_FRONTEND = 'https://sos2526-12.onrender.com/age-specific-fertility-rates';

test.describe('Pruebas E2E - Gestion de Fertilidad', () => {

    test.describe.configure({ mode: 'serial' });
    test.slow(); 

    const codigoUnico = 'Z' + Date.now().toString().slice(-2);
    const paisUnico = 'PaisTest_' + Date.now().toString().slice(-4);

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        
        const getInicial = page.waitForResponse(res => 
            res.url().includes('/api/v2/age-specific-fertility-rates') && res.request().method() === 'GET'
        );
        await page.goto(URL_FRONTEND);
        await getInicial; 

        await expect(page.getByRole('heading', { name: /Tasas de Fertilidad/i })).toBeVisible({ timeout: 15000 });
    });

    test('1. Listar recursos', async ({ page }) => {
        const deletePromise = page.waitForResponse(res => res.request().method() === 'DELETE');
        await page.click('button:has-text("Vaciar tabla")');
        await deletePromise;

        await page.click('button:has-text("Restaurar datos")');
        await expect(page.locator('.mensaje-exito')).toBeVisible({ timeout: 20000 }); 
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar' })).not.toBeVisible();
    });

    test('2. Crear un recurso', async ({ page }) => {
        await page.fill('input[placeholder="Codigo (ej. ES)"]', codigoUnico);
        await page.fill('input[placeholder="Pais (ej. Espana)"]', paisUnico); 
        await page.fill('input[placeholder="Anio"]', '2050');
        await page.fill('input[placeholder="Tasa 15-19"]', '1.1');
        await page.fill('input[placeholder="Tasa 20-24"]', '2.2');

        await page.click('button:has-text("Anadir")');
        await expect(page.locator('.mensaje-creacion')).toBeVisible({ timeout: 15000 });
    });

    test('3. Buscar recursos', async ({ page }) => {
        await page.locator('input[placeholder="Pais (ej. Spain)"]').fill(paisUnico);
        await page.click('button:has-text("Buscar")');
        
        await expect(page.locator('table')).toContainText(paisUnico);
    });

    test('4. Editar recurso', async ({ page }) => {
        const fila = page.locator('tr', { hasText: paisUnico });
        await fila.locator('a:has-text("Editar")').click();
        
        await expect(page.getByRole('heading', { name: "Editar Registro" })).toBeVisible({ timeout: 15000 });
        
        const inputTasa = page.locator('.form-row', { hasText: 'Tasa 15-19:' }).locator('input');
        await inputTasa.fill('9.9');
        
        await page.click('button:has-text("Guardar Cambios")');
        
        await expect(page.getByRole('heading', { name: /Tasas de Fertilidad/i })).toBeVisible({ timeout: 15000 });
        const filaEditada = page.locator('tr', { hasText: paisUnico });
        await expect(filaEditada).toContainText('9.9');
    });

    test('5. Borrar recurso concreto', async ({ page }) => {
        const fila = page.locator('tr', { hasText: paisUnico });
        await fila.locator('button:has-text("Eliminar")').click();
        
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('table')).not.toContainText(paisUnico);
    });

    test('6. Borrar todos los recursos', async ({ page }) => {
        const loadPromise = page.waitForResponse(res => res.url().includes('loadInitialData'));
        await page.click('button:has-text("Restaurar datos")');
        await loadPromise;

        await page.click('button:has-text("Vaciar tabla")');
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar' })).toBeVisible();
    });
});