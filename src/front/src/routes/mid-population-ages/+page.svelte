<script>
    import { dev } from '$app/environment';
    import { createAuth0Client } from '@auth0/auth0-spa-js';
    import { replaceState } from '$app/navigation';
    // --- ESTADOS ---
    let populations = $state([]);
    let usuario = $state(null);
    let auth0Client = null;

    // Formulario
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

    // Buscador
    let searchCountry = $state("");
    let searchFrom = $state("");
    let searchTo = $state("");

    // API
    let BASE = dev ? 'http://localhost:3000' : '';
    let API = BASE + '/api/v2/mid-population-ages';

    // UI
    let mensajeTexto = $state("");
    let mensajeTipo = $state("");
    let mostrarModalAuth = $state(false);

    async function initAuth() {
        try {
            auth0Client = await createAuth0Client({
                domain: 'dev-416mme2qmv7b1nil.us.auth0.com',
                clientId: 'WkEmXDHoliiv81TQ3FMuOhIssZ2MhXNS',
                authorizationParams: {
                    redirect_uri: window.location.href.split('?')[0]
                }
            });

            if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
                await auth0Client.handleRedirectCallback();
                replaceState(window.location.pathname, {}); 
            }

            const isAuthenticated = await auth0Client.isAuthenticated();
            if (isAuthenticated) {
                const user = await auth0Client.getUser();
                usuario = user?.name || user?.nickname || 'Usuario';

                // Solo intercambiamos si no tenemos ya un token válido en localStorage
                const existingToken = localStorage.getItem('jjg_jwt');
                if (!existingToken) {
                    const claims = await auth0Client.getIdTokenClaims();
                    const res = await fetch(BASE + '/auth/jwt-from-auth0', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken: claims.__raw })
                    });

                    if (res.ok) {
                        const { token } = await res.json();
                        localStorage.setItem('jjg_jwt', token);
                        console.log("✅ Nuevo token JJG guardado");
                    }
                }
            } else {
                usuario = null;
                localStorage.removeItem('jjg_jwt');
            }
        } catch (e) {
            console.error("Error en la autenticación:", e);
        }
    }

    function authHeaders() {
        const token = localStorage.getItem('jjg_jwt');
        console.log("Enviando token:", token ? "SI" : "NO");
        return token ? { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
        } : { 'Content-Type': 'application/json' };
    }

    async function getPopulations() {
        const params = new URLSearchParams();
        if (searchCountry) params.append("country_name", searchCountry.trim());
        if (searchFrom && searchTo) params.append("year", `${searchFrom}-${searchTo}`);
        else if (searchFrom) params.append("year", `>=${searchFrom}`);
        else if (searchTo) params.append("year", `<=${searchTo}`);

        const url = params.toString() ? `${API}?${params.toString()}` : API;
        const res = await fetch(url);
        populations = res.ok ? await res.json() : [];
    }

    async function loadInitialData() {
        const res = await fetch(API + "/loadInitialData");
        if (res.ok) {
            await getPopulations();
            mostrarMensaje("✅ Datos restaurados");
        }
    }

    async function insertPopulation() {
        if (!newCountryName || !newYear || !newSex) {
            mostrarMensaje("❌ Rellena los campos obligatorios", "error");
            return;
        }
        const res = await fetch(API, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
                country_code: newCountryCode, country_name: newCountryName, year: parseInt(newYear),
                sex: newSex, max_age: parseInt(newMaxAge), population_age_0: parseInt(newPop0) || 0,
                population_age_25: parseInt(newPop25) || 0, population_age_50: parseInt(newPop50) || 0,
                population_age_75: parseInt(newPop75) || 0, population_age_100: parseInt(newPop100) || 0
            })
        });
        if (res.ok) { await getPopulations(); mostrarMensaje("✅ Registro añadido"); }
        else if (res.status === 401) { mostrarModalAuth = true; }
    }

    async function deleteOne(pais, anio, sexo) {
        if (!confirm(`¿Borrar registro de ${pais}?`)) return;
        const res = await fetch(`${API}/${encodeURIComponent(pais)}/${anio}/${sexo}`, { 
            method: "DELETE", 
            headers: authHeaders() 
        });
        if (res.ok) { await getPopulations(); mostrarMensaje("🗑️ Registro eliminado"); }
        else if (res.status === 401) { mostrarModalAuth = true; }
        else { mostrarMensaje("❌ Error al eliminar", "error"); }
    }

    async function deleteAll() {
        if (!confirm("🚨 ¿VACIAR TODA LA TABLA?")) return;
        const res = await fetch(API, { 
            method: "DELETE", 
            headers: authHeaders() 
        });
        if (res.ok) {
            await getPopulations();
            mostrarMensaje("🗑️ Tabla vaciada con éxito", "exito");
        } else if (res.status === 401) {
            mostrarModalAuth = true; 
        } else {
            console.error("Error al vaciar:", res.status);
            mostrarMensaje("❌ Error al vaciar la tabla", "error");
        }
    }

    function mostrarMensaje(texto, tipo = "exito") {
        mensajeTexto = texto; mensajeTipo = tipo;
        setTimeout(() => mensajeTexto = "", 4000);
    }

    $effect(() => {
        initAuth().then(getPopulations);
    });
</script>

{#if mostrarModalAuth}
    <div class="modal-overlay" onclick={() => mostrarModalAuth = false}>
        <div class="modal-card" onclick={(e) => e.stopPropagation()}>
            <p class="modal-titulo">Acceso Denegado</p>
            <p class="modal-texto">Tu sesión no tiene permisos o ha caducado. Por favor, pulsa el botón para entrar.</p>
            <div class="modal-botones">
                <button class="btn-auth0" onclick={() => auth0Client.loginWithRedirect()}>Login con Auth0</button>
                <button class="btn-gris" onclick={() => mostrarModalAuth = false}>Cerrar</button>
            </div>
        </div>
    </div>
{/if}

<main>
    <h1>Tasas de Edades de Población (JJG)</h1>

    <div class="auth-bar">
        {#if usuario}
            <span>Hola, <strong>{usuario}</strong></span>
            <button class="btn-gris" onclick={() => {localStorage.removeItem('jjg_jwt'); location.reload();}}>Cerrar sesión</button>
        {:else}
            <button class="btn-auth0" onclick={() => auth0Client.loginWithRedirect()}>Entrar con Auth0</button>
        {/if}
    </div>

    {#if mensajeTexto}
        <div class="mensaje-alerta mensaje-{mensajeTipo}">{mensajeTexto}</div>
    {/if}

    <div class="actions-header">
        <button class="btn-success" onclick={loadInitialData}>Restaurar datos</button>
        {#if usuario}
            <button class="btn-danger" onclick={deleteAll}>Vaciar tabla</button>
        {/if}
    </div>

    <div class="form-container">
        <input placeholder="País..." bind:value={searchCountry} />
        <input type="number" placeholder="Año desde" bind:value={searchFrom} style="width: 100px"/>
        <input type="number" placeholder="Año hasta" bind:value={searchTo} style="width: 100px"/>
        <button class="btn-primary" onclick={getPopulations}>Buscar</button>
    </div>

    {#if usuario}
    <div class="form-container" style="background: #e9ecef;">
        <input placeholder="País" bind:value={newCountryName} />
        <input type="number" placeholder="Año" bind:value={newYear} style="width: 80px"/>
        <select bind:value={newSex}>
            <option value="">Sexo...</option>
            <option value="Male">H</option>
            <option value="Female">M</option>
        </select>
        <button class="btn-primary" onclick={insertPopulation}>Añadir</button>
    </div>
    {/if}

    <table>
        <thead>
            <tr>
                <th>País (Año)</th>
                <th>Sexo</th>
                <th>Población (0/25/50)</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#each populations as pop (pop.country_name + pop.year + pop.sex)}
                <tr>
                    <td><strong>{pop.country_name}</strong> ({pop.year})</td>
                    <td>{pop.sex === 'Male' ? 'Hombre' : 'Mujer'}</td>
                    <td>{pop.population_age_0}/{pop.population_age_25}/{pop.population_age_50}</td>
                    <td>
                        <a href={`/mid-population-ages/${encodeURIComponent(pop.country_name)}/${pop.year}/${pop.sex}`} class="btn-warning">
                            Editar
                        </a>
                        <button class="btn-outline-danger" onclick={() => deleteOne(pop.country_name, pop.year, pop.sex)}>
                            Borrar
                        </button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>

<style>
    main { font-family: sans-serif; max-width: 1000px; margin: auto; padding: 20px; }
    .auth-bar { display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-bottom: 20px; background: #f8f9fa; padding: 10px; border-radius: 5px; }
    .form-container { display: flex; gap: 10px; margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; flex-wrap: wrap; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #212529; color: white; }
    .btn-auth0 { background: #eb5424; color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px; font-weight: bold; }
    .btn-danger { background: #dc3545; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 4px; font-weight: bold; }
    .btn-success { background: #198754; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 4px; font-weight: bold; margin-bottom: 10px;}
    .btn-primary { background: #0d6efd; color: white; border: none; padding: 8px 20px; cursor: pointer; border-radius: 4px; }
    .btn-warning { background: #ffc107; color: black; text-decoration: none; padding: 5px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; display: inline-block; margin-right: 5px; }
    .btn-outline-danger { background: transparent; border: 1px solid #dc3545; color: #dc3545; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .mensaje-alerta { padding: 12px; margin-bottom: 20px; border-radius: 4px; text-align: center; font-weight: bold; }
    .mensaje-exito { background: #d1e7dd; color: #0f5132; }
    .mensaje-error { background: #f8d7da; color: #842029; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-card { background: white; padding: 30px; border-radius: 10px; max-width: 400px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
    .modal-titulo { font-size: 1.25rem; font-weight: bold; margin-bottom: 10px; color: #dc3545; }
    .modal-botones { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
    .btn-gris { background: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
</style>