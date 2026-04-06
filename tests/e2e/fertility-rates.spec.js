import { test, expect } from '@playwright/test';

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
        
        // Esperamos a que la URL cambie
        await expect(page).toHaveURL(new RegExp(`/age-specific-fertility-rates/${codigoUnico}/${anioUnico}`), { timeout: 10000 });

        // --- SOLUCIÓN AL PROBLEMA DE CARGA ---
        // Esperamos a que el input del nombre ya tenga el valor (eso significa que el GET ha terminado)
        const inputNombre = page.locator('input').nth(2); // El nombre del país
        await expect(inputNombre).toHaveValue(paisUnico, { timeout: 10000 });

        // 2. Ahora sí, modificamos la tasa con seguridad
        const inputTasa = page.locator('input').nth(3);
        await inputTasa.fill('9.9');
        
        // 3. Preparamos la espera de la respuesta del servidor (PUT)
        // Usamos .ok() para aceptar cualquier código 200, 201, 204...
        const putPromise = page.waitForResponse(res => 
            res.request().method() === 'PUT' && res.ok()
        );
        
        // 4. Guardamos los cambios
        await page.getByRole('button', { name: 'Guardar Cambios' }).click();
        
        // Esperamos a que el servidor responda
        await putPromise;

        // 5. El alert se acepta solo gracias al beforeEach, y el goto nos lleva atrás.
        // Esperamos a ver el H1 de la página principal para saber que hemos vuelto
        await expect(page.locator('h1')).toContainText('Tasas de Fertilidad por Paises', { timeout: 15000 });

        // 6. Opcional: Si tu backend es lento, forzamos un reload o esperamos a la tabla
        await page.waitForTimeout(1000); 

        // 7. Comprobamos que el 9.9 aparece en la fila de nuestro país
        const filaFinal = page.locator('tr').filter({ hasText: paisUnico });
        await expect(filaFinal).toContainText('9.9', { timeout: 15000 });
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
});