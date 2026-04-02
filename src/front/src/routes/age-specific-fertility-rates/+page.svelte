<script>
    import { dev } from "$app/environment";

    // @ts-ignore
    let fertilityRates = $state([]);
    
    // Variables de estado para el formulario de creación
    let newCountryCode = $state("");
    let newCountryName = $state("");
    let newYear = $state("");
    let newRate1519 = $state("");
    let newRate2024 = $state("");

    // Variables para el buscador
    let searchCountry = $state("");
    let searchYear = $state("");

    // API V2
    let API = '/api/v2/age-specific-fertility-rates';
    if (dev) {
        API = "http://localhost:3000" + API;
    }

    // --- SISTEMA DE MENSAJES ---
    let mensajeTexto = $state("");
    let mensajeTipo = $state(""); 

    // @ts-ignore
    function mostrarMensaje(texto, tipo = "exito") {
        mensajeTexto = texto;
        mensajeTipo = tipo;
        setTimeout(() => {
            mensajeTexto = "";
        }, 4000);
    }

    async function getFertilityRates() {
        let url = API;
        let queryParams = [];

        if (searchCountry) queryParams.push(`country_name=${searchCountry}`);
        if (searchYear) queryParams.push(`year=${searchYear}`);

        if (queryParams.length > 0) {
            url += '?' + queryParams.join('&');
        }

        const res = await fetch(url, { method: "GET" });
        if (res.ok) {
            fertilityRates = await res.json();
            if (fertilityRates.length === 0 && (searchCountry || searchYear)) {
                 mostrarMensaje("Info: No se encontraron registros con esos datos.", "exito");
            }
        } else if (res.status === 404) {
            fertilityRates = []; 
        } else {
            mostrarMensaje("Error: Problema al cargar la lista.", "error");
        }
    }

    function limpiarBusqueda() {
        searchCountry = "";
        searchYear = "";
        getFertilityRates();
    }

    async function loadInitialData() {
        const res = await fetch(API + "/loadInitialData", { method: "GET" });
        if (res.ok) {
            getFertilityRates();
            mostrarMensaje("Exito: Datos de prueba restaurados.", "exito");
        } else {
            mostrarMensaje("Error: No se pudieron restaurar los datos.", "error");
        }
    }

    async function insertFertilityRate() {
        if (newCountryCode.trim() === "" || newCountryName.trim() === "" || newYear === "") {
            mostrarMensaje("Error: El Codigo, el Pais y el Año son obligatorios.", "error");
            return; 
        }

        const newResource = {
            country_code: newCountryCode,
            country_name: newCountryName,
            year: parseInt(newYear),
            fertility_rate_15_19: parseFloat(newRate1519),
            fertility_rate_20_24: parseFloat(newRate2024)
        };

        const res = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newResource)
        });

        if (res.ok || res.status === 201) {
            getFertilityRates(); 
            newCountryCode = ""; newCountryName = ""; newYear = ""; newRate1519 = ""; newRate2024 = "";
            mostrarMensaje("Info: Nuevo registro añadido.", "creacion");
        } 
        else if (res.status === 409) {
            mostrarMensaje(`Error: Ya existe un registro para ${newCountryName} en ${newYear}.`, "error");
        } 
        else {
            mostrarMensaje("Error: No se pudo guardar el registro.", "error");
        }
    }

    async function deleteAll() {
        if (confirm("Atencion: Se va a vaciar toda la tabla. ¿Continuar?")) {
            const res = await fetch(API, { method: "DELETE" });
            if (res.ok) {
                getFertilityRates(); 
                mostrarMensaje("Borrado: Tabla vaciada correctamente.", "borrado");
            } else {
                mostrarMensaje("Error: No se pudo vaciar la tabla.", "error");
            }
        }
    }

    // @ts-ignore
    async function deleteOne(country_code, year) {
        if (confirm(`¿Borrar el registro de ${country_code} (${year})?`)) {
            const res = await fetch(`${API}/${country_code}/${year}`, { method: "DELETE" });
            if (res.ok) {
                getFertilityRates(); 
                mostrarMensaje(`Borrado: Registro eliminado con exito.`, "borrado");
            } else {
                mostrarMensaje("Error: No se pudo eliminar el registro.", "error");
            }
        }
    }

    $effect(() => {
        getFertilityRates();
    });
</script>

<style>
    main { font-family: sans-serif; padding: 20px; max-width: 1200px; margin: auto; }
    .mensaje-alerta { padding: 15px; margin-bottom: 20px; border-radius: 8px; font-weight: bold; text-align: center; }
    .mensaje-exito { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .mensaje-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .mensaje-creacion { background-color: #cce5ff; color: #004085; border: 1px solid #b8daff; }
    .mensaje-borrado { background-color: #f8d7da; color: #721c24; border: 2px solid #dc3545; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f8f9fa; }
    .form-container { background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px; display: flex; gap: 10px; flex-wrap: wrap; border: 1px solid #ddd;}
    input { padding: 8px; width: 150px; border: 1px solid #ccc; border-radius: 4px; }
    button, .btn-warning { padding: 10px 15px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; text-decoration: none; }
    .btn-primary { background: #007bff; color: white; }
    .btn-danger { background: #dc3545; color: white; }
    .btn-success { background: #28a745; color: white; margin-bottom: 15px;}
    .btn-warning { background: #ffc107; color: black; margin-right: 5px; }
    .actions-header { display: flex; justify-content: space-between; align-items: center; }
</style>

<main>
    <h1>Tasas de Fertilidad por Paises</h1>

    {#if mensajeTexto !== ""}
        <div class="mensaje-alerta mensaje-{mensajeTipo}">
            {mensajeTexto}
        </div>
    {/if}

    <div class="actions-header">
        <button class="btn-success" onclick={loadInitialData}>Restaurar datos</button>
        <button class="btn-danger" onclick={deleteAll}>Vaciar tabla</button>
    </div>

    <div class="form-container">
        <h3 style="width: 100%; font-size: 1rem; color: #555;">Buscador</h3>
        <input type="text" placeholder="Pais (ej. Spain)" bind:value={searchCountry} />
        <input type="number" placeholder="Anio" bind:value={searchYear} />
        <button class="btn-primary" onclick={getFertilityRates}>Buscar</button>
        <button class="btn-warning" onclick={limpiarBusqueda}>Limpiar</button>
    </div>

    <div class="form-container">
        <h3 style="width: 100%; font-size: 1rem; color: #555;">Anadir Nuevo Registro</h3>
        <input type="text" placeholder="Codigo (ej. ES)" bind:value={newCountryCode} />
        <input type="text" placeholder="Pais (ej. Espana)" bind:value={newCountryName} />
        <input type="number" placeholder="Anio" bind:value={newYear} />
        <input type="number" step="0.1" placeholder="Tasa 15-19" bind:value={newRate1519} />
        <input type="number" step="0.1" placeholder="Tasa 20-24" bind:value={newRate2024} />
        <button class="btn-primary" onclick={insertFertilityRate}>Anadir</button>
    </div>

    <table>
        <thead>
            <tr>
                <th>Codigo</th>
                <th>Nombre</th>
                <th>Anio</th>
                <th>Tasa 15-19</th>
                <th>Tasa 20-24</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#if fertilityRates.length === 0}
                <tr>
                    <td colspan="6" style="text-align: center;">No hay datos para mostrar.</td>
                </tr>
            {/if}
            {#each fertilityRates as rate (rate.country_code + "-" + rate.year)}
                <tr>
                    <td>{rate.country_code}</td>
                    <td>{rate.country_name}</td>
                    <td>{rate.year}</td>
                    <td>{rate.fertility_rate_15_19}</td>
                    <td>{rate.fertility_rate_20_24}</td>
                    <td>
                        <a href={`/age-specific-fertility-rates/${rate.country_code}/${rate.year}`} class="btn-warning">Editar</a>
                        <button class="btn-danger" onclick={() => deleteOne(rate.country_code, rate.year)}>Eliminar</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>