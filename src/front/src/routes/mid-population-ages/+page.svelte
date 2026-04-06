<script>
    import { dev } from "$app/environment";

    // @ts-ignore
    let populations = $state([]);
    
    // Variables de estado para tu formulario de creación
    let newCountryCode = $state("");
    let newCountryName = $state("");
    let newYear = $state("");
    let newSex = $state("");
    let newMaxAge = $state("");
    let newPop0 = $state("");
    let newPop25 = $state("");
    let newPop50 = $state("");
    let newPop75 = $state("");
    let newPop100 = $state("");

    // --- NUEVAS: Variables para el buscador por rango ---
    let searchCountry = $state("");
    let searchStartYear = $state("");
    let searchEndYear = $state("");

    // APUNTAMOS A LA API V2
    let API = '/api/v2/mid-population-ages';
    if (dev) {
        API = "http://localhost:3000" + API;
    }

    // --- SISTEMA DE MENSAJES MULTICOLOR ---
    let mensajeTexto = $state("");
    let mensajeTipo = $state(""); // 'exito', 'error', 'creacion', 'borrado'

    // @ts-ignore
    function mostrarMensaje(texto, tipo = "exito") {
        mensajeTexto = texto;
        mensajeTipo = tipo;
        setTimeout(() => {
            mensajeTexto = "";
        }, 4000);
    }
    // --------------------------------------------

// OBTENER Y BUSCAR DATOS
    async function getPopulations() {
        let url = API;
        let queryParams = [];

        // Añadimos los parámetros de búsqueda a la URL para enviarlos al Backend
        if (searchCountry) queryParams.push(`country_name=${searchCountry}`);
        if (searchStartYear) queryParams.push(`start_year=${searchStartYear}`);
        if (searchEndYear) queryParams.push(`end_year=${searchEndYear}`);

        // Construimos la URL final (ej: /api/v2/... ?country_name=Azerbaijan&start_year=1989&end_year=1993)
        if (queryParams.length > 0) {
            url += '?' + queryParams.join('&');
        }

        const res = await fetch(url, { method: "GET" });
        if (res.ok) {
            // Recibimos los datos ya filtrados por el servidor
            populations = await res.json();
            
            // Avisar si la búsqueda no dio resultados
            if (populations.length === 0 && (searchCountry || searchStartYear || searchEndYear)) {
                 mostrarMensaje("ℹ️ No se encontraron registros con esos datos de búsqueda.", "exito");
            }
        } else if (res.status === 404) {
            populations = []; 
        } else {
            mostrarMensaje("❌ Tuvimos un problema al intentar cargar la lista. Inténtalo más tarde.", "error");
        }
    }
    
    // LIMPIAR BÚSQUEDA
    function limpiarBusqueda() {
        searchCountry = "";
        searchStartYear = "";
        searchEndYear = "";
        getPopulations();
    }

    async function loadInitialData() {
        const res = await fetch(API + "/loadInitialData", { method: "GET" });
        if (res.ok) {
            getPopulations();
            mostrarMensaje("✅ Se han restaurado los datos de prueba correctamente.", "exito");
        } else {
            mostrarMensaje("❌ Error en nuestros servidores al restaurar los datos.", "error");
        }
    }

    async function insertPopulation() {
        // --- VALIDACIÓN FRONTEND (EL GUARDIA DE SEGURIDAD) ---
        if (newCountryName.trim() === "" || newYear === "" || newSex === "") {
            mostrarMensaje("❌ ¡Alto ahí! Debes rellenar obligatoriamente el País, el Año y el Sexo.", "error");
            return; 
        }
        // -----------------------------------------------------

        const newResource = {
            country_code: newCountryCode,
            country_name: newCountryName,
            year: parseInt(newYear), 
            sex: newSex,
            max_age: parseInt(newMaxAge),
            population_age_0: parseInt(newPop0),
            population_age_25: parseInt(newPop25),
            population_age_50: parseInt(newPop50),
            population_age_75: parseInt(newPop75),
            population_age_100: parseInt(newPop100)
        };

        const res = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newResource)
        });

        if (res.ok || res.status === 201) {
            getPopulations(); 
            // Limpiamos los campos
            newCountryCode = ""; newCountryName = ""; newYear = ""; newSex = ""; newMaxAge = "";
            newPop0 = ""; newPop25 = ""; newPop50 = ""; newPop75 = ""; newPop100 = "";
            
            mostrarMensaje("ℹ️ Nuevo registro añadido a la lista con éxito.", "creacion");
        } 
        else if (res.status === 400) {
            mostrarMensaje("❌ Faltan datos: Por favor, asegúrate de escribir los datos y las poblaciones correctamente.", "error");
        } 
        else if (res.status === 409) {
            mostrarMensaje(`⚠️ Atención: Ya tienes apuntado a ${newCountryName} en el año ${newYear} (${newSex}). No se pueden duplicar.`, "error");
        } 
        else {
            mostrarMensaje("❌ Ha ocurrido un error inesperado al intentar guardar los datos.", "error");
        }
    }

    async function deleteAll() {
        if (confirm("🚨 ¿Estás seguro de que quieres vaciar toda la tabla? Esta acción no se puede deshacer.")) {
            const res = await fetch(API, { method: "DELETE" });
            if (res.ok) {
                getPopulations(); 
                mostrarMensaje("🗑️ Toda la tabla ha sido vaciada correctamente.", "borrado");
            } else {
                mostrarMensaje("❌ Hubo un error en el sistema al intentar vaciar la tabla.", "error");
            }
        }
    }

    // @ts-ignore
    async function deleteOne(country_name, year, sex) {
        if (confirm(`¿Quieres borrar el registro de ${country_name} del año ${year} (${sex})?`)) {
            const res = await fetch(`${API}/${country_name}/${year}/${sex}`, { method: "DELETE" });
            
            if (res.ok) {
                getPopulations(); 
                mostrarMensaje(`🗑️ Registro de ${country_name} (${year} - ${sex}) eliminado con éxito.`, "borrado");
            } 
            else if (res.status === 404) {
                mostrarMensaje(`❌ No hemos podido borrar: No existe ningún registro de ${country_name} en el año ${year}.`, "error");
                getPopulations(); 
            }
            else {
                mostrarMensaje("❌ No se pudo eliminar el registro debido a un error del sistema.", "error");
            }
        }
    }

    $effect(() => {
        getPopulations();
    });
</script>

<style>
    main { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 1200px; margin: auto; }
    
    /* ESTILOS DE LOS MENSAJES POR COLORES */
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
    .mensaje-creacion { background-color: #cce5ff; color: #004085; border: 1px solid #b8daff; }   
    .mensaje-borrado { background-color: #f8d7da; color: #721c24; border: 2px solid #dc3545; }    
    
    @keyframes aparecer {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    table { width: 100%; border-collapse: collapse; margin-top: 20px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f8f9fa; color: #333; }
    .form-container { background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px; display: flex; gap: 10px; flex-wrap: wrap; border: 1px solid #ddd;}
    input, select { padding: 8px; width: 130px; border: 1px solid #ccc; border-radius: 4px; }
    button, .btn-warning { padding: 10px 15px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; transition: background-color 0.2s; text-decoration: none; display: inline-block;}
    .btn-primary { background: #007bff; color: white; }
    .btn-primary:hover { background: #0056b3; }
    .btn-danger { background: #dc3545; color: white; }
    .btn-danger:hover { background: #c82333; }
    .btn-success { background: #28a745; color: white; margin-bottom: 15px;}
    .btn-success:hover { background: #218838; }
    .btn-warning { background: #ffc107; color: black; margin-right: 5px; }
    .btn-warning:hover { background: #e0a800; }
    .actions-header { display: flex; justify-content: space-between; align-items: center; }
</style>

<main>
    <h1>Tasas de Edades de Población</h1>

    {#if mensajeTexto !== ""}
        <div class="mensaje-alerta mensaje-{mensajeTipo}">
            {mensajeTexto}
        </div>
    {/if}

    <div class="actions-header">
        <button class="btn-success" onclick={loadInitialData}>📥 Restaurar datos de prueba</button>
        <button class="btn-danger" onclick={deleteAll}>🗑️ Vaciar toda la tabla</button>
    </div>

    <div class="form-container" style="background-color: #e9ecef;">
        <h3 style="margin: 0 100%; width: 100%; font-size: 1rem; color: #555;">🔍 Buscador</h3>
        <input type="text" placeholder="Buscar por País..." bind:value={searchCountry} />
        <input type="number" placeholder="Año Desde..." bind:value={searchStartYear} />
        <input type="number" placeholder="Año Hasta..." bind:value={searchEndYear} />
        <button class="btn-primary" onclick={getPopulations}>Buscar Registros</button>
        <button class="btn-warning" onclick={limpiarBusqueda}>Limpiar Búsqueda</button>
    </div>

    <div class="form-container">
        <h3 style="margin: 0 100%; width: 100%; font-size: 1rem; color: #555;">➕ Añadir Nuevo Registro</h3>
        <input type="text" placeholder="Cód. País" bind:value={newCountryCode} />
        <input type="text" placeholder="País" bind:value={newCountryName} />
        <input type="number" placeholder="Año" bind:value={newYear} />
        <select bind:value={newSex}>
            <option value="">Sexo...</option>
            <option value="Male">Hombre</option>
            <option value="Female">Mujer</option>
        </select>
        <input type="number" placeholder="Edad Máx" bind:value={newMaxAge} />
        <input type="number" placeholder="Pob. 0" bind:value={newPop0} />
        <input type="number" placeholder="Pob. 25" bind:value={newPop25} />
        <input type="number" placeholder="Pob. 50" bind:value={newPop50} />
        <input type="number" placeholder="Pob. 75" bind:value={newPop75} />
        <input type="number" placeholder="Pob. 100" bind:value={newPop100} />
        <button class="btn-primary" onclick={insertPopulation}>Añadir a la lista</button>
    </div>

    <table>
        <thead>
            <tr>
                <th>País</th>
                <th>Año</th>
                <th>Sexo</th>
                <th>Edad Máx</th>
                <th>Población (0/25/50/75/100)</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#if populations.length === 0}
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                        No hay datos para mostrar. Añade un registro, restaura los datos de prueba o prueba con otra búsqueda.
                    </td>
                </tr>
            {/if}
            {#each populations as pop (pop.country_name + "-" + pop.year + "-" + pop.sex)}
                <tr>
                    <td><strong>{pop.country_name}</strong> ({pop.country_code})</td>
                    <td>{pop.year}</td>
                    <td>{pop.sex === 'Male' ? 'Hombre' : 'Mujer'}</td>
                    <td>{pop.max_age}</td>
                    <td>{pop.population_age_0} / {pop.population_age_25} / {pop.population_age_50} / {pop.population_age_75} / {pop.population_age_100}</td>
                    <td>
                        <a href={`/mid-population-ages/${pop.country_name}/${pop.year}/${pop.sex}`} class="btn-warning">
                            Editar
                        </a>
                        <button class="btn-danger" onclick={() => deleteOne(pop.country_name, pop.year, pop.sex)}>
                            Eliminar
                        </button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>