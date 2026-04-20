<script>
    import { dev } from '$app/environment';
    import { createAuth0Client } from '@auth0/auth0-spa-js';

    // @ts-ignore
    let registros = $state([]);
    let usuario = $state(null);
    // @ts-ignore
    let auth0Client = null;

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

    let BASE = dev ? 'http://localhost:3000' : '';
    let API = BASE + '/api/v2/birth-death-growth-rates';

    let mensaje = $state('');
    let tipoMensaje = $state('');
    let mostrarModalAuth = $state(false);

    async function initAuth() {
        // Fast path: if a valid JWT is already in localStorage (e.g. injected by tests), use it directly
        const existingToken = localStorage.getItem('lph_jwt');
        if (existingToken) {
            try {
                // base64url → base64 before decoding
                const base64 = existingToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(atob(base64));
                if (payload.exp * 1000 > Date.now()) {
                    usuario = payload.username;
                    return;
                }
            } catch { /* fall through to Auth0 */ }
            localStorage.removeItem('lph_jwt');
        }

        // Initialize Auth0
        auth0Client = await createAuth0Client({
            domain: 'sos2526-12.eu.auth0.com',
            clientId: 'psixhrpR89WtLqsrPLJa8LvcxIV6zgBf',
            authorizationParams: {
                redirect_uri: window.location.href.split('?')[0]
            }
        });

        // Handle redirect callback from Auth0
        if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
            await auth0Client.handleRedirectCallback();
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (await auth0Client.isAuthenticated()) {
            const user = await auth0Client.getUser();
            // @ts-ignore
            usuario = user?.nickname || user?.name || user?.email || 'Usuario';
            // Exchange Auth0 ID token for our backend JWT
            try {
                const claims = await auth0Client.getIdTokenClaims();
                const res = await fetch(BASE + '/auth/jwt-from-auth0', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // @ts-ignore
                    body: JSON.stringify({ idToken: claims.__raw })
                });
                if (res.ok) {
                    const { token } = await res.json();
                    localStorage.setItem('lph_jwt', token);
                }
            } catch { /* API calls may fail without JWT but UI still works */ }
        }
    }

    function authHeaders() {
        const token = localStorage.getItem('lph_jwt');
        return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                     : { 'Content-Type': 'application/json' };
    }

    async function iniciarSesion() {
        // @ts-ignore
        await auth0Client.loginWithRedirect({
            authorizationParams: {
                redirect_uri: window.location.href.split('?')[0]
            }
        });
    }

    function mostrarAuthRequerida() {
        mostrarModalAuth = true;
    }

    async function cerrarSesion() {
        localStorage.removeItem('lph_jwt');
        usuario = null;
        // @ts-ignore
        await auth0Client.logout({
            logoutParams: { returnTo: window.location.href.split('?')[0] }
        });
    }

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
            // @ts-ignore
            headers: authHeaders(),
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
        } else if (res.status === 401) {
            mostrarAuthRequerida();
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
        // @ts-ignore
        const res = await fetch(API, { method: 'DELETE', headers: authHeaders() });
        if (res.ok) {
            await cargarDatos();
            mostrarMensaje('Se han eliminado todos los registros.', 'borrado');
        } else if (res.status === 401) {
            mostrarAuthRequerida();
        } else {
            mostrarMensaje('No se pudo vaciar la tabla. Intentalo de nuevo.', 'error');
        }
    }

    // @ts-ignore
    async function borrarUno(codigo, anio) {
        if (!confirm(`¿Eliminar el registro de ${codigo} (${anio})?`)) return;
        // @ts-ignore
        const res = await fetch(`${API}/${codigo}/${anio}`, { method: 'DELETE', headers: authHeaders() });
        if (res.ok) {
            await cargarDatos();
            mostrarMensaje(`Registro de ${codigo} (${anio}) eliminado.`, 'borrado');
        } else if (res.status === 401) {
            mostrarAuthRequerida();
        } else if (res.status === 404) {
            mostrarMensaje(`No se encontro ningun registro de ${codigo} para el anio ${anio}.`, 'error');
        } else {
            mostrarMensaje('No se pudo eliminar el registro. Intentalo de nuevo.', 'error');
        }
    }

    $effect(() => {
        initAuth().then(() => cargarDatos());
    });
</script>

{#if mostrarModalAuth}
    <div class="modal-overlay" onclick={() => mostrarModalAuth = false}>
        <div class="modal-card" onclick={(e) => e.stopPropagation()}>
            <p class="modal-titulo">Acción no permitida</p>
            <p class="modal-texto">Debes iniciar sesión con Auth0 para añadir, editar o eliminar registros.</p>
            <div class="modal-botones">
                <button class="btn-auth0" onclick={iniciarSesion}>Iniciar sesión con Auth0</button>
                <button class="btn-gris" onclick={() => mostrarModalAuth = false}>Cancelar</button>
            </div>
        </div>
    </div>
{/if}

<main>
    <h1>Tasas de Natalidad, Mortalidad y Crecimiento por Pais</h1>

    <div class="auth-bar">
        {#if usuario}
            <span class="auth-usuario">Conectado como <strong>{usuario}</strong></span>
            <button class="btn-gris" onclick={cerrarSesion}>Cerrar sesión</button>
        {:else}
            <span class="auth-info">Inicia sesión para añadir, editar o eliminar registros</span>
            <button class="btn-auth0" onclick={iniciarSesion}>
                Iniciar sesión con Auth0
            </button>
        {/if}
    </div>

    {#if mensaje}
        <div class="aviso {tipoMensaje}">{mensaje}</div>
    {/if}

    {#if usuario}
    <div class="acciones-cabecera">
        <button class="btn-verde" onclick={restaurarDatos}>Restaurar datos de ejemplo</button>
        <button class="btn-rojo" onclick={borrarTodo}>Eliminar todos los registros</button>
    </div>
    {/if}

    <!-- Formulario de búsqueda -->
    <section class="seccion-busqueda">
        <h2 class="seccion-titulo">Buscar registros</h2>
        <div class="formulario">
            <div class="campo-busqueda">
                <label for="buscar-codigo">Código de país</label>
                <input id="buscar-codigo" type="text" placeholder="Buscar por codigo" bind:value={buscarCodigo} />
            </div>
            <div class="campo-busqueda">
                <label for="buscar-pais">Nombre de país</label>
                <input id="buscar-pais" type="text" placeholder="Buscar por pais" bind:value={buscarPais} />
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

    <!-- Formulario de añadir (solo visible si autenticado) -->
    {#if usuario}
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
    {/if}

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

    .auth-bar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
        padding: 0.6rem 1rem;
        background: #f6f8fa;
        border-radius: 6px;
        border: 1px solid #e0e0e0;
    }

    .auth-info {
        font-size: 0.85rem;
        color: #888;
    }

    .auth-usuario {
        font-size: 0.85rem;
        color: #444;
    }

    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
    }

    .modal-card {
        background: white;
        border-radius: 8px;
        padding: 2rem;
        max-width: 380px;
        width: 90%;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        text-align: center;
    }

    .modal-titulo {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #222;
    }

    .modal-texto {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 1.5rem;
    }

    .modal-botones {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
    }

    .btn-auth0 {
        background: #eb5424;
        color: white;
        display: flex;
        align-items: center;
        padding: 0.4rem 0.9rem;
        border-radius: 5px;
        font-size: 0.85rem;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: background 0.15s;
    }

    .btn-auth0:hover {
        background: #c94a1f;
        opacity: 1;
    }
</style>
