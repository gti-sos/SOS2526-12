import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000/age-specific-fertility-rates';

test.describe('E2E Tests para la interfaz de Fertilidad', () => {

    test('1. Debería cargar la lista de datos inicial correctamente', async ({ page }) => {
        await page.goto(FRONTEND_URL);
        
        // Comprueba que hay una tabla en la pantalla
        const table = page.locator('table');
        await expect(table).toBeVisible();

        // Comprueba que al menos está la cabecera de la tabla
        const rows = page.locator('table thead tr');
        await expect(rows).not.toHaveCount(0);
    });

    test('2. Debería poder crear (insertar) un nuevo registro', async ({ page }) => {
        await page.goto(FRONTEND_URL);

        // ¡AJUSTADO! Ahora usa exactamente los placeholders de tu Svelte
        await page.fill('input[placeholder="Código (ej. ES)"]', 'ZZ');
        await page.fill('input[placeholder="País (ej. España)"]', 'PaisPrueba');
        await page.fill('input[placeholder="Año (ej. 2022)"]', '2050');
        await page.fill('input[placeholder="Tasa 15-19"]', '1.5');
        await page.fill('input[placeholder="Tasa 20-24"]', '2.5');
        
        // ¡AJUSTADO! Hace clic en tu botón exacto de añadir
        await page.click('button:has-text("Añadir")');

        // Espera a que la tabla contenga el nuevo país
        await expect(page.locator('table')).toContainText('PaisPrueba');
        // Y comprueba que el mensaje de éxito del Svelte aparece
        await expect(page.locator('.mensaje-creacion')).toBeVisible();
    });

    test('3. Debería buscar/filtrar usando "from" y "to"', async ({ page }) => {
        await page.goto(FRONTEND_URL);

        // ¡AJUSTADO! Usa tus placeholders de búsqueda
        await page.fill('input[placeholder="Desde año"]', '2020');
        await page.fill('input[placeholder="Hasta año"]', '2022');
        
        // ¡AJUSTADO! Hace clic en tu botón de buscar
        await page.click('button:has-text("Buscar")');

        // Como tu Svelte NO cambia la URL (solo hace el fetch con la query URLSearchParams internamente),
        // no podemos usar expect(page).toHaveURL(...).
        // En su lugar, comprobamos que no salga el mensaje de error de que no hay datos (asumiendo que en 2020-2022 sí hay).
        const mensajeError = page.locator('.mensaje-error');
        await expect(mensajeError).not.toBeVisible();
    });

    test('4. Debería poder eliminar un registro', async ({ page }) => {
        await page.goto(FRONTEND_URL);

        // Acepta el cuadro de diálogo de confirmación automáticamente (el "confirm" de tu deleteOne)
        page.on('dialog', dialog => dialog.accept());

        // Busca el botón de eliminar
        const deleteButtons = page.locator('button:has-text("🗑️ Eliminar")');
        
        if (await deleteButtons.count() > 0) {
            await deleteButtons.first().click();
            
            // Comprueba que sale tu mensaje de borrado
            await expect(page.locator('.mensaje-borrado')).toBeVisible();
        }
    });

    test('5. Debería poder borrar todos los registros', async ({ page }) => {
        await page.goto(FRONTEND_URL);

        // Acepta el cuadro de diálogo de confirmación (el "confirm" de tu deleteAll)
        page.on('dialog', dialog => dialog.accept());

        // Hace clic en tu botón exacto
        const deleteAllBtn = page.locator('button:has-text("🗑️ Vaciar tabla")');
        
        if (await deleteAllBtn.count() > 0) {
            await deleteAllBtn.click();
            
            // Comprueba que aparece el texto de tabla vacía que tienes en tu Svelte
            await expect(page.locator('text="No hay datos para mostrar."')).toBeVisible();
        }
    });

});