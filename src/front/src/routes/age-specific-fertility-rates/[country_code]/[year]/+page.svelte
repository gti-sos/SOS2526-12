<script>
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { dev } from "$app/environment";

    // 1. Sacamos los parámetros de la URL gracias a las carpetas con corchetes []
    let country_code = $page.params.country_code;
    let year = $page.params.year;

    // 2. Variables de estado (Runas de Svelte 5)
    let country_name = $state("");
    let fert_15_19 = $state("");
    let fert_20_24 = $state("");
    
    let mensajeTexto = $state("");
    let mensajeTipo = $state("");

    let API = '/api/v2/age-specific-fertility-rates';
    if (dev) {
        API = "http://localhost:3000" + API;
    }

    // 3. Función para cargar los datos actuales (GET específico)
    async function getRecurso() {
        const res = await fetch(`${API}/${country_code}/${year}`);
        if (res.ok) {
            const data = await res.json();
            // Rellenamos el formulario con los datos de la base de datos
            country_name = data.country_name;
            fert_15_19 = data.fert_15_19;
            fert_20_24 = data.fert_20_24;
        } else {
            mensajeTexto = "Error al cargar los datos del recurso.";
            mensajeTipo = "error";
        }
    }

    // 4. Función para guardar los cambios (PUT)
    async function updateRecurso() {
        // --- NUEVA VALIDACIÓN: Comprobar que no hay campos vacíos ---
        if (!country_name || fert_15_19 === "" || fert_15_19 === null || fert_20_24 === "" || fert_20_24 === null) {
            mensajeTexto = "No puedes dejar ningún campo en blanco.";
            mensajeTipo = "error";
            return; // Corta la función aquí y no envía la petición al servidor
        }

        const updatedRecord = {
            country_code: country_code, // La clave principal no se cambia
            country_name: country_name,
            // @ts-ignore
            year: parseInt(year),       // La clave principal no se cambia
            fert_15_19: parseFloat(fert_15_19),
            fert_20_24: parseFloat(fert_20_24)
        };

        const res = await fetch(`${API}/${country_code}/${year}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedRecord)
        });

        if (res.ok) {
            alert("Recurso actualizado con éxito");
            // El usuario no tiene que darle a atrás, lo mandamos nosotros automáticamente:
            goto("/age-specific-fertility-rates");
        } else if (res.status === 400) {
            mensajeTexto = "Faltan datos o el formato es incorrecto.";
            mensajeTipo = "error";
        } else {
            mensajeTexto = "Error inesperado al actualizar.";
            mensajeTipo = "error";
        }
    }

    // Se ejecuta al cargar la página
    $effect(() => {
        getRecurso();
    });
</script>

<style>
    main { font-family: 'Segoe UI', sans-serif; padding: 20px; max-width: 600px; margin: auto; }
    .form-container { background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #ddd; display: flex; flex-direction: column; gap: 15px;}
    .input-group { display: flex; flex-direction: column; }
    label { font-weight: bold; margin-bottom: 5px; color: #333; }
    input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
    input:disabled { background-color: #e9ecef; cursor: not-allowed; }
    .btn-primary { background: #007bff; color: white; padding: 12px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
    .btn-primary:hover { background: #0056b3; }
    .btn-secondary { background: #6c757d; color: white; padding: 12px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; text-align: center; text-decoration: none; margin-top: 10px; }
    .btn-secondary:hover { background: #5a6268; }
    .mensaje-error { padding: 15px; background-color: #f8d7da; color: #721c24; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: bold; }
</style>

<main>
    <h1>Editar Recurso</h1>
    
    {#if mensajeTexto !== ""}
        <div class="mensaje-error">{mensajeTexto}</div>
    {/if}

    <div class="form-container">
        <div class="input-group">
            <label>Código de País</label>
            <input type="text" value={country_code} disabled />
        </div>

        <div class="input-group">
            <label>Año</label>
            <input type="number" value={year} disabled />
        </div>

        <div class="input-group">
            <label>Nombre del País</label>
            <input type="text" bind:value={country_name} />
        </div>

        <div class="input-group">
            <label>Tasa (15 a 19 años)</label>
            <input type="number" bind:value={fert_15_19} step="0.1" />
        </div>

        <div class="input-group">
            <label>Tasa (20 a 24 años)</label>
            <input type="number" bind:value={fert_20_24} step="0.1" />
        </div>

        <button class="btn-primary" onclick={updateRecurso}>Guardar Cambios</button>
        <button class="btn-secondary" onclick={() => goto('/age-specific-fertility-rates')}>Cancelar y Volver</button>
    </div>
</main>