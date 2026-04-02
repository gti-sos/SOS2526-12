<script>
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { dev } from "$app/environment";

    const urlCountryCode = $page.params.country_code;
    const urlYear = $page.params.year;

    let editCountryName = $state("");
    let editRate1519 = $state("");
    let editRate2024 = $state("");

    let datosCargados = $state(false);

    let API = `/api/v2/age-specific-fertility-rates/${urlCountryCode}/${urlYear}`;
    if (dev) {
        API = "http://localhost:3000" + API;
    }

    let mensajeTexto = $state("");
    let mensajeTipo = $state("");

    // @ts-ignore
    function mostrarMensaje(texto, tipo = "exito") {
        mensajeTexto = texto;
        mensajeTipo = tipo;
        setTimeout(() => { mensajeTexto = ""; }, 4000);
    }

    async function getRecord() {
        const res = await fetch(API, { method: "GET" });
        if (res.ok) {
            const data = await res.json();
            editCountryName = data.country_name;
            editRate1519 = data.fertility_rate_15_19;
            editRate2024 = data.fertility_rate_20_24;
            datosCargados = true;
        } else if (res.status === 404) {
            mostrarMensaje(`No se encontro el registro de ${urlCountryCode} (${urlYear}).`, "error");
        } else {
            mostrarMensaje("Problema al cargar los datos.", "error");
        }
    }

    async function updateFertility() {
        const updatedResource = {
            country_code: urlCountryCode,
            country_name: editCountryName,
            // @ts-ignore
            year: parseInt(urlYear),
            fertility_rate_15_19: parseFloat(editRate1519),
            fertility_rate_20_24: parseFloat(editRate2024)
        };

        const res = await fetch(API, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedResource)
        });

        if (res.ok) {
            alert("Los cambios se han guardado correctamente."); 
            goto("/age-specific-fertility-rates"); 
        } 
        else if (res.status === 400) {
            mostrarMensaje("Faltan datos o el formato es incorrecto.", "error");
        } 
        else {
            mostrarMensaje("Error inesperado al guardar.", "error");
        }
    }

    function cancelar() {
        goto("/age-specific-fertility-rates");
    }

    $effect(() => {
        getRecord();
    });
</script>

<style>
    main { font-family: sans-serif; padding: 20px; max-width: 700px; margin: auto; }
    .mensaje-alerta { padding: 15px; margin-bottom: 20px; border-radius: 8px; font-weight: bold; text-align: center; }
    .mensaje-exito { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }      
    .mensaje-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }      
    .form-container { background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #ddd; display: flex; flex-direction: column; gap: 12px;}
    .form-row { display: flex; justify-content: space-between; align-items: center; }
    .form-row label { font-weight: bold; color: #444; width: 40%; }
    input { padding: 8px; width: 55%; border: 1px solid #ccc; border-radius: 4px; }
    input:disabled { background-color: #e9ecef; color: #6c757d; }
    button { padding: 10px 15px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; }
    .btn-primary { background: #007bff; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
    .actions-header { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;}
</style>

<main>
    <h1>Editar Registro</h1>

    {#if mensajeTexto !== ""}
        <div class="mensaje-alerta mensaje-{mensajeTipo}">
            {mensajeTexto}
        </div>
    {/if}

    {#if !datosCargados}
        <div class="form-container" style="text-align: center; color: #666;">
            Cargando datos...
        </div>
    {:else}
        <div class="form-container">
            <div class="form-row">
                <label>Codigo (Fijo):</label>
                <input type="text" value={urlCountryCode} disabled />
            </div>
            <div class="form-row">
                <label>Anio (Fijo):</label>
                <input type="text" value={urlYear} disabled />
            </div>
            <div class="form-row">
                <label>Pais:</label>
                <input type="text" bind:value={editCountryName} />
            </div>
            <div class="form-row">
                <label>Tasa 15-19:</label>
                <input type="number" step="0.1" bind:value={editRate1519} />
            </div>
            <div class="form-row">
                <label>Tasa 20-24:</label>
                <input type="number" step="0.1" bind:value={editRate2024} />
            </div>
            <div class="actions-header">
                <button class="btn-secondary" onclick={cancelar}>Cancelar y Volver</button>
                <button class="btn-primary" onclick={updateFertility}>Guardar Cambios</button>
            </div>
        </div>
    {/if}
</main>