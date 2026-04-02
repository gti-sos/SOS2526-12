import { test, expect } from '@playwright/test';

const URL_FRONTEND = 'https://sos2526-12.onrender.com/age-specific-fertility-rates';

test.describe('Pruebas E2E - Gestion de Fertilidad', () => {

    test.describe.configure({ mode: 'serial' });
    test.slow(); 

    // Generamos un código de 2 caracteres (ej. Z4) para que la base de datos lo acepte
    const codigoPaisUnico = 'Z' + Math.floor(Math.random() * 10).toString();
    const nombrePaisUnico = 'PaisPrueba';

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        
        const getInicial = page.waitForResponse(res => 
            res.url().includes('/api/v2/age-specific-fertility-rates') && res.request().method() === 'GET'
        );
        await page.goto(URL_FRONTEND);
        await getInicial; 

        await expect(page.locator('h1', { hasText: 'Tasas de Fertilidad por Paises' })).toBeVisible({ timeout: 15000 });
    });

    test('1. Listar recursos', async ({ page }) => {
        const deletePromise = page.waitForResponse(res => res.request().method() === 'DELETE');
        await page.click('button:has-text("Vaciar tabla")');
        await deletePromise;

        await page.click('button:has-text("Restaurar datos")');
        await expect(page.locator('.mensaje-exito')).toBeVisible({ timeout: 60000 }); 
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar' })).not.toBeVisible();
    });

    test('2. Crear un recurso', async ({ page }) => {
        // Limitamos la búsqueda al contenedor de creación porque hay dos inputs con el placeholder "Anio"
        const formCreacion = page.locator('.form-container', { hasText: 'Anadir Nuevo Registro' });

        await formCreacion.locator('input[placeholder="Codigo (ej. ES)"]').fill(codigoPaisUnico);
        await formCreacion.locator('input[placeholder="Pais (ej. Espana)"]').fill(nombrePaisUnico); 
        await formCreacion.locator('input[placeholder="Anio"]').fill('2050');
        await formCreacion.locator('input[placeholder="Tasa 15-19"]').fill('1.5');
        await formCreacion.locator('input[placeholder="Tasa 20-24"]').fill('2.5');

        await formCreacion.locator('button:has-text("Anadir")').click();
        await expect(page.locator('.mensaje-creacion')).toBeVisible({ timeout: 15000 });
    });

    test('3. Buscar recursos', async ({ page }) => {
        const formBuscador = page.locator('.form-container', { hasText: 'Buscador' });
        
        await formBuscador.locator('input[placeholder="Pais (ej. Spain)"]').fill(nombrePaisUnico);
        await formBuscador.locator('button:has-text("Buscar")').click();
        
        await expect(page.locator('table')).toContainText(codigoPaisUnico);
    });

    test('4. Editar recurso (Vista separada)', async ({ page }) => {
        const filaNueva = page.locator('tr', { hasText: codigoPaisUnico });
        await filaNueva.locator('a:has-text("Editar")').click();
        
        await expect(page.locator('h1', { hasText: 'Editar' })).toBeVisible({ timeout: 15000 });
        
        // Buscamos el input numérico de la tasa en la vista de edición
        const inputTasa = page.locator('input[type="number"]').first(); 
        await inputTasa.fill('9.9');
        
        await page.click('button:has-text("Guardar")');
        
        await expect(page.locator('h1', { hasText: 'Tasas de Fertilidad' })).toBeVisible({ timeout: 10000 });
        
        const filaEditada = page.locator('tr', { hasText: codigoPaisUnico });
        await expect(filaEditada).toContainText('9.9');
    });

    test('5. Borrar un recurso concreto', async ({ page }) => {
        const filaNueva = page.locator('tr', { hasText: codigoPaisUnico });
        await filaNueva.locator('button:has-text("Eliminar")').click();
        
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('table')).not.toContainText(codigoPaisUnico);
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