import { test, expect } from "@playwright/test";

const URL = "https://sos2526-12.onrender.com/birth-death-growth-rates";

test.describe("Pruebas E2E - Tasas de Natalidad, Mortalidad y Crecimiento", () => {
  test.describe.configure({ mode: "serial" });
  test.slow();

  const codigoUnico = "ZZ";
  const paisUnico = "PaisTest_" + Date.now().toString().slice(-4);
  const anioUnico = "2030";

  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto(URL);
    await expect(
      page.locator("h1", { hasText: "Tasas de Natalidad" }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("1. Restaurar datos y listar recursos", async ({ page }) => {
    await page.getByRole("button", { name: /Eliminar todos/i }).click();
    await expect(page.locator(".aviso.borrado")).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: /Restaurar/i }).click();
    await expect(page.locator(".aviso.ok")).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator("td", { hasText: "No hay registros" }),
    ).not.toBeVisible();
  });

  test("2. Crear un recurso nuevo", async ({ page }) => {
    
    await page.getByPlaceholder("Código (ej. ES) *").fill(codigoUnico);
    await page.getByPlaceholder("País (ej. España) *").fill(paisUnico);
    await page.getByPlaceholder("Año (ej. 2022) *").fill(anioUnico);
    await page.getByRole("button", { name: /Añadir registro/i }).click();

    await expect(page.locator(".aviso.nuevo")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("table")).toContainText(paisUnico);
  });

  test("3. Buscar recursos", async ({ page }) => {
    await page.getByPlaceholder("Buscar por país").fill(paisUnico);
    await page.getByRole("button", { name: /Buscar/i }).click();

    await expect(page.locator("table")).toContainText(paisUnico);

    await page.getByRole("button", { name: /Limpiar/i }).click();
  });

  test("4. Editar un recurso", async ({ page }) => {
    const fila = page.locator("tr").filter({ hasText: paisUnico });
    await fila.getByRole("link", { name: /Editar/i }).click();

    await expect(page).toHaveURL(
      new RegExp(`/birth-death-growth-rates/${codigoUnico}/${anioUnico}`),
    );
    await expect(
      page.locator("h1", { hasText: "Editar registro" }),
    ).toBeVisible({ timeout: 15000 });

    await page
      .locator("input:not([disabled])")
      .first()
      .fill(paisUnico + " Editado");

    await page.getByRole("button", { name: /Guardar cambios/i }).click();

    await expect(page).toHaveURL(new RegExp("/birth-death-growth-rates$"), {
      timeout: 10000,
    });
  });

  test("5. Borrar un recurso concreto", async ({ page }) => {
    const fila = page.locator("tr").filter({ hasText: paisUnico });
    await fila.getByRole("button", { name: /Eliminar/i }).click();

    await expect(page.locator(".aviso.borrado")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator("table")).not.toContainText(paisUnico);
  });

  test("6. Borrar todos los recursos", async ({ page }) => {
    await page.getByRole("button", { name: /Restaurar/i }).click();
    await expect(page.locator(".aviso.ok")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /Eliminar todos/i }).click();
    await expect(page.locator(".aviso.borrado")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.locator("td", { hasText: "No hay registros" }),
    ).toBeVisible();
  });
});
