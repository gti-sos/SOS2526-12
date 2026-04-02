import { test, expect } from '@playwright/test';

const URL_FRONTEND = 'http://localhost:3000/mid-population-ages';

test.describe('Pruebas E2E - Frontend Gestión de Población', () => {

    test.describe.configure({ mode: 'serial' });
    test.slow(); 

    const nombrePaisUnico = 'PaisPrueba_' + Date.now().toString().slice(-5);

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        
        
        const getInicial = page.waitForResponse(res => 
            res.url().includes('/api/v2/mid-population-ages') && res.request().method() === 'GET'
        );
        await page.goto(URL_FRONTEND);
        await getInicial; 

        await expect(page.locator('h1', { hasText: 'Tasas de Edades de Población' })).toBeVisible({ timeout: 15000 });
    });

    test('1. Listar recursos', async ({ page }) => {
        const deletePromise = page.waitForResponse(res => res.request().method() === 'DELETE');
        await page.click('button:has-text("Vaciar toda la tabla")');
        await deletePromise;

        await page.click('button:has-text("Restaurar datos de prueba")');
        await expect(page.locator('.mensaje-exito')).toBeVisible({ timeout: 60000 }); 
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar' })).not.toBeVisible();
    });

    test('2. Crear un recurso', async ({ page }) => {
        await page.fill('input[placeholder="Cód. País"]', 'TEST');
        await page.fill('input[placeholder="País"]', nombrePaisUnico); 
        await page.fill('input[placeholder="Año"]', '2025');
        await page.locator('select').selectOption('Male');
        await page.fill('input[placeholder="Edad Máx"]', '100');
        await page.fill('input[placeholder*="Pob. 0"]', '10');
        await page.fill('input[placeholder*="Pob. 25"]', '20');
        await page.fill('input[placeholder*="Pob. 50"]', '30');
        await page.fill('input[placeholder*="Pob. 75"]', '40');
        await page.fill('input[placeholder*="Pob. 100"]', '50');

        await page.click('button:has-text("Añadir a la lista")');
        await expect(page.locator('.mensaje-creacion')).toBeVisible({ timeout: 15000 });
    });

    test('3. Buscar recursos', async ({ page }) => {
        await page.locator('input[placeholder*="Buscar por País"]').fill(nombrePaisUnico);
        await page.click('button:has-text("Buscar Registros")');
        
        await expect(page.locator('table')).toContainText(nombrePaisUnico);
    });

    test('4. Editar recurso (Vista separada)', async ({ page }) => {
        const filaNueva = page.locator('tr', { hasText: nombrePaisUnico });
        await filaNueva.locator('a:has-text("Editar")').click();
        
        await expect(page.locator('h1', { hasText: 'Editar Registro' })).toBeVisible({ timeout: 15000 });
        
        const inputEdadMax = page.locator('.form-row', { hasText: 'Edad Máxima:' }).locator('input');
        
        await inputEdadMax.fill('99');
        
        await page.click('button:has-text("Guardar Cambios")');
        
        await expect(page.locator('h1', { hasText: 'Tasas de Edades de Población' })).toBeVisible({ timeout: 10000 });
        
        const filaEditada = page.locator('tr', { hasText: nombrePaisUnico });
        await expect(filaEditada).toContainText('99');
    });

    test('5. Borrar un recurso concreto', async ({ page }) => {
        const filaNueva = page.locator('tr', { hasText: nombrePaisUnico });
        await filaNueva.locator('button:has-text("Eliminar")').click();
        
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('table')).not.toContainText(nombrePaisUnico);
    });

    test('6. Borrar todos los recursos', async ({ page }) => {
        const loadPromise = page.waitForResponse(res => res.url().includes('loadInitialData'));
        await page.click('button:has-text("Restaurar datos de prueba")');
        await loadPromise;

        await page.click('button:has-text("Vaciar toda la tabla")');
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar' })).toBeVisible();
    });
});