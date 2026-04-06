<script>
    import { dev } from "$app/environment";
    import { onMount } from "svelte";

    // --- DATOS PRINCIPALES ---
    // @ts-ignore
    let fertility = $state([]);
    
    // --- FORMULARIO DE CREACION ---
    let newCountryCode = $state("");
    let newCountryName = $state("");
    let newYear = $state("");
    let newFert15_19 = $state("");
    let newFert20_24 = $state("");

    // --- FORMULARIO DE BUSQUEDA ---
    let searchCountry = $state("");
    let searchYear = $state("");
    let searchFrom = $state("");
    let searchTo = $state("");

    let API = '/api/v2/age-specific-fertility-rates';
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
        setTimeout(() => {
            mensajeTexto = "";
        }, 4000);
    }

    // --- GET (CON SOPORTE PARA BUSQUEDAS) ---
    async function getFertility() {
        const params = new URLSearchParams();
        
        if (searchCountry) params.append("country_name", searchCountry);
        if (searchYear) params.append("year", searchYear);
        if (searchFrom) params.append("from", searchFrom);
        if (searchTo) params.append("to", searchTo);

        const queryString = params.toString();
        const fetchUrl = queryString ? `${API}?${queryString}` : API;

        const res = await fetch(fetchUrl, { method: "GET" });
        
        if (res.ok) {
            const data = await res.json();
            fertility = data;

            // NUEVA LÓGICA: Si se ha buscado algo y el array vuelve vacío
            if (queryString && fertility.length === 0) {
                if (searchCountry) {
                    mostrarMensaje(`No hay ningún registro con el nombre: ${searchCountry}`, "error");
                } else {
                    mostrarMensaje("No se encontraron registros con esos filtros.", "error");
                }
            }
        } else if (res.status === 404) {
            fertility = []; 
            if (queryString) {
                if (searchCountry) {
                    mostrarMensaje(`No hay ningún registro con el nombre: ${searchCountry}`, "error");
                } else {
                    mostrarMensaje("No se encontraron registros con esos filtros.", "error");
                }
            }
        } else {
            mostrarMensaje("Tuvimos un problema al intentar cargar la lista.", "error");
        }
    }

    function limpiarBusqueda() {
        searchCountry = ""; searchYear = ""; searchFrom = ""; searchTo = "";
        getFertility();
    }

    // --- RESTO DE OPERACIONES ---
    async function loadInitialData() {
        const res = await fetch(API + "/loadInitialData", { method: "GET" });
        if (res.ok) {
            getFertility();
            mostrarMensaje("Se han restaurado los datos de prueba.", "exito");
        } else {
            mostrarMensaje("Error al restaurar los datos.", "error");
        }
    }

    async function insertFertility() {
        if (!newCountryCode || !newCountryName || newYear === "" || newYear === null || newFert15_19 === "" || newFert15_19 === null || newFert20_24 === "" || newFert20_24 === null) {
            mostrarMensaje("No puedes dejar ningun campo en blanco.", "error");
            return; 
        }

        const newResource = {
            country_code: newCountryCode,
            country_name: newCountryName,
            year: parseInt(newYear), 
            fert_15_19: parseFloat(newFert15_19),
            fert_20_24: parseFloat(newFert20_24)
        };

        const res = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newResource)
        });

        if (res.ok || res.status === 201) {
            getFertility(); 
            newCountryCode = ""; newCountryName = ""; newYear = ""; newFert15_19 = ""; newFert20_24 = "";
            mostrarMensaje("Nuevo registro anadido a la lista con exito.", "creacion");
        } 
        else if (res.status === 400) {
            mostrarMensaje("Faltan datos o el formato es incorrecto.", "error");
        } 
        else if (res.status === 409) {
            mostrarMensaje(`El registro de ${newCountryCode} en el anio ${newYear} ya existe.`, "error");
        } 
        else {
            mostrarMensaje("Error inesperado al guardar.", "error");
        }
    }

    async function deleteAll() {
        if (confirm("Estas seguro de vaciar toda la tabla?")) {
            const res = await fetch(API, { method: "DELETE" });
            if (res.ok) {
                getFertility(); 
                mostrarMensaje("Tabla vaciada correctamente.", "borrado");
            } else {
                mostrarMensaje("Error al vaciar la tabla.", "error");
            }
        }
    }

    // @ts-ignore
    async function deleteOne(country_code, year) {
        if (confirm(`Borrar el registro de ${country_code} del anio ${year}?`)) {
            const res = await fetch(`${API}/${country_code}/${year}`, { method: "DELETE" });
            if (res.ok) {
                getFertility(); 
                mostrarMensaje(`${country_code} (${year}) eliminado con exito.`, "borrado");
            } else {
                mostrarMensaje("Error al intentar eliminar el registro.", "error");
            }
        }
    }

    onMount(() => {
        getFertility();
    });

</script>

<style>
    main { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 1100px; margin: auto; }
    
    .mensaje-alerta { padding: 15px; margin-bottom: 20px; border-radius: 8px; font-weight: bold; text-align: center; animation: aparecer 0.3s ease-in-out; }
    .mensaje-exito { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .mensaje-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .mensaje-creacion { background-color: #cce5ff; color: #004085; border: 1px solid #b8daff; }
    .mensaje-borrado { background-color: #f8d7da; color: #721c24; border: 2px solid #dc3545; }
    
    @keyframes aparecer {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    table { width: 100%; border-collapse: collapse; margin-top: 20px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; vertical-align: middle; }
    th { background-color: #f8f9fa; color: #333; }
    
    .panel { background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px; display: flex; gap: 10px; flex-wrap: wrap; border: 1px solid #ddd; align-items: center;}
    .panel h3 { width: 100%; margin-top: 0; margin-bottom: 10px; font-size: 1.1rem; color: #495057; }
    
    input { padding: 8px; width: 140px; border: 1px solid #ccc; border-radius: 4px; }
    button { padding: 10px 15px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; transition: background-color 0.2s; font-size: 14px; font-family: inherit;}
    
    .btn-primary { background: #007bff; color: white; }
    .btn-primary:hover { background: #0056b3; }
    .btn-danger { background: #dc3545; color: white; }
    .btn-danger:hover { background: #c82333; }
    .btn-success { background: #28a745; color: white; margin-bottom: 15px; }
    .btn-success:hover { background: #218838; }
    .btn-warning { background: #ffc107; color: black; }
    .btn-warning:hover { background: #e0a800; }
    .btn-secondary { background: #6c757d; color: white; }
    .btn-secondary:hover { background: #5a6268; }
    
    .acciones-celda { display: flex; gap: 8px; align-items: center; }
    .btn-enlace { display: inline-block; padding: 10px 15px; border-radius: 4px; font-weight: bold; text-decoration: none; text-align: center; font-size: 14px; font-family: inherit;}
    
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

    <div class="panel">
        <h3>Buscador (Filtros)</h3>
        <input type="text" placeholder="Pais (ej. Spain)" bind:value={searchCountry} />
        <input type="number" placeholder="Anio exacto" bind:value={searchYear} />
        <input type="number" placeholder="Desde anio" bind:value={searchFrom} />
        <input type="number" placeholder="Hasta anio" bind:value={searchTo} />
        <button class="btn-secondary" onclick={getFertility}>Buscar</button>
        <button class="btn-warning" onclick={limpiarBusqueda}>Limpiar</button>
    </div>

    <div class="panel">
        <h3>Anadir Nuevo Registro</h3>
        <input type="text" placeholder="Codigo (ej. ES)" bind:value={newCountryCode} />
        <input type="text" placeholder="Pais (ej. Espana)" bind:value={newCountryName} />
        <input type="number" placeholder="Anio (ej. 2022)" bind:value={newYear} />
        <input type="number" placeholder="Tasa 15-19" bind:value={newFert15_19} step="0.1" />
        <input type="number" placeholder="Tasa 20-24" bind:value={newFert20_24} step="0.1" />
        <button class="btn-primary" onclick={insertFertility}>Anadir</button>
    </div>

    <table>
        <thead>
            <tr>
                <th>Codigo de Pais</th>
                <th>Nombre del Pais</th>
                <th>Anio</th>
                <th>Tasa (15 a 19 anios)</th>
                <th>Tasa (20 a 24 anios)</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#if fertility.length === 0}
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                        No hay datos para mostrar.
                    </td>
                </tr>
            {/if}
            {#each fertility as fert (fert.country_code + "-" + fert.year)}
                <tr>
                    <td>{fert.country_code}</td>
                    <td>{fert.country_name}</td>
                    <td>{fert.year}</td>
                    <td>{fert.fert_15_19}</td>
                    <td>{fert.fert_20_24}</td>
                    <td>
                        <div class="acciones-celda">
                            <a href="/age-specific-fertility-rates/{fert.country_code}/{fert.year}" class="btn-warning btn-enlace">
                                Editar
                            </a>
                            <button class="btn-danger" onclick={() => deleteOne(fert.country_code, fert.year)}>
                                Eliminar
                            </button>
                        </div>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>