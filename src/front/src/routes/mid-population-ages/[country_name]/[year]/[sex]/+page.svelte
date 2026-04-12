<script>
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { dev } from "$app/environment";

    // 1. Obtenemos las claves primarias de la URL (No se pueden modificar)
    const urlCountry = $page.params.country_name;
    const urlYear = $page.params.year;
    const urlSex = $page.params.sex;

    // 2. Variables de estado individuales
    let editCountryCode = $state("");
    let editMaxAge = $state("");
    let editPop0 = $state("");
    let editPop25 = $state("");
    let editPop50 = $state("");
    let editPop75 = $state("");
    let editPop100 = $state("");

    // Variable para saber si ya hemos recibido la respuesta del backend
    let datosCargados = $state(false);

    let BASE = dev ? 'http://localhost:3000' : '';
    let API = `${BASE}/api/v2/mid-population-ages/${encodeURIComponent(urlCountry)}/${urlYear}/${urlSex}`;

    // --- SISTEMA DE MENSAJES MULTICOLOR ---
    let mensajeTexto = $state("");
    let mensajeTipo = $state("");

    function mostrarMensaje(texto, tipo = "exito") {
        mensajeTexto = texto;
        mensajeTipo = tipo;
        setTimeout(() => { mensajeTexto = ""; }, 4000);
    }

    function authHeaders() {
        const token = localStorage.getItem('jjg_jwt');
        return token ? { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
        } : { 'Content-Type': 'application/json' };
    }

    async function getRecord() {
        try {
            const res = await fetch(API);
            if (res.ok) {
                const data = await res.json();
                editCountryCode = data.country_code;
                editMaxAge = data.max_age;
                editPop0 = data.population_age_0;
                editPop25 = data.population_age_25;
                editPop50 = data.population_age_50;
                editPop75 = data.population_age_75;
                editPop100 = data.population_age_100;
                datosCargados = true;
            } else if (res.status === 404) {
                mostrarMensaje(`❌ No se encontró el registro.`, "error");
            } else {
                mostrarMensaje("❌ Error al cargar los datos.", "error");
            }
        } catch (e) {
            console.error(e);
            mostrarMensaje("❌ Error de conexión.", "error");
        }
    }

    async function updatePopulation() {
        const updatedResource = {
            country_code: editCountryCode,
            country_name: urlCountry,
            year: parseInt(urlYear),
            sex: urlSex,
            max_age: parseInt(editMaxAge),
            population_age_0: parseInt(editPop0) || 0,
            population_age_25: parseInt(editPop25) || 0,
            population_age_50: parseInt(editPop50) || 0,
            population_age_75: parseInt(editPop75) || 0,
            population_age_100: parseInt(editPop100) || 0
        };

        const res = await fetch(API, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(updatedResource)
        });

        if (res.ok) {
            alert("✅ Los cambios se han guardado correctamente."); 
            goto("/mid-population-ages");
        } 
        else if (res.status === 401) {
            mostrarMensaje("❌ No autorizado. Inicia sesión en la página principal.", "error");
        }
        else if (res.status === 400) {
            mostrarMensaje("❌ Datos inválidos.", "error");
        } 
        else {
            mostrarMensaje("❌ Error al guardar.", "error");
        }
    }

    function cancelar() {
        goto("/mid-population-ages");
    }

    $effect(() => {
        getRecord();
    });
</script>

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

<style>
    main { font-family: sans-serif; padding: 20px; max-width: 700px; margin: auto; }
    .mensaje-alerta { padding: 15px; margin-bottom: 20px; border-radius: 8px; font-weight: bold; text-align: center; }
    .mensaje-exito { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }      
    .mensaje-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }      
    .form-container { background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #ddd; display: flex; flex-direction: column; gap: 12px;}
    .form-row { display: flex; justify-content: space-between; align-items: center; }
    .form-row label { font-weight: bold; color: #444; width: 40%; }
    input { padding: 8px; width: 55%; border: 1px solid #ccc; border-radius: 4px; }
    input:disabled { background-color: #e9ecef; color: #6c757d; cursor: not-allowed; }
    button { padding: 10px 15px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; }
    .btn-primary { background: #007bff; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
    .actions-header { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;}
</style>