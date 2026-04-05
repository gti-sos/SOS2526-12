import { test, expect } from '@playwright/test';

// Cambia esta URL si tu entorno de pruebas es localhost
const URL_FRONTEND = 'https://sos2526-12.onrender.com/age-specific-fertility-rates';

test.describe('Pruebas E2E - Gestion de Fertilidad', () => {

    // Ejecutar los tests en orden secuencial
    test.describe.configure({ mode: 'serial' });
    test.slow(); 

    // Datos únicos para evitar colisiones en la base de datos
    const codigoUnico = 'Z' + Date.now().toString().slice(-2);
    const paisUnico = 'PaisTest_' + Date.now().toString().slice(-4);
    const anioUnico = '2026';

    test.beforeEach(async ({ page }) => {
        // Aceptar automáticamente las alertas (confirmaciones de borrado)
        page.on('dialog', dialog => dialog.accept());
        
        // Esperar a que la página cargue los datos iniciales
        const getInicial = page.waitForResponse(res => 
            res.url().includes('/api/v2/age-specific-fertility-rates') && res.request().method() === 'GET'
        );
        await page.goto(URL_FRONTEND);
        await getInicial; 

        // Verificar que estamos en la página correcta (ignora emojis y mayúsculas/minúsculas)
        await expect(page.getByRole('heading', { name: /Tasas de Fertilidad por Países/i })).toBeVisible({ timeout: 15000 });
    });

    test('1. Restaurar datos y listar recursos', async ({ page }) => {
        // Primero vaciamos para asegurar que el botón restaurar hace efecto
        const deletePromise = page.waitForResponse(res => res.request().method() === 'DELETE');
        await page.getByRole('button', { name: /Vaciar tabla/i }).click();
        await deletePromise;

        // Restauramos datos
        const loadPromise = page.waitForResponse(res => res.url().includes('loadInitialData'));
        await page.getByRole('button', { name: /Restaurar datos/i }).click();
        await loadPromise;

        // Comprobamos que sale el mensaje de éxito y desaparece el texto de tabla vacía
        await expect(page.locator('.mensaje-exito')).toBeVisible({ timeout: 15000 }); 
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar.' })).not.toBeVisible();
    });

    test('2. Crear un recurso nuevo', async ({ page }) => {
        // Rellenar el formulario de creación usando los placeholders exactos
        await page.getByPlaceholder('Código (ej. ES)').fill(codigoUnico);
        await page.getByPlaceholder('País (ej. España)').fill(paisUnico);
        await page.getByPlaceholder('Año (ej. 2022)').fill(anioUnico);
        await page.getByPlaceholder('Tasa 15-19').fill('1.5');
        await page.getByPlaceholder('Tasa 20-24').fill('2.5');

        // Hacer clic en añadir
        await page.getByRole('button', { name: /Añadir/i, exact: true }).click();
        
        // Comprobar mensaje de creación y que el país aparece en la tabla
        await expect(page.locator('.mensaje-creacion')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('table')).toContainText(paisUnico);
    });

    test('3. Buscar recursos por país', async ({ page }) => {
        // Rellenar el buscador
        await page.getByPlaceholder('País (ej. Spain)').fill(paisUnico);
        
        // Ejecutar búsqueda
        await page.getByRole('button', { name: /Buscar/i, exact: true }).click();
        
        // Verificar que la tabla muestra nuestro país y la tabla no está vacía
        await expect(page.locator('table')).toContainText(paisUnico);
        
        // Limpiar búsqueda
        await page.getByRole('button', { name: /Limpiar/i }).click();
    });

    test('4. Navegar a la vista de edición', async ({ page }) => {
        // Buscar la fila del registro creado
        const fila = page.locator('tr').filter({ hasText: paisUnico });
        
        // Hacer clic en el enlace (el nombre del país)
        await fila.getByRole('link', { name: new RegExp(paisUnico, 'i') }).click();
        
        // Esperamos que la URL cambie a la ruta dinámica de edición
        await expect(page).toHaveURL(new RegExp(`/age-specific-fertility-rates/${codigoUnico}/${anioUnico}`));
    });

    test('5. Borrar un recurso concreto', async ({ page }) => {
        // Buscar la fila del registro
        const fila = page.locator('tr').filter({ hasText: paisUnico });
        
        // Hacer clic en el botón de eliminar de esa fila
        await fila.getByRole('button', { name: /Eliminar/i }).click();
        
        // Verificar mensaje de borrado
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        
        // Asegurar que el país ya no está en la tabla
        await expect(page.locator('table')).not.toContainText(paisUnico);
    });

    test('6. Vaciar toda la tabla', async ({ page }) => {
        // Hacer clic en vaciar tabla
        await page.getByRole('button', { name: /Vaciar tabla/i }).click();
        
        // Verificar mensaje de borrado general
        await expect(page.locator('.mensaje-borrado')).toBeVisible({ timeout: 15000 });
        
        // Verificar que aparece el texto de tabla vacía
        await expect(page.locator('td', { hasText: 'No hay datos para mostrar.' })).toBeVisible();
    });
});