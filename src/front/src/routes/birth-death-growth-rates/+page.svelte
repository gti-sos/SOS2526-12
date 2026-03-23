<script>
    import { dev } from "$app/environment";

    let registros = $state([]);

    let nuevoCodigo = $state("");
    let nuevoPais = $state("");
    let nuevoAnio = $state("");
    let nuevoNacimientos = $state("");
    let nuevoDefunciones = $state("");
    let nuevaMigracion = $state("");
    let nuevoCrecimientoNatural = $state("");
    let nuevaTasaCrecimiento = $state("");

    let API = '/api/v2/birth-death-growth-rates';
    if (dev) {
        API = "http://localhost:3000" + API;
    }

    let mensaje = $state("");
    let tipoMensaje = $state("");

    // @ts-ignore
    function mostrarMensaje(texto, tipo = "info") {
        mensaje = texto;
        tipoMensaje = tipo;
        setTimeout(() => { mensaje = ""; }, 4000);
    }

    async function cargarDatos() {
        const res = await fetch(API);
        if (res.ok) {
            registros = await res.json();
        } else if (res.status === 404) {
            registros = [];
        } else {
            mostrarMensaje("No se pudieron cargar los datos. Inténtalo de nuevo más tarde.", "error");
        }
    }

    async function restaurarDatos() {
        const res = await fetch(API + "/loadInitialData");
        if (res.ok) {
            await cargarDatos();
            mostrarMensaje("Datos de ejemplo restaurados correctamente.", "ok");
        } else {
            mostrarMensaje("No se pudieron restaurar los datos de ejemplo.", "error");
        }
    }

    async function añadirRegistro() {
        const nuevo = {
            country_code: nuevoCodigo,
            country_name: nuevoPais,
            year: parseInt(nuevoAnio),
            crude_birth_rate: parseFloat(nuevoNacimientos) || 0,
            crude_death_rate: parseFloat(nuevoDefunciones) || 0,
            net_migration: parseFloat(nuevaMigracion) || 0,
            rate_natural_increase: parseFloat(nuevoCrecimientoNatural) || 0,
            growth_rate: parseFloat(nuevaTasaCrecimiento) || 0
        };

        const res = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevo)
        });

        if (res.ok || res.status === 201) {
            await cargarDatos();
            nuevoCodigo = ""; nuevoPais = ""; nuevoAnio = "";
            nuevoNacimientos = ""; nuevoDefunciones = "";
            nuevaMigracion = ""; nuevoCrecimientoNatural = ""; nuevaTasaCrecimiento = "";
            mostrarMensaje("Registro añadido con éxito.", "nuevo");
        } else if (res.status === 400) {
            mostrarMensaje("Faltan campos obligatorios", "error");
        } else if (res.status === 409) {
            mostrarMensaje(`Ya existe un registro para ${nuevoCodigo} en el año ${nuevoAnio}.`, "error");
        } else {
            mostrarMensaje("Ocurrió un error inesperado al guardar el registro.", "error");
        }
    }

    async function borrarTodo() {
        if (!confirm("¿Seguro que quieres eliminar todos los registros? Esta acción no se puede deshacer.")) return;
        const res = await fetch(API, { method: "DELETE" });
        if (res.ok) {
            await cargarDatos();
            mostrarMensaje("Se han eliminado todos los registros.", "borrado");
        } else {
            mostrarMensaje("No se pudo vaciar la tabla. Inténtalo de nuevo.", "error");
        }
    }

    // @ts-ignore
    async function borrarUno(codigo, anio) {
        if (!confirm(`¿Eliminar el registro de ${codigo} (${anio})?`)) return;
        const res = await fetch(`${API}/${codigo}/${anio}`, { method: "DELETE" });
        if (res.ok) {
            await cargarDatos();
            mostrarMensaje(`Registro de ${codigo} (${anio}) eliminado.`, "borrado");
        } else if (res.status === 404) {
            mostrarMensaje(`No se encontró ningún registro de ${codigo} para el año ${anio}.`, "error");
        } else {
            mostrarMensaje("No se pudo eliminar el registro. Inténtalo de nuevo.", "error");
        }
    }

    $effect(() => {
        cargarDatos();
    });
</script>

<style>
    main {
        font-family: 'Segoe UI', sans-serif;
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem;
        color: #222;
    }

    h1 {
        font-size: 1.6rem;
        margin-bottom: 1.5rem;
        border-bottom: 2px solid #dee2e6;
        padding-bottom: 0.75rem;
    }

    .acciones-cabecera {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .formulario {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        background: #f8f9fa;
        padding: 1rem 1.2rem;
        border-radius: 6px;
        border: 1px solid #dee2e6;
        margin-bottom: 1.2rem;
    }

    .formulario input {
        padding: 0.45rem 0.7rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 0.9rem;
        width: 150px;
    }

    .aviso {
        padding: 0.8rem 1rem;
        border-radius: 5px;
        font-size: 0.95rem;
        margin-bottom: 1rem;
        animation: deslizar 0.25s ease;
    }

    .aviso.ok       { background: #d1e7dd; color: #0f5132; border: 1px solid #badbcc; }
    .aviso.error    { background: #f8d7da; color: #842029; border: 1px solid #f5c2c7; }
    .aviso.nuevo    { background: #cfe2ff; color: #084298; border: 1px solid #b6d4fe; }
    .aviso.borrado  { background: #f8d7da; color: #842029; border: 2px solid #dc3545; }

    @keyframes deslizar {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.92rem;
        background: white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        border-radius: 6px;
        overflow: hidden;
    }

    th, td {
        border: 1px solid #dee2e6;
        padding: 10px 14px;
        text-align: left;
    }

    th {
        background: #f1f3f5;
        font-weight: 600;
        color: #495057;
    }

    tr:hover td { background: #f8f9fa; }

    .sin-datos td {
        text-align: center;
        padding: 1.5rem;
        color: #888;
    }

    button {
        padding: 0.45rem 0.9rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.88rem;
        transition: filter 0.15s;
    }

    button:hover { filter: brightness(0.9); }

    .btn-azul    { background: #0d6efd; color: white; }
    .btn-rojo    { background: #dc3545; color: white; }
    .btn-verde   { background: #198754; color: white; }
</style>

<main>
    <h1>Tasas de Natalidad, Mortalidad y Crecimiento por País</h1>

    {#if mensaje}
        <div class="aviso {tipoMensaje}">{mensaje}</div>
    {/if}

    <div class="acciones-cabecera">
        <button class="btn-verde" onclick={restaurarDatos}>Restaurar datos de ejemplo</button>
        <button class="btn-rojo" onclick={borrarTodo}>Eliminar todos los registros</button>
    </div>

    <div class="formulario">
        <input type="text"   placeholder="Código (ej. ES) *"        bind:value={nuevoCodigo} />
        <input type="text"   placeholder="País (ej. España) *"      bind:value={nuevoPais} />
        <input type="number" placeholder="Año (ej. 2022) *"         bind:value={nuevoAnio} />
        <input type="number" placeholder="Tasa natalidad"           bind:value={nuevoNacimientos} step="0.01" />
        <input type="number" placeholder="Tasa mortalidad"          bind:value={nuevoDefunciones} step="0.01" />
        <input type="number" placeholder="Migración neta"           bind:value={nuevaMigracion} step="0.01" />
        <input type="number" placeholder="Crecimiento natural"      bind:value={nuevoCrecimientoNatural} step="0.01" />
        <input type="number" placeholder="Tasa de crecimiento"      bind:value={nuevaTasaCrecimiento} step="0.01" />
        <button class="btn-azul" onclick={añadirRegistro}>Añadir registro</button>
    </div>

    <table>
        <thead>
            <tr>
                <th>Código</th>
                <th>País</th>
                <th>Año</th>
                <th>Tasa de natalidad</th>
                <th>Tasa de mortalidad</th>
                <th>Migración neta</th>
                <th>Crecimiento natural</th>
                <th>Tasa de crecimiento</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#if registros.length === 0}
                <tr class="sin-datos">
                    <td colspan="9">No hay registros. Añade uno o restaura los datos de ejemplo.</td>
                </tr>
            {/if}
            {#each registros as r (r.country_code + "-" + r.year)}
                <tr>
                    <td>{r.country_code}</td>
                    <td>{r.country_name}</td>
                    <td>{r.year}</td>
                    <td>{r.crude_birth_rate ?? 0}</td>
                    <td>{r.crude_death_rate ?? 0}</td>
                    <td>{r.net_migration ?? 0}</td>
                    <td>{r.rate_natural_increase ?? 0}</td>
                    <td>{r.growth_rate ?? 0}</td>
                    <td>
                        <button class="btn-rojo" onclick={() => borrarUno(r.country_code, r.year)}>
                            Eliminar
                        </button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>
