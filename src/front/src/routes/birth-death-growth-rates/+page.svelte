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

    // Filtros de búsqueda
    let buscarCodigo = $state('');
    let buscarPais = $state('');
    let buscarAnioExacto = $state('');
    let buscarAnioDesde = $state('');
    let buscarAnioHasta = $state('');

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
        if (filtros.codigo) params.append('country_code', filtros.codigo);
        // @ts-ignore
        if (filtros.pais) params.append('country_name', filtros.pais);

        // Lógica de año: exacto tiene prioridad, si no rango desde/hasta
        // @ts-ignore
        if (filtros.anioExacto) {
            // @ts-ignore
            params.append('year', filtros.anioExacto);
        // @ts-ignore
        } else if (filtros.anioDesde && filtros.anioHasta) {
            // @ts-ignore
            params.append('year', `${filtros.anioDesde}-${filtros.anioHasta}`);
        // @ts-ignore
        } else if (filtros.anioDesde) {
            // @ts-ignore
            params.append('year', `>=${filtros.anioDesde}`);
        // @ts-ignore
        } else if (filtros.anioHasta) {
            // @ts-ignore
            params.append('year', `<=${filtros.anioHasta}`);
        }

        const queryString = params.toString();
        const url = queryString ? `${API}?${queryString}` : API;

        const res = await fetch(url);
        if (res.ok) {
            registros = await res.json();
            if (registros.length === 0 && queryString) {
                mostrarMensaje('No se encontraron registros con esos filtros.', 'error');
            }
        } else if (res.status === 404) {
            registros = [];
            if (queryString) mostrarMensaje('No se encontraron registros con esos filtros.', 'error');
        } else {
            mostrarMensaje('No se pudieron cargar los datos.', 'error');
        }
    }

    function buscar() {
        if (buscarAnioExacto && (buscarAnioDesde || buscarAnioHasta)) {
            mostrarMensaje('Usa el año exacto O el rango desde/hasta, no ambos a la vez.', 'error');
            return;
        }
        cargarDatos({
            codigo: buscarCodigo,
            pais: buscarPais,
            anioExacto: buscarAnioExacto,
            anioDesde: buscarAnioDesde,
            anioHasta: buscarAnioHasta
        });
    }

    function limpiarBusqueda() {
        buscarCodigo = '';
        buscarPais = '';
        buscarAnioExacto = '';
        buscarAnioDesde = '';
        buscarAnioHasta = '';
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

    <!-- Formulario de búsqueda -->
    <section class="seccion-busqueda">
        <h2 class="seccion-titulo">Buscar registros</h2>
        <div class="formulario">
            <div class="campo-busqueda">
                <label for="buscar-codigo">Código de país</label>
                <input id="buscar-codigo" type="text" placeholder="Ej: ES" bind:value={buscarCodigo} />
            </div>
            <div class="campo-busqueda">
                <label for="buscar-pais">Nombre de país</label>
                <input id="buscar-pais" type="text" placeholder="Ej: Spain" bind:value={buscarPais} />
            </div>
            <div class="campo-busqueda">
                <label for="buscar-anio-exacto">Año exacto</label>
                <input id="buscar-anio-exacto" type="number" placeholder="Ej: 2022" bind:value={buscarAnioExacto} />
            </div>
            <div class="separador-o">ó</div>
            <div class="campo-busqueda">
                <label for="buscar-desde">Año desde</label>
                <input id="buscar-desde" type="number" placeholder="Ej: 2000" bind:value={buscarAnioDesde} />
            </div>
            <div class="campo-busqueda">
                <label for="buscar-hasta">Año hasta</label>
                <input id="buscar-hasta" type="number" placeholder="Ej: 2022" bind:value={buscarAnioHasta} />
            </div>
            <div class="botones-busqueda">
                <button class="btn-azul" onclick={buscar}>Buscar</button>
                <button class="btn-gris" onclick={limpiarBusqueda}>Limpiar</button>
            </div>
        </div>
    </section>

    <!-- Formulario de añadir -->
    <section class="seccion-busqueda">
        <h2 class="seccion-titulo">Añadir registro</h2>
        <div class="formulario">
            <input type="text" placeholder="Codigo (ej. ES) *" bind:value={nuevoCodigo} />
            <input type="text" placeholder="Pais (ej. Espana) *" bind:value={nuevoPais} />
            <input type="number" placeholder="Anio (ej. 2022) *" bind:value={nuevoAnio} />
            <input type="number" placeholder="Tasa natalidad" bind:value={nuevoNacimientos} step="0.01" />
            <input type="number" placeholder="Tasa mortalidad" bind:value={nuevoDefunciones} step="0.01" />
            <input type="number" placeholder="Migracion neta" bind:value={nuevaMigracion} step="0.01" />
            <input type="number" placeholder="Crecimiento natural" bind:value={nuevoCrecimientoNatural} step="0.01" />
            <input type="number" placeholder="Tasa de crecimiento" bind:value={nuevaTasaCrecimiento} step="0.01" />
            <button class="btn-azul" onclick={anadirRegistro}>Anadir registro</button>
        </div>
    </section>

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

    .seccion-busqueda {
        margin-bottom: 1.5rem;
    }

    .seccion-titulo {
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #888;
        margin-bottom: 0.5rem;
    }

    .formulario {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 0.6rem;
        padding: 1rem 0;
        border-bottom: 0.5px solid #ccc;
    }

    .campo-busqueda {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .campo-busqueda label {
        font-size: 0.72rem;
        color: #888;
        font-weight: 500;
    }

    .formulario input {
        padding: 0.45rem 0.7rem;
        border: none;
        border-bottom: 1.5px solid #ccc;
        background: transparent;
        font-size: 0.9rem;
        width: 130px;
        outline: none;
    }

    .formulario input:focus {
        border-bottom-color: #222;
    }

    .separador-o {
        font-size: 0.8rem;
        color: #aaa;
        align-self: flex-end;
        padding-bottom: 0.45rem;
        user-select: none;
    }

    .botones-busqueda {
        display: flex;
        gap: 0.4rem;
        align-self: flex-end;
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
