<script>
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { dev } from "$app/environment";

    let country_code = page.params.country_code ?? "";
    let year = page.params.year ?? "";

    // @ts-ignore
    let country_name = $state("");
    // @ts-ignore
    let crude_birth_rate = $state("");
    // @ts-ignore
    let crude_death_rate = $state("");
    // @ts-ignore
    let net_migration = $state("");
    // @ts-ignore
    let rate_natural_increase = $state("");
    // @ts-ignore
    let growth_rate = $state("");

    let mensaje = $state("");

    let API = `/api/v2/birth-death-growth-rates/${country_code}/${year}`;
    if (dev) API = "http://localhost:3000" + API;

    async function getRecord() {
        const res = await fetch(API, { method: "GET" });
        if (res.ok) {
            const data = await res.json();
            country_name = data.country_name;
            crude_birth_rate = data.crude_birth_rate;
            crude_death_rate = data.crude_death_rate;
            net_migration = data.net_migration;
            rate_natural_increase = data.rate_natural_increase;
            growth_rate = data.growth_rate;
        } else {
            mensaje = "No se pudieron cargar los datos del registro.";
        }
    }

    async function guardarCambios() {
        const updated = {
            country_code: country_code,
            country_name: country_name,
            year: parseInt(year),
            crude_birth_rate: parseFloat(crude_birth_rate) || 0,
            crude_death_rate: parseFloat(crude_death_rate) || 0,
            net_migration: parseFloat(net_migration) || 0,
            rate_natural_increase: parseFloat(rate_natural_increase) || 0,
            growth_rate: parseFloat(growth_rate) || 0
        };

        const res = await fetch(API, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated)
        });

        if (res.ok) {
            alert("Cambios guardados correctamente.");
                // eslint-disable-next-line svelte/no-navigation-without-resolve
            goto("/birth-death-growth-rates");
        } else if (res.status === 400) {
            mensaje = "Datos incorrectos. Comprueba los campos e inténtalo de nuevo.";
        } else {
            mensaje = "Error inesperado al guardar los cambios.";
        }
    }

    $effect(() => {
        getRecord();
    });
</script>

<style>
    main {
        font-family: 'Segoe UI', sans-serif;
        max-width: 600px;
        margin: 2rem auto;
        padding: 2rem;
        color: #222;
    }

    h1 {
        font-size: 1.4rem;
        margin-bottom: 1.5rem;
        border-bottom: 2px solid #222;
        padding-bottom: 0.75rem;
    }

    .aviso {
        padding: 0.8rem 1rem;
        border-radius: 3px;
        font-size: 0.9rem;
        margin-bottom: 1rem;
        background: #f8d7da;
        color: #842029;
    }

    .campo {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.6rem 0;
        border-bottom: 0.5px solid #e0e0e0;
    }

    label {
        font-size: 0.85rem;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 500;
        width: 45%;
    }

    input {
        width: 50%;
        padding: 0.4rem 0.6rem;
        border: none;
        border-bottom: 1.5px solid #ccc;
        background: transparent;
        font-size: 0.9rem;
        outline: none;
    }

    input:focus {
        border-bottom-color: #222;
    }

    input:disabled {
        color: #999;
        border-bottom-color: #e0e0e0;
    }

    .botones {
        display: flex;
        justify-content: space-between;
        margin-top: 1.5rem;
    }

    button {
        padding: 0.5rem 1.2rem;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.88rem;
        transition: opacity 0.15s;
    }

    button:hover { opacity: 0.85; }

    .btn-azul { background: #0d6efd; color: white; }
    .btn-gris { background: transparent; border: 1px solid #ccc; color: #666; }
</style>

<main>
    <h1>Editar registro — {country_code} ({year})</h1>

    {#if mensaje}
        <div class="aviso">{mensaje}</div>
    {/if}

    <div class="campo">
        <label>Código de país</label>
        <input type="text" value={country_code} disabled />
    </div>
    <div class="campo">
        <label>Año</label>
        <input type="text" value={year} disabled />
    </div>
    <div class="campo">
        <label>Nombre del país</label>
        <input type="text" bind:value={country_name} />
    </div>
    <div class="campo">
        <label>Tasa de natalidad</label>
        <input type="number" bind:value={crude_birth_rate} step="0.01" />
    </div>
    <div class="campo">
        <label>Tasa de mortalidad</label>
        <input type="number" bind:value={crude_death_rate} step="0.01" />
    </div>
    <div class="campo">
        <label>Migración neta</label>
        <input type="number" bind:value={net_migration} step="0.01" />
    </div>
    <div class="campo">
        <label>Crecimiento natural</label>
        <input type="number" bind:value={rate_natural_increase} step="0.01" />
    </div>
    <div class="campo">
        <label>Tasa de crecimiento</label>
        <input type="number" bind:value={growth_rate} step="0.01" />
    </div>

    <div class="botones">
        <button class="btn-gris" onclick={() => goto('/birth-death-growth-rates')}>Cancelar</button>
        <button class="btn-azul" onclick={guardarCambios}>Guardar cambios</button>
    </div>
</main>