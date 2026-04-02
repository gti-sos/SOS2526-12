import { test, expect } from '@playwright/test';

const URL_FRONTEND = 'https://sos2526-12.onrender.com/mid-population-ages';

test.describe('Pruebas E2E - Frontend Gestión de Población', () => {

    test.describe.configure({ mode: 'serial' });
    test.slow(); 

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await page.goto(URL_FRONTEND);
        await expect(page.locator('h1', { hasText: 'Tasas de Edades de Población' })).toBeVisible({ timeout: 15000 });
    });

    test('1. Listar recursos', async ({ page }) => {
        await expect(page.locator('h1', { hasText: 'Tasas de Edades de Población' })).toBeVisible();
    });

    test('2. Crear un recurso', async ({ page }) => {
        // 1. Restauramos SIEMPRE primero para que el "Vaciar" nunca de error 404
        await page.click('button:has-text("Restaurar datos de prueba")');
        await expect(page.locator('.mensaje-exito')).toBeVisible({ timeout: 15000 });

        // 2. Ahora sí, vaciamos de forma segura
        await page.click('button:has-text("Vaciar toda la tabla")');
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });

        // 3. Rellenamos formulario
        await page.fill('input[placeholder="Cód. País"]', 'TEST');
        await page.fill('input[placeholder="País"]', 'PaisPrueba');
        await page.fill('input[placeholder="Año"]', '2025');
        await page.locator('select').selectOption({ index: 1 });
        await page.fill('input[placeholder="Edad Máx"]', '100');
        await page.fill('input[placeholder*="Pob. 0"]', '10');
        await page.fill('input[placeholder*="Pob. 25"]', '20');
        await page.fill('input[placeholder*="Pob. 50"]', '30');
        await page.fill('input[placeholder*="Pob. 75"]', '40');
        await page.fill('input[placeholder*="Pob. 100"]', '50');

        // 4. Guardamos
        await page.click('button:has-text("Añadir a la lista")');
        await expect(page.locator('.mensaje-creacion')).toBeVisible({ timeout: 15000 });
    });

    test('3. Buscar recursos', async ({ page }) => {
        await page.click('button:has-text("Restaurar datos de prueba")');
        await expect(page.locator('.mensaje-exito')).toBeVisible({ timeout: 15000 });

        // Nos aseguramos de que el dato que vamos a buscar existe en pantalla
        await expect(page.locator('td', { hasText: 'Afghanistan' }).first()).toBeVisible({ timeout: 10000 });

        await page.locator('input[placeholder*="Buscar por País"]').fill('Afghanistan');
        await page.click('button:has-text("Buscar Registros")');
        
        await expect(page.locator('table')).toContainText('Afghanistan');
    });

    test('4. Editar recurso (Vista separada)', async ({ page }) => {
        await page.click('button:has-text("Restaurar datos de prueba")');
        await expect(page.locator('.mensaje-exito')).toBeVisible({ timeout: 15000 });
        
        await expect(page.locator('a:has-text("Editar")').first()).toBeVisible({ timeout: 10000 });
        await page.locator('a:has-text("Editar")').first().click();
        
        await expect(page.locator('h1', { hasText: 'Editar Registro' })).toBeVisible({ timeout: 15000 });
        
        await page.click('button:has-text("Cancelar y Volver")');
        await expect(page.locator('h1', { hasText: 'Tasas de Edades de Población' })).toBeVisible({ timeout: 10000 });
    });

    test('5. Borrar un recurso concreto', async ({ page }) => {
        await page.click('button:has-text("Restaurar datos de prueba")');
        await expect(page.locator('.mensaje-exito')).toBeVisible({ timeout: 15000 });
        
        const btnEliminar = page.locator('button:has-text("Eliminar")').first();
        await expect(btnEliminar).toBeVisible();

        await btnEliminar.click();
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
    });

    test('6. Borrar todos los recursos', async ({ page }) => {
        await page.click('button:has-text("Restaurar datos de prueba")');
        await expect(page.locator('.mensaje-exito')).toBeVisible({ timeout: 15000 });
        
        await page.click('button:has-text("Vaciar toda la tabla")');
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar' })).toBeVisible();
    });
});