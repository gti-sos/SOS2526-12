import { test, expect } from '@playwright/test';

// Recuerda cambiar esto por tu URL pública de Render/Vercel cuando vayas a subirlo a GitHub
const URL_FRONTEND = 'https://sos2526-12.onrender.com/mid-population-ages';

test.describe('Pruebas E2E - Frontend Gestión de Población', () => {

    test('1. Listar recursos', async ({ page }) => {
        await page.goto(URL_FRONTEND);
        await expect(page.locator('h1', { hasText: 'Tasas de Edades de Población' })).toBeVisible();
        await expect(page.locator('table')).toBeVisible();
    });

    test('2. Crear un recurso', async ({ page }) => {
        await page.goto(URL_FRONTEND);
        
        // Aceptamos cualquier alerta automáticamente
        page.on('dialog', dialog => dialog.accept());
        
        // Vaciamos la tabla primero y esperamos 1 segundo para que el backend borre seguro
        await page.click('button:has-text("Vaciar toda la tabla")');
        await page.waitForTimeout(1000); 
        
        // Rellenamos el formulario
        await page.fill('input[placeholder="Cód. País"]', 'TEST');
        await page.fill('input[placeholder="País"]', 'PaisPrueba');
        await page.fill('input[placeholder="Año"]', '2025');
        await page.locator('select').selectOption({ index: 1 });
        await page.fill('input[placeholder="Edad Máx"]', '100');
        await page.fill('input[placeholder="Pob. 0"]', '10');
        await page.fill('input[placeholder="Pob. 25"]', '20');
        await page.fill('input[placeholder="Pob. 50"]', '30');
        await page.fill('input[placeholder="Pob. 75"]', '40');
        await page.fill('input[placeholder="Pob. 100"]', '50');

        await page.click('button:has-text("Añadir a la lista")');

        await expect(page.locator('.mensaje-creacion')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('td', { hasText: 'PaisPrueba' }).first()).toBeVisible();
    });

    test('3. Buscar recursos', async ({ page }) => {
        await page.goto(URL_FRONTEND);
        page.on('dialog', dialog => dialog.accept());

        await page.click('button:has-text("Vaciar toda la tabla")');
        await page.waitForTimeout(1000); 
        
        await page.click('button:has-text("Restaurar datos de prueba")');
        await page.waitForTimeout(1500); 
        
        await page.fill('input[placeholder="Buscar por País..."]', 'Afghanistan');
        await page.click('button:has-text("Buscar Registros")');
        
        await expect(page.locator('td', { hasText: 'Afghanistan' }).first()).toBeVisible();
    });

    test('4. Editar recurso (Vista separada)', async ({ page }) => {
        await page.goto(URL_FRONTEND);
        
        // 1. Simplemente nos aseguramos de que haya datos (sin vaciar antes)
        await page.click('button:has-text("Restaurar datos de prueba")');
        
        // 2. Esperamos pacientemente a que la tabla dibuje al menos una fila
        await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(500); // Un respiro para que todo cargue bien
        
        // 3. Hacemos clic en el PRIMER botón de editar
        await page.locator('a:has-text("Editar")').first().click();
        
        // 4. Comprobamos que estamos en la vista de edición
        await expect(page).toHaveURL(/.*mid-population-ages\/.*/);
        await expect(page.locator('h1', { hasText: 'Editar Registro' })).toBeVisible();
        
        // 5. Como ahora sí cargará el formulario, el botón existirá y podremos hacer clic
        await page.click('button:has-text("Cancelar y Volver")');
        await expect(page.locator('h1', { hasText: 'Tasas de Edades de Población' })).toBeVisible();
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