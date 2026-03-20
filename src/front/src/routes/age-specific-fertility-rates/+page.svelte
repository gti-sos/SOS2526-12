<script>
    import { dev } from "$app/environment";

    // @ts-ignore
    let fertility = $state([]);
    
    let newCountryCode = $state("");
    let newCountryName = $state("");
    let newYear = $state("");
    let newFert15_19 = $state("");
    let newFert20_24 = $state("");

    let API = '/api/v2/age-specific-fertility-rates';
    if (dev) {
        API = "http://localhost:3000" + API;
    }

    // --- NUEVO SISTEMA DE MENSAJES MULTICOLOR ---
    let mensajeTexto = $state("");
    let mensajeTipo = $state(""); // Puede ser 'exito', 'error', 'creacion', o 'borrado'

    // Ahora le pasamos el "tipo" de mensaje en lugar de true/false
    // @ts-ignore
    function mostrarMensaje(texto, tipo = "exito") {
        mensajeTexto = texto;
        mensajeTipo = tipo;
        setTimeout(() => {
            mensajeTexto = "";
        }, 4000);
    }
    // --------------------------------------------

    async function getFertility() {
        const res = await fetch(API, { method: "GET" });
        if (res.ok) {
            fertility = await res.json();
        } else if (res.status === 404) {
            fertility = []; 
        } else {
            mostrarMensaje("❌ Tuvimos un problema al intentar cargar la lista. Inténtalo más tarde.", "error");
        }
    }

    async function loadInitialData() {
        const res = await fetch(API + "/loadInitialData", { method: "GET" });
        if (res.ok) {
            getFertility();
            mostrarMensaje("✅ Se han restaurado los datos de prueba correctamente.", "exito");
        } else {
            mostrarMensaje("❌ Error en nuestros servidores al restaurar los datos.", "error");
        }
    }

    async function insertFertility() {
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
            newCountryCode = ""; newCountryName = ""; newYear = ""; 
            newFert15_19 = ""; newFert20_24 = "";
            // Mensaje AZUL para creación
            mostrarMensaje("ℹ️ Nuevo registro añadido a la lista con éxito.", "creacion");
        } 
        else if (res.status === 400) {
            mostrarMensaje("❌ Faltan datos: Por favor, asegúrate de escribir el código, el país, el año y las tasas correctamente.", "error");
        } 
        else if (res.status === 409) {
            mostrarMensaje(`⚠️ Atención: Ya tienes apuntado a ${newCountryCode} en el año ${newYear}. No se pueden duplicar.`, "error");
        } 
        else {
            mostrarMensaje("❌ Ha ocurrido un error inesperado al intentar guardar los datos.", "error");
        }
    }

    async function deleteAll() {
        if (confirm("🚨 ¿Estás seguro de que quieres vaciar toda la tabla? Esta acción no se puede deshacer.")) {
            const res = await fetch(API, { method: "DELETE" });
            if (res.ok) {
                getFertility(); 
                // Mensaje ROJO para borrado
                mostrarMensaje("🗑️ Toda la tabla ha sido vaciada correctamente.", "borrado");
            } else {
                mostrarMensaje("❌ Hubo un error en el sistema al intentar vaciar la tabla.", "error");
            }
        }
    }

    // @ts-ignore
    async function deleteOne(country_code, year) {
        if (confirm(`¿Quieres borrar el registro de ${country_code} del año ${year}?`)) {
            const res = await fetch(`${API}/${country_code}/${year}`, { method: "DELETE" });
            
            if (res.ok) {
                getFertility(); 
                // Mensaje ROJO para borrado
                mostrarMensaje(`🗑️ Registro de ${country_code} (${year}) eliminado con éxito.`, "borrado");
            } 
            else if (res.status === 404) {
                mostrarMensaje(`❌ No hemos podido borrar: No existe ningún registro de ${country_code} en el año ${year}.`, "error");
                getFertility(); 
            }
            else {
                mostrarMensaje("❌ No se pudo eliminar el registro debido a un error del sistema.", "error");
            }
        }
    }

    $effect(() => {
        getFertility();
    });
</script>

<style>
    main { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 1000px; margin: auto; }
    
    /* ESTILOS DE LOS MENSAJES POR COLORES */
    .mensaje-alerta {
        padding: 15px;
        margin-bottom: 20px;
        border-radius: 8px;
        font-weight: bold;
        text-align: center;
        animation: aparecer 0.3s ease-in-out;
    }
    
    .mensaje-exito { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }      /* Verde */
    .mensaje-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }      /* Rojo pálido (error) */
    .mensaje-creacion { background-color: #cce5ff; color: #004085; border: 1px solid #b8daff; }   /* Azul */
    .mensaje-borrado { background-color: #f8d7da; color: #721c24; border: 2px solid #dc3545; }    /* Rojo intenso (borrado intencionado) */
    
    @keyframes aparecer {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    table { width: 100%; border-collapse: collapse; margin-top: 20px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f8f9fa; color: #333; }
    .form-container { background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px; display: flex; gap: 10px; flex-wrap: wrap; border: 1px solid #ddd;}
    input { padding: 8px; width: 130px; border: 1px solid #ccc; border-radius: 4px; }
    button { padding: 10px 15px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; transition: background-color 0.2s;}
    .btn-primary { background: #007bff; color: white; }
    .btn-primary:hover { background: #0056b3; }
    .btn-danger { background: #dc3545; color: white; }
    .btn-danger:hover { background: #c82333; }
    .btn-success { background: #28a745; color: white; margin-bottom: 15px;}
    .btn-success:hover { background: #218838; }
    .actions-header { display: flex; justify-content: space-between; align-items: center; }
</style>

<main>
    <h1>Tasas de Fertilidad por Países</h1>

    {#if mensajeTexto !== ""}
        <div class="mensaje-alerta mensaje-{mensajeTipo}">
            {mensajeTexto}
        </div>
    {/if}

    <div class="actions-header">
        <button class="btn-success" onclick={loadInitialData}>📥 Restaurar datos de prueba</button>
        <button class="btn-danger" onclick={deleteAll}>🗑️ Vaciar toda la tabla</button>
    </div>

    <div class="form-container">
        <input type="text" placeholder="Código (ej. ES)" bind:value={newCountryCode} />
        <input type="text" placeholder="País (ej. España)" bind:value={newCountryName} />
        <input type="number" placeholder="Año (ej. 2022)" bind:value={newYear} />
        <input type="number" placeholder="Tasa 15-19" bind:value={newFert15_19} step="0.1" />
        <input type="number" placeholder="Tasa 20-24" bind:value={newFert20_24} step="0.1" />
        <button class="btn-primary" onclick={insertFertility}>Añadir a la lista</button>
    </div>

    <table>
        <thead>
            <tr>
                <th>Código de País</th>
                <th>Nombre del País</th>
                <th>Año</th>
                <th>Tasa (15 a 19 años)</th>
                <th>Tasa (20 a 24 años)</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#if fertility.length === 0}
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                        No hay datos para mostrar. Añade un registro o restaura los datos de prueba.
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
                        <button class="btn-danger" onclick={() => deleteOne(fert.country_code, fert.year)}>
                            Eliminar
                        </button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>