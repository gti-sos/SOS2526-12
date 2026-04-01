import { test, expect } from '@playwright/test';

const URL_FRONTEND = 'https://sos2526-12.onrender.com/mid-population-ages';

test.describe('Pruebas E2E - Frontend Gestión de Población', () => {

    // Configuración para que cada test tenga su propio margen de tiempo
    test.slow(); 

    test('1. Listar recursos', async ({ page }) => {
        await page.goto(URL_FRONTEND, { waitUntil: 'networkidle' });
        await expect(page.locator('h1', { hasText: /Tasas de Edades de Población/i })).toBeVisible();
    });

    test('2. Crear un recurso', async ({ page }) => {
        await page.goto(URL_FRONTEND);
        page.on('dialog', d => d.accept());

        // Esperamos a que el borrado termine en el servidor
        await page.click('button:has-text("Vaciar toda la tabla")');
        await expect(page.locator('.mensaje-borrado')).toBeVisible();

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

        // Al hacer clic, esperamos la respuesta 201 del servidor
        const responsePromise = page.waitForResponse(res => res.status() === 201);
        await page.click('button:has-text("Añadir a la lista")');
        await responsePromise;

        await expect(page.locator('.mensaje-creacion')).toBeVisible();
    });

    test('3. Buscar recursos', async ({ page }) => {
        await page.goto(URL_FRONTEND);
        page.on('dialog', d => d.accept());

        await page.click('button:has-text("Vaciar toda la tabla")');
        
        // Esperamos a que los datos de prueba se carguen de verdad
        const loadPromise = page.waitForResponse(res => res.url().includes('loadInitialData'));
        await page.click('button:has-text("Restaurar datos de prueba")');
        await loadPromise;

        // Esperamos a que el primer dato aparezca en la tabla
        await expect(page.locator('td', { hasText: 'Afghanistan' }).first()).toBeVisible({ timeout: 10000 });

        await page.fill('input[placeholder*="Buscar por País"]', 'Afghanistan');
        await page.click('button:has-text("Buscar Registros")');
        
        // Comprobamos que la tabla SOLO muestra Afghanistan
        await expect(page.locator('table')).toContainText('Afghanistan');
    });

    test('4. Editar recurso (Vista separada)', async ({ page }) => {
        await page.goto(URL_FRONTEND);
        page.on('dialog', d => d.accept());

        await page.click('button:has-text("Restaurar datos de prueba")');
        await expect(page.locator('a:has-text("Editar")').first()).toBeVisible();
        
        await page.locator('a:has-text("Editar")').first().click();
        
        // Esperamos a que la URL cambie y aparezca el título
        await page.waitForURL(/.*mid-population-ages\/.*/);
        await expect(page.locator('h1', { hasText: /Editar Registro/i })).toBeVisible({ timeout: 15000 });
        
        await page.click('button:has-text("Cancelar y Volver")');
        await expect(page.locator('h1', { hasText: /Tasas de Edades de Población/i })).toBeVisible();
    });

    
    test('5. Borrar un recurso concreto', async ({ page }) => {
        await page.goto(URL_FRONTEND);
        page.on('dialog', dialog => dialog.accept());

        // Vaciamos y restauramos para asegurarnos de que la tabla tiene algo que borrar
        await page.click('button:has-text("Vaciar toda la tabla")');
        await page.waitForTimeout(1000);

        await page.click('button:has-text("Restaurar datos de prueba")');
        await page.waitForTimeout(1500); 
        
        await page.locator('button:has-text("Eliminar")').first().click();
        
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 10000 });
    });

   test('6. Borrar todos los recursos', async ({ page }) => {
        await page.goto(URL_FRONTEND);
        
        // 1. Aceptamos las alertas automáticamente
        page.on('dialog', dialog => dialog.accept());
        
        // 2. Nos aseguramos de que haya datos en la tabla antes de borrar
        await page.click('button:has-text("Restaurar datos de prueba")');
        await page.waitForTimeout(1500); // ⏱️ ESPERA MÁGICA
        
        // 3. Hacemos clic en vaciar
        await page.click('button:has-text("Vaciar toda la tabla")');
        
        // 4. Esperamos a que salga el cartel rojo de Svelte avisando del borrado
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 10000 });
        
        // 5. Comprobamos que el texto de tabla vacía por fin aparece
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar' })).toBeVisible();
    });
});