<script>
    import { dev } from '$app/environment';

    // @ts-ignore
    let registros = $state([]);

    let nuevoCodigo = $state('');
    let nuevoPais = $state('');
    let nuevoAnio = $state('');
    let nuevoNacimientos = $state('');
    let nuevoDefunciones = $state('');
    let nuevaMigracion = $state('');
    let nuevoCrecimientoNatural = $state('');
    let nuevaTasaCrecimiento = $state('');

    let buscarPais = $state('');
    let buscarAnio = $state('');
    let buscarNatalidad = $state('');
    let buscarMortalidad = $state('');

    let API = '/api/v2/birth-death-growth-rates';
    if (dev) {
        API = 'http://localhost:3000' + API;
    }

    let mensaje = $state('');
    let tipoMensaje = $state('');

    // @ts-ignore
    function mostrarMensaje(texto, tipo = 'info') {
        mensaje = texto;
        tipoMensaje = tipo;
        setTimeout(() => {
            mensaje = '';
        }, 4000);
    }

    async function cargarDatos(filtros = {}) {
        const params = new URLSearchParams();
        // @ts-ignore
        if (filtros.pais) params.append('country_name', filtros.pais);
        // @ts-ignore
        if (filtros.anio) params.append('year', filtros.anio);
        // @ts-ignore
        if (filtros.natalidad) params.append('crude_birth_rate', filtros.natalidad);
        // @ts-ignore
        if (filtros.mortalidad) params.append('crude_death_rate', filtros.mortalidad);

        const queryString = params.toString();
        const url = queryString ? `${API}?${queryString}` : API;

        const res = await fetch(url);
        if (res.ok) {
            registros = await res.json();
        } else if (res.status === 404) {
            registros = [];
            if (queryString) mostrarMensaje('No se encontraron registros con esos filtros.', 'error');
        } else {
            mostrarMensaje('No se pudieron cargar los datos.', 'error');
        }
    }

    function buscar() {
        cargarDatos({
            pais: buscarPais,
            anio: buscarAnio,
            natalidad: buscarNatalidad,
            mortalidad: buscarMortalidad
        });
    }

    function limpiarBusqueda() {
        buscarPais = '';
        buscarAnio = '';
        buscarNatalidad = '';
        buscarMortalidad = '';
        cargarDatos();
    }

    async function restaurarDatos() {
        const res = await fetch(API + '/loadInitialData');
        if (res.ok) {
            await cargarDatos();
            mostrarMensaje('Datos de ejemplo restaurados correctamente.', 'ok');
        } else {
            mostrarMensaje('No se pudieron restaurar los datos de ejemplo.', 'error');
        }
    }

    async function anadirRegistro() {
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevo)
        });

        if (res.ok || res.status === 201) {
            await cargarDatos();
            nuevoCodigo = '';
            nuevoPais = '';
            nuevoAnio = '';
            nuevoNacimientos = '';
            nuevoDefunciones = '';
            nuevaMigracion = '';
            nuevoCrecimientoNatural = '';
            nuevaTasaCrecimiento = '';
            mostrarMensaje('Registro anadido con exito.', 'nuevo');
        } else if (res.status === 400) {
            mostrarMensaje(
                'Faltan campos obligatorios: codigo de pais, nombre del pais y anio son necesarios.',
                'error'
            );
        } else if (res.status === 409) {
            mostrarMensaje(`Ya existe un registro para ${nuevoCodigo} en el anio ${nuevoAnio}.`, 'error');
        } else {
            mostrarMensaje('Ocurrio un error inesperado al guardar el registro.', 'error');
        }
    }

    async function borrarTodo() {
        if (
            !confirm(
                '¿Seguro que quieres eliminar todos los registros? Esta accion no se puede deshacer.'
            )
        )
            return;
        const res = await fetch(API, { method: 'DELETE' });
        if (res.ok) {
            await cargarDatos();
            mostrarMensaje('Se han eliminado todos los registros.', 'borrado');
        } else {
            mostrarMensaje('No se pudo vaciar la tabla. Intentalo de nuevo.', 'error');
        }
    }

    // @ts-ignore
    async function borrarUno(codigo, anio) {
        if (!confirm(`¿Eliminar el registro de ${codigo} (${anio})?`)) return;
        const res = await fetch(`${API}/${codigo}/${anio}`, { method: 'DELETE' });
        if (res.ok) {
            await cargarDatos();
            mostrarMensaje(`Registro de ${codigo} (${anio}) eliminado.`, 'borrado');
        } else if (res.status === 404) {
            mostrarMensaje(`No se encontro ningun registro de ${codigo} para el anio ${anio}.`, 'error');
        } else {
            mostrarMensaje('No se pudo eliminar el registro. Intentalo de nuevo.', 'error');
        }
    }

    $effect(() => {
        cargarDatos();
    });
</script>

<main>
    <h1>Tasas de Natalidad, Mortalidad y Crecimiento por Pais</h1>

    {#if mensaje}
        <div class="aviso {tipoMensaje}">{mensaje}</div>
    {/if}

    <div class="acciones-cabecera">
        <button class="btn-verde" onclick={restaurarDatos}>Restaurar datos de ejemplo</button>
        <button class="btn-rojo" onclick={borrarTodo}>Eliminar todos los registros</button>
    </div>

    <div class="formulario">
        <input type="text" placeholder="Buscar por pais" bind:value={buscarPais} />
        <input type="number" placeholder="Buscar por anio" bind:value={buscarAnio} />
        <input type="number" placeholder="Tasa natalidad" bind:value={buscarNatalidad} step="0.01" />
        <input type="number" placeholder="Tasa mortalidad" bind:value={buscarMortalidad} step="0.01" />
        <button class="btn-azul" onclick={buscar}>Buscar</button>
        <button class="btn-gris" onclick={limpiarBusqueda}>Limpiar</button>
    </div>

    <div class="formulario">
        <input type="text" placeholder="Codigo (ej. ES) *" bind:value={nuevoCodigo} />
        <input type="text" placeholder="Pais (ej. Espana) *" bind:value={nuevoPais} />
        <input type="number" placeholder="Anio (ej. 2022) *" bind:value={nuevoAnio} />
        <input type="number" placeholder="Tasa natalidad" bind:value={nuevoNacimientos} step="0.01" />
        <input type="number" placeholder="Tasa mortalidad" bind:value={nuevoDefunciones} step="0.01" />
        <input type="number" placeholder="Migracion neta" bind:value={nuevaMigracion} step="0.01" />
        <input
            type="number"
            placeholder="Crecimiento natural"
            bind:value={nuevoCrecimientoNatural}
            step="0.01"
        />
        <input
            type="number"
            placeholder="Tasa de crecimiento"
            bind:value={nuevaTasaCrecimiento}
            step="0.01"
        />
        <button class="btn-azul" onclick={anadirRegistro}>Anadir registro</button>
    </div>

    <table>
        <thead>
            <tr>
                <th>Codigo</th>
                <th>Pais</th>
                <th>Anio</th>
                <th>Natalidad</th>
                <th>Mortalidad</th>
                <th>Migracion</th>
                <th>Crec. natural</th>
                <th>Crecimiento</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            {#if registros.length === 0}
                <tr class="sin-datos">
                    <td colspan="9">No hay registros. Anade uno o restaura los datos de ejemplo.</td>
                </tr>
            {/if}
            {#each registros as r (r.country_code + '-' + r.year)}
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
                        <a href="/birth-death-growth-rates/{r.country_code}/{r.year}" class="btn-verde">
                            Editar
                        </a>
                        <button class="btn-outline" onclick={() => borrarUno(r.country_code, r.year)}>
                            Eliminar
                        </button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>

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
        border-bottom: 2px solid #222;
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
        padding: 1rem 0;
        margin-bottom: 1.5rem;
        border-bottom: 0.5px solid #ccc;
    }

    .formulario input {
        padding: 0.45rem 0.7rem;
        border: none;
        border-bottom: 1.5px solid #ccc;
        background: transparent;
        font-size: 0.9rem;
        width: 150px;
        outline: none;
    }

    .formulario input:focus {
        border-bottom-color: #222;
    }

    .aviso {
        padding: 0.8rem 1rem;
        border-radius: 3px;
        font-size: 0.9rem;
        margin-bottom: 1rem;
        animation: deslizar 0.25s ease;
    }

    .aviso.ok {
        background: #d1e7dd;
        color: #0f5132;
    }
    .aviso.error {
        background: #f8d7da;
        color: #842029;
    }
    .aviso.nuevo {
        background: #cfe2ff;
        color: #084298;
    }
    .aviso.borrado {
        background: #f8d7da;
        color: #842029;
    }

    @keyframes deslizar {
        from {
            opacity: 0;
            transform: translateY(-8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }

    th {
        border-bottom: 2px solid #222;
        font-weight: 500;
        color: #666;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 8px 14px;
        text-align: left;
    }

    td {
        border-bottom: 0.5px solid #e0e0e0;
        padding: 10px 14px;
        color: #222;
    }

    tr:last-child td {
        border-bottom: none;
    }

    tr:hover td {
        background: #f9f9f9;
    }

    .sin-datos td {
        text-align: center;
        padding: 2rem;
        color: #999;
        border-bottom: none;
    }

    button {
        padding: 0.4rem 0.85rem;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.85rem;
        transition: opacity 0.15s;
    }

    button:hover {
        opacity: 0.85;
    }

    .btn-azul {
        background: #0d6efd;
        color: white;
    }
    .btn-rojo {
        background: #dc3545;
        color: white;
    }
    .btn-verde {
        background: #198754;
        color: white;
    }
    .btn-outline {
        background: transparent;
        border: 1px solid #dc3545;
        color: #dc3545;
        font-size: 0.8rem;
        padding: 0.25rem 0.6rem;
    }

    a.btn-verde {
        display: inline-block;
        padding: 0.25rem 0.6rem;
        background: #198754;
        color: white;
        text-decoration: none;
        border-radius: 3px;
        font-size: 0.8rem;
        font-weight: 500;
        margin-right: 4px;
    }

    a.btn-verde:hover {
        opacity: 0.85;
    }

    .btn-gris {
        background: transparent;
        border: 1px solid #ccc;
        color: #666;
    }
</style>