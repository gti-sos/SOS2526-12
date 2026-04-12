<script>
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { dev } from "$app/environment";

    // 1. Obtenemos las claves primarias de la URL (No se pueden modificar)
    const urlCountry = $page.params.country_name;
    const urlYear = $page.params.year;
    const urlSex = $page.params.sex;

    // 2. Variables de estado individuales (Misma estructura que tu +page.svelte principal)
    let editCountryCode = $state("");
    let editMaxAge = $state("");
    let editPop0 = $state("");
    let editPop25 = $state("");
    let editPop50 = $state("");
    let editPop75 = $state("");
    let editPop100 = $state("");

    // Variable para saber si ya hemos recibido la respuesta del backend
    let datosCargados = $state(false);

    let API = `/api/v2/mid-population-ages/${urlCountry}/${urlYear}/${urlSex}`;
    if (dev) {
        API = "http://localhost:3000" + API;
    }

    // --- SISTEMA DE MENSAJES MULTICOLOR ---
    let mensajeTexto = $state("");
    let mensajeTipo = $state("");

    // @ts-ignore
    function mostrarMensaje(texto, tipo = "exito") {
        mensajeTexto = texto;
        mensajeTipo = tipo;
        setTimeout(() => { mensajeTexto = ""; }, 4000);
    }
    // --------------------------------------------

    async function getRecord() {
        const res = await fetch(API, { method: "GET" });
        if (res.ok) {
            const data = await res.json();
            
            // Rellenamos las variables de estado con los datos que llegaron
            editCountryCode = data.country_code;
            editMaxAge = data.max_age;
            editPop0 = data.population_age_0;
            editPop25 = data.population_age_25;
            editPop50 = data.population_age_50;
            editPop75 = data.population_age_75;
            editPop100 = data.population_age_100;
            
            datosCargados = true;
        } else if (res.status === 404) {
            mostrarMensaje(`❌ No se encontró el registro de ${urlCountry} (${urlYear}).`, "error");
        } else {
            mostrarMensaje("❌ Tuvimos un problema al intentar cargar los datos.", "error");
        }
    }

    async function updatePopulation() {
        // Construimos el objeto justo antes de enviarlo
        const updatedResource = {
            country_code: editCountryCode,
            country_name: urlCountry, // Se saca de la URL
            // @ts-ignore
            year: parseInt(urlYear),  // Se saca de la URL
            sex: urlSex,              // Se saca de la URL
            max_age: parseInt(editMaxAge),
            population_age_0: parseInt(editPop0),
            population_age_25: parseInt(editPop25),
            population_age_50: parseInt(editPop50),
            population_age_75: parseInt(editPop75),
            population_age_100: parseInt(editPop100)
        };

        const res = await fetch(API, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedResource)
        });

        if (res.ok) {
            // Usamos un alert nativo para que lea el mensaje antes de que la página cambie rápidamente
            alert("✅ Los cambios se han guardado correctamente."); 
            goto("/mid-population-ages"); // Redirige a la tabla principal
        } 
        else if (res.status === 400) {
            mostrarMensaje("❌ Faltan datos: Asegúrate de que las poblaciones sean números correctos.", "error");
        } 
        else {
            mostrarMensaje("❌ Ha ocurrido un error inesperado al intentar guardar los datos.", "error");
        }
    }

    function cancelar() {
        goto("/mid-population-ages"); // Vuelve a la tabla sin guardar
    }

    $effect(() => {
        getRecord();
    });
</script>

<style>
    /* Estilos idénticos a los de tu archivo principal */
    main { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 700px; margin: auto; }
    
    .mensaje-alerta {
        padding: 15px;
        margin-bottom: 20px;
        border-radius: 8px;
        font-weight: bold;
        text-align: center;
        animation: aparecer 0.3s ease-in-out;
    }
    
    .mensaje-exito { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }      
    .mensaje-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }      
    
    @keyframes aparecer {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .form-container { background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #ddd; display: flex; flex-direction: column; gap: 12px;}
    .form-row { display: flex; justify-content: space-between; align-items: center; }
    .form-row label { font-weight: bold; color: #444; width: 40%; }
    input { padding: 8px; width: 55%; border: 1px solid #ccc; border-radius: 4px; }
    input:disabled { background-color: #e9ecef; color: #6c757d; cursor: not-allowed; border: 1px solid #ced4da; }
    
    button { padding: 10px 15px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; transition: background-color 0.2s; }
    .btn-primary { background: #007bff; color: white; }
    .btn-primary:hover { background: #0056b3; }
    .btn-secondary { background: #6c757d; color: white; }
    .btn-secondary:hover { background: #5a6268; }
    .actions-header { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;}
</style>

<main>
    <h1>✏️ Editar Registro</h1>

    {#if mensajeTexto !== ""}
        <div class="mensaje-alerta mensaje-{mensajeTipo}">
            {mensajeTexto}
        </div>
    {/if}

    {#if !datosCargados}
        <div class="form-container" style="text-align: center; color: #666;">
            ⏳ Cargando datos del registro...
        </div>
    {:else}
        <div class="form-container">
            <div class="form-row">
                <label>País (Fijo):</label>
                <input type="text" value={urlCountry} disabled />
            </div>
            <div class="form-row">
                <label>Año (Fijo):</label>
                <input type="text" value={urlYear} disabled />
            </div>
            <div class="form-row">
                <label>Sexo (Fijo):</label>
                <input type="text" value={urlSex === 'Male' ? 'Hombre' : 'Mujer'} disabled />
            </div>

            <div class="form-row">
                <label>Código de País:</label>
                <input type="text" bind:value={editCountryCode} />
            </div>
            <div class="form-row">
                <label>Edad Máxima:</label>
                <input type="number" bind:value={editMaxAge} />
            </div>
            <div class="form-row">
                <label>Población 0 años:</label>
                <input type="number" bind:value={editPop0} />
            </div>
            <div class="form-row">
                <label>Población 25 años:</label>
                <input type="number" bind:value={editPop25} />
            </div>
            <div class="form-row">
                <label>Población 50 años:</label>
                <input type="number" bind:value={editPop50} />
            </div>
            <div class="form-row">
                <label>Población 75 años:</label>
                <input type="number" bind:value={editPop75} />
            </div>
            <div class="form-row">
                <label>Población 100 años:</label>
                <input type="number" bind:value={editPop100} />
            </div>

            <div class="actions-header">
                <button class="btn-secondary" onclick={cancelar}>❌ Cancelar y Volver</button>
                <button class="btn-primary" onclick={updatePopulation}>💾 Guardar Cambios</button>
            </div>
        </div>
    {/if}
</main>