/*import { test, expect } from '@playwright/test';

const URL_FRONTEND = 'https://sos2526-12.onrender.com/age-specific-fertility-rates';

test.describe('Pruebas E2E - Gestion de Fertilidad', () => {

    test.describe.configure({ mode: 'serial' });
    test.slow();

    // Valores fijos — evitamos Date.now() como clave de busqueda
    const codigoUnico = 'ZZ';
    const paisUnico   = 'PaisTest';
    const anioUnico   = '2026';

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());

        await page.goto(URL_FRONTEND, { waitUntil: 'networkidle' });

        // El h1 del componente dice exactamente "Tasas de Fertilidad por Paises" (sin tilde)
        await expect(page.locator('h1')).toContainText('Tasas de Fertilidad por Paises', { timeout: 30000 });

        // Esperar a que la tabla este visible (datos cargados por onMount)
        await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
        await expect(page.getByPlaceholder('Pais (ej. Spain)')).toBeVisible({ timeout: 15000 });

    });

    // ── 1. LISTAR ──────────────────────────────────────────────────────────
    test('1. Restaurar datos y listar recursos', async ({ page }) => {
        // Vaciar primero
        await page.getByRole('button', { name: 'Vaciar tabla' }).click();
        await expect(
            page.locator('td', { hasText: 'No hay datos para mostrar.' })
        ).toBeVisible({ timeout: 15000 });

        // Restaurar y comprobar que la tabla tiene datos
        await page.getByRole('button', { name: 'Restaurar datos' }).click();
        await expect(
            page.locator('td', { hasText: 'No hay datos para mostrar.' })
        ).not.toBeVisible({ timeout: 60000 });

        await expect(page.locator('table tbody tr').first()).toBeVisible();
    });

    // ── 2. CREAR ───────────────────────────────────────────────────────────
    test('2. Crear un recurso nuevo', async ({ page }) => {
        // Si el registro ya existe de una ejecucion anterior, borrarlo
        await page.getByPlaceholder('Pais (ej. Spain)').fill(paisUnico);
        await page.getByRole('button', { name: 'Buscar' }).click();
        await page.waitForTimeout(1000);

        const filaExistente = page.locator('tr', { hasText: codigoUnico }).filter({ hasText: anioUnico });
        if (await filaExistente.count() > 0) {
            await filaExistente.getByRole('button', { name: 'Eliminar' }).click();
            await page.waitForTimeout(1000);
        }

        await page.getByRole('button', { name: 'Limpiar' }).click();
        await page.waitForTimeout(500);

        // Rellenar formulario — placeholders exactos del componente
        await page.getByPlaceholder('Codigo (ej. ES)').fill(codigoUnico);
        await page.getByPlaceholder('Pais (ej. Espana)').fill(paisUnico);
        await page.getByPlaceholder('Anio (ej. 2022)').fill(anioUnico);
        await page.getByPlaceholder('Tasa 15-19').fill('1.5');
        await page.getByPlaceholder('Tasa 20-24').fill('2.5');

        await page.getByRole('button', { name: 'Anadir' }).click();

        // Verificar que el nuevo registro aparece en la tabla
        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 15000 });
        await expect(page.locator('table')).toContainText(codigoUnico);
    });

    // ── 3. BUSCAR ──────────────────────────────────────────────────────────
    test('3. Buscar recursos por pais', async ({ page }) => {
        await page.getByPlaceholder('Pais (ej. Spain)').fill(paisUnico);
        await page.getByRole('button', { name: 'Buscar' }).click();
        await page.waitForTimeout(1500);

        await expect(page.locator('table')).toContainText(paisUnico, { timeout: 10000 });
        await expect(page.locator('table')).toContainText(anioUnico);

        // Limpiar vuelve a mostrar todos los datos
        await page.getByRole('button', { name: 'Limpiar' }).click();
        await page.waitForTimeout(1000);
        await expect(page.locator('table tbody tr').first()).toBeVisible();
    });

    // ── 3b. BUSCAR POR RANGO DE ANIOS ──────────────────────────────────────
    test('3b. Buscar recursos por rango de anios (desde/hasta)', async ({ page }) => {
        await page.getByPlaceholder('Desde anio').fill('2020');
        await page.getByPlaceholder('Hasta anio').fill('2030');
        await page.getByRole('button', { name: 'Buscar' }).click();
        await page.waitForTimeout(1500);

        // Debe aparecer nuestro registro de 2026
        await expect(page.locator('table')).toContainText(anioUnico, { timeout: 10000 });

        await page.getByRole('button', { name: 'Limpiar' }).click();
    });

test('4. Navegar a la vista de edicion y guardar cambios', async ({ page }) => {
        // 1. Buscamos nuestro pais y entramos a editar
        const fila = page.locator('tr').filter({ hasText: paisUnico });
        await fila.getByRole('link', { name: 'Editar' }).click();
        
        // Esperamos a que la URL cambie a la vista de edicion
        await expect(page).toHaveURL(new RegExp(`/age-specific-fertility-rates/${codigoUnico}/${anioUnico}`), { timeout: 10000 });

        // 2. Modificamos el valor: cogemos directamente el 4º input de la pagina (indice 3)
        await page.locator('input').nth(3).fill('9.9');
        
        // 3. Preparamos a Playwright para que espere al backend (evitamos el Race Condition)
        const putPromise = page.waitForResponse(res => res.request().method() === 'PUT' && res.status() === 200);
        
        // 4. Guardamos los cambios
        await page.getByRole('button', { name: 'Guardar Cambios' }).click();
        
        // Esperamos el OK del servidor
        await putPromise;

        // 5. Volvemos a la vista principal (la del Svelte que me acabas de pasar)
        await expect(page.locator('h1')).toContainText('Tasas de Fertilidad por Paises', { timeout: 10000 });

        // 6. Recargamos la pagina para asegurar que leemos los datos de la Base de Datos
        await page.reload({ waitUntil: 'networkidle' });

        // 7. Comprobamos que el 9.9 se ha guardado correctamente
        await expect(
            page.locator('tr').filter({ hasText: paisUnico })
        ).toContainText('9.9', { timeout: 15000 });
    });
    // ── 5. BORRAR UNO ──────────────────────────────────────────────────────
    test('5. Borrar un recurso concreto', async ({ page }) => {
        const fila = page.locator('tr').filter({ hasText: paisUnico });
        await expect(fila).toBeVisible({ timeout: 10000 });

        await fila.getByRole('button', { name: 'Eliminar' }).click();

        // El registro desaparece de la tabla
        await expect(page.locator('table')).not.toContainText(paisUnico, { timeout: 15000 });
    });

    // ── 6. BORRAR TODOS ────────────────────────────────────────────────────
    test('6. Vaciar toda la tabla', async ({ page }) => {
        // Restaurar para asegurarnos de que hay datos
        await page.getByRole('button', { name: 'Restaurar datos' }).click();
        await page.waitForTimeout(2000);

        await page.getByRole('button', { name: 'Vaciar tabla' }).click();

        await expect(
            page.locator('td', { hasText: 'No hay datos para mostrar.' })
        ).toBeVisible({ timeout: 15000 });
    });
});*/