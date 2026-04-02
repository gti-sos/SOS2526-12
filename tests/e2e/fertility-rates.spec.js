import { test, expect } from '@playwright/test';

const URL_FRONTEND = 'https://sos2526-12.onrender.com/age-specific-fertility-rates';

test.describe('Pruebas E2E - Gestion de Fertilidad', () => {

    test.describe.configure({ mode: 'serial' });
    test.slow(); 

    const codigoPaisUnico = 'Z' + Date.now().toString().slice(-2);
    const anioUnico = '2050';

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        
        const getInicial = page.waitForResponse(res => 
            res.url().includes('/api/v2/age-specific-fertility-rates') && res.request().method() === 'GET'
        );
        await page.goto(URL_FRONTEND);
        await getInicial; 

        await expect(page.getByRole('heading', { name: /Tasas de Fertilidad/i, level: 1 })).toBeVisible({ timeout: 15000 });
    });

    test('1. Listar recursos', async ({ page }) => {
        const deletePromise = page.waitForResponse(res => res.request().method() === 'DELETE');
        await page.locator('button', { hasText: /Vaciar tabla/i }).click();
        await deletePromise;

        const loadPromise = page.waitForResponse(res => res.url().includes('loadInitialData'));
        await page.locator('button', { hasText: /Restaurar datos/i }).click();
        await loadPromise;

        await expect(page.locator('.mensaje-exito')).toBeVisible({ timeout: 60000 }); 
        await expect(page.locator('td', { hasText: /No hay datos para mostrar/i })).not.toBeVisible();
    });

    test('2. Crear un recurso', async ({ page }) => {
        // Usamos expresiones regulares para ignorar tildes en Código y País
        await page.getByPlaceholder(/C.digo/i).fill(codigoPaisUnico);
        await page.getByPlaceholder(/Pa.s \(ej. Espa.a\)/i).fill('PaisPrueba'); 
        
        // Buscamos el contenedor de creación flexibilizando el texto (Añadir vs Anadir)
        const panelCreacion = page.locator('.form-container').filter({ hasText: /A.adir Nuevo Registro/i });
        await panelCreacion.getByPlaceholder(/A.o|Anio/i).fill(anioUnico);
        
        await page.getByPlaceholder(/Tasa 15-19/i).fill('1.5');
        await page.getByPlaceholder(/Tasa 20-24/i).fill('2.5');

        const postPromise = page.waitForResponse(res => res.request().method() === 'POST');
        await page.locator('button', { hasText: /^A.adir$/i }).click();
        await postPromise;

        await expect(page.locator('.mensaje-creacion')).toBeVisible();
        await expect(page.locator('table')).toContainText(codigoPaisUnico);
    });

    test('3. Buscar recursos', async ({ page }) => {
        await page.getByPlaceholder(/Pa.s \(ej. Spain\)/i).fill('PaisPrueba');
        
        const searchPromise = page.waitForResponse(res => res.request().method() === 'GET' && res.url().includes('country_name='));
        await page.locator('button', { hasText: /^Buscar$/i }).click();
        await searchPromise;

        await expect(page.locator('table')).toContainText(codigoPaisUnico);
    });

    test('4. Editar recurso (Vista separada)', async ({ page }) => {
        await page.getByPlaceholder(/Pa.s \(ej. Spain\)/i).fill('PaisPrueba');
        await page.locator('button', { hasText: /^Buscar$/i }).click();
        
        const fila = page.locator('tr', { hasText: codigoPaisUnico });
        await fila.locator('a', { hasText: /Editar/i }).click();
        
        await expect(page.getByRole('heading', { name: /Editar/i, level: 1 })).toBeVisible({ timeout: 15000 });
        
        const inputTasa = page.locator('input[placeholder*="15"], input[type="number"]').nth(1); 
        await inputTasa.fill('9.9');
        
        const savePromise = page.waitForResponse(res => 
            res.url().includes(codigoPaisUnico) && 
            (res.request().method() === 'PUT' || res.request().method() === 'POST')
        );
        await page.locator('button', { hasText: /Guardar/i }).click();
        await savePromise;
        
        await expect(page.getByRole('heading', { name: /Tasas de Fertilidad/i, level: 1 })).toBeVisible({ timeout: 15000 });
        await page.getByPlaceholder(/Pa.s \(ej. Spain\)/i).fill('PaisPrueba');
        await page.locator('button', { hasText: /^Buscar$/i }).click();
        await expect(page.locator('tr', { hasText: codigoPaisUnico })).toContainText('9.9');
    });

    test('5. Borrar un recurso concreto', async ({ page }) => {
        await page.getByPlaceholder(/Pa.s \(ej. Spain\)/i).fill('PaisPrueba');
        await page.locator('button', { hasText: /^Buscar$/i }).click();

        const fila = page.locator('tr', { hasText: codigoPaisUnico });
        const deleteOnePromise = page.waitForResponse(res => res.request().method() === 'DELETE');
        await fila.locator('button', { hasText: /Eliminar/i }).click();
        await deleteOnePromise;
        
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('table')).not.toContainText(codigoPaisUnico);
    });

    test('6. Borrar todos los recursos', async ({ page }) => {
        const loadPromise = page.waitForResponse(res => res.url().includes('loadInitialData'));
        await page.locator('button', { hasText: /Restaurar datos/i }).click();
        await loadPromise;

        const deleteAllPromise = page.waitForResponse(res => res.request().method() === 'DELETE');
        await page.locator('button', { hasText: /Vaciar tabla/i }).click();
        await deleteAllPromise;

        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('td', { hasText: /No hay datos para mostrar/i })).toBeVisible();
    });
});