import { test, expect } from '@playwright/test';

const URL_FRONTEND = 'https://sos2526-12.onrender.com/age-specific-fertility-rates';

test.describe('Pruebas E2E - Gestion de Fertilidad', () => {

    test.describe.configure({ mode: 'serial' });
    test.slow(); 

    // Generamos datos únicos para que no haya conflictos en la base de datos
    const codigoUnico = 'Z' + Date.now().toString().slice(-2);
    const paisUnico = 'PaisTest_' + Date.now().toString().slice(-4);
    const anioUnico = '2026';

    test.beforeEach(async ({ page }) => {
        // Esto le da a "Aceptar" automáticamente a las ventanitas de confirmación nativas
        page.on('dialog', dialog => dialog.accept());
        
        const getInicial = page.waitForResponse(res => 
            res.url().includes('/api/v2/age-specific-fertility-rates') && res.request().method() === 'GET'
        );
        await page.goto(URL_FRONTEND);
        await getInicial; 

        // Verificamos que estamos en la página correcta
        await expect(page.getByRole('heading', { name: /Tasas de Fertilidad por Paises/i })).toBeVisible({ timeout: 15000 });
    });

    test('1. Restaurar datos y listar recursos', async ({ page }) => {
        // Vaciamos primero para que el botón de restaurar siempre haga efecto
        const deletePromise = page.waitForResponse(res => res.request().method() === 'DELETE');
        await page.getByRole('button', { name: /^Vaciar tabla$/i }).click();
        await deletePromise;

        // Restauramos los datos
        const loadPromise = page.waitForResponse(res => res.url().includes('loadInitialData'));
        await page.getByRole('button', { name: /^Restaurar datos$/i }).click();
        await loadPromise;

        // Verificamos el cartel de éxito verde
        await expect(page.locator('.mensaje-exito')).toBeVisible({ timeout: 15000 }); 
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar.' })).not.toBeVisible();
    });

    test('2. Crear un recurso nuevo', async ({ page }) => {
        // Usamos los textos exactos sin tildes ni eñes que pusiste en Svelte
        await page.getByPlaceholder('Codigo (ej. ES)').fill(codigoUnico);
        await page.getByPlaceholder('Pais (ej. Espana)').fill(paisUnico);
        await page.getByPlaceholder('Ano (ej. 2022)').fill(anioUnico);
        await page.getByPlaceholder('Tasa 15-19').fill('1.5');
        await page.getByPlaceholder('Tasa 20-24').fill('2.5');

        await page.getByRole('button', { name: /^Anadir$/i, exact: true }).click();
        
        // Verificamos el cartelito azul de creación y que aparece en la tabla
        await expect(page.locator('.mensaje-creacion')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('table')).toContainText(paisUnico);
    });

    test('3. Buscar recursos por pais', async ({ page }) => {
        await page.getByPlaceholder('Pais (ej. Spain)').fill(paisUnico);
        
        await page.getByRole('button', { name: /^Buscar$/i, exact: true }).click();
        
        await expect(page.locator('table')).toContainText(paisUnico);
        
        // Limpiamos el buscador al terminar
        await page.getByRole('button', { name: /^Limpiar$/i }).click();
    });

    test('4. Navegar a la vista de edicion', async ({ page }) => {
        // Buscamos exactamente la fila de nuestro país inventado
        const fila = page.locator('tr').filter({ hasText: paisUnico });
        
        // Hacemos clic en el enlace amarillo de "Editar" de esa fila
        await fila.getByRole('link', { name: /^Editar$/i }).click();
        
        // Verificamos que la URL ha cambiado a la ruta de edición correcta
        await expect(page).toHaveURL(new RegExp(`/age-specific-fertility-rates/${codigoUnico}/${anioUnico}`));
    });

    test('5. Borrar un recurso concreto', async ({ page }) => {
        // Buscamos la fila de nuestro país
        const fila = page.locator('tr').filter({ hasText: paisUnico });
        
        // Hacemos clic en su botón de eliminar
        await fila.getByRole('button', { name: /^Eliminar$/i }).click();
        
        // Verificamos el cartelito rojo de borrado
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('table')).not.toContainText(paisUnico);
    });

    test('6. Vaciar toda la tabla', async ({ page }) => {
        const deletePromise = page.waitForResponse(res => res.request().method() === 'DELETE');
        await page.getByRole('button', { name: /^Vaciar tabla$/i }).click();
        await deletePromise;
        
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar.' })).toBeVisible();
    });
});