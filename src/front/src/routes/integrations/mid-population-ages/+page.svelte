<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto'; 

    // ==========================================
    // 1. CONSTANTES DE LAS APIs
    // ==========================================
    const COUNTRIES_API = 'https://sos2526-12.onrender.com/api/v2/proxy/countries';
    const IDH_API       = 'https://sos2526-26.onrender.com/api/v2/countries-idh-per-years';
    const DEATHS_API    = 'https://sos2526-10.onrender.com/api/v2/deaths-by-risk-factors';
    const POKE_API      = 'https://pokeapi.co/api/v2/pokemon?limit=5';
    const METEO_API     = 'https://api.open-meteo.com/v1/forecast?latitude=37.3828&longitude=-5.9732&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FMadrid';
    const LITERACY_API  = 'https://sos2526-11.onrender.com/api/v2/literacy-rates';
    const COFFEE_API    = 'https://sos2526-20.onrender.com/api/v2/coffee-stats';
    const AIDS_API      = 'https://sos2526-21.onrender.com/api/v2/aids-deaths-stats';

    // ==========================================
    // 2. ESTADOS Y REFERENCIAS (Modelo Compañero)
    // ==========================================
    
    // Referencias a los lienzos de las gráficas
    let chartCanvasIdh, chartCanvasMeteo, chartCanvasLit, chartCanvasCoffee, chartCanvasAids;

    // Estados Integración 1 (REST Countries)
    let countriesData = $state([]);
    let countriesLoading = $state(true);
    let countriesError = $state(null);

    // Estados Integración 2 (G26 - IDH)
    let idhLoading = $state(true);
    let idhError = $state(null);

    // Estados Integración 3 (G10 - MPFDR)
    let deathsData = $state([]);
    let deathsLoading = $state(true);
    let deathsError = $state(null);

    // Estados Integración 4 (PokeAPI)
    let pokemonData = $state([]);
    let pokeLoading = $state(true);
    let pokeError = $state(null);

    // Estados Integración 5 (Meteo)
    let meteoLoading = $state(true);
    let meteoError = $state(null);

    // Estados Integración 6 (G11 - Literacy)
    let litLoading = $state(true);
    let litError = $state(null);

    // Estados Integración 7 (G20 - Coffee)
    let coffeeLoading = $state(true);
    let coffeeError = $state(null);

    // Estados Integración 8 (G21 - AIDS)
    let aidsLoading = $state(true);
    let aidsError = $state(null);

    // ==========================================
    // 3. CARGA DE DATOS EN ONMOUNT
    // ==========================================
    onMount(async () => {
        // --- 1. REST Countries (Proxy Externa) ---
        try {
            const res = await fetch(COUNTRIES_API);
            if (res.ok) {
                const data = await res.json();
                countriesData = data.slice(0, 15);
            } else throw new Error("Error al conectar con el servidor backend.");
        } catch (e) { countriesError = e.message; }
        finally { countriesLoading = false; }

        // --- 2. G26 IDH (Chart.js - Bar) ---
        try {
            await fetch(`${IDH_API}/loadInitialData`).catch(() => {});
            const res = await fetch(IDH_API);
            if (res.ok) {
                const data = await res.json();
                const sampleData = data.slice(0, 10);
                
                new Chart(chartCanvasIdh, {
                    type: 'bar',
                    data: {
                        labels: sampleData.map(item => `${item.country} (${item.year})`),
                        datasets: [{
                            label: 'Índice de Desarrollo Humano (IDH)',
                            data: sampleData.map(item => item.hdi_value),
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: { responsive: true }
                });
            } else throw new Error("Error API G26");
        } catch (e) { idhError = e.message; }
        finally { idhLoading = false; }

        // --- 3. G10 Factores de Riesgo (Uso Textual) ---
        try {
            await fetch(`${DEATHS_API}/loadInitialData`).catch(() => {});
            const res = await fetch(DEATHS_API);
            if (res.ok) {
                const data = await res.json();
                deathsData = data.slice(0, 6);
            } else throw new Error("Error API G10");
        } catch (e) { deathsError = e.message; }
        finally { deathsLoading = false; }

        // --- 4. PokeAPI (Externa - Uso Textual) ---
        try {
            const res = await fetch(POKE_API);
            if (res.ok) {
                const list = await res.json();
                pokemonData = await Promise.all(list.results.map(async (p) => {
                    const detail = await fetch(p.url);
                    return await detail.json();
                }));
            } else throw new Error("Error PokeAPI");
        } catch (e) { pokeError = e.message; }
        finally { pokeLoading = false; }

        // --- 5. Open-Meteo (Chart.js - Radar) ---
        try {
            const res = await fetch(METEO_API);
            if (res.ok) {
                const data = await res.json();
                new Chart(chartCanvasMeteo, {
                    type: 'radar', 
                    data: {
                        labels: data.daily.time,
                        datasets: [
                            { label: 'Temp Máxima (°C)', data: data.daily.temperature_2m_max, backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 2 },
                            { label: 'Temp Mínima (°C)', data: data.daily.temperature_2m_min, backgroundColor: 'rgba(54, 162, 235, 0.2)', borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 2 }
                        ]
                    },
                    options: { responsive: true }
                });
            } else throw new Error("Error Meteo API");
        } catch (e) { meteoError = e.message; }
        finally { meteoLoading = false; }

        // --- 6. G11 Alfabetización (Chart.js - Scatter mode Category) ---
        try {
            await fetch(`${LITERACY_API}/loadInitialData`).catch(() => {});
            const res = await fetch(LITERACY_API);
            if (res.ok) {
                const data = await res.json();
                const sampleData = data.slice(0, 10);
                
                new Chart(chartCanvasLit, {
                    type: 'scatter',
                    data: {
                        labels: sampleData.map(item => `${item.country || 'País'} (${item.year || 'Año'})`),
                        datasets: [{
                            label: 'Tasa de Alfabetización',
                            data: sampleData.map(item => item.total),
                            backgroundColor: 'rgba(75, 192, 192, 1)',
                            borderColor: '#4bc0c0',
                            pointRadius: 6,
                            pointHoverRadius: 8
                        }]
                    },
                    options: { responsive: true, scales: { x: { type: 'category' } } }
                });
            } else throw new Error("Error API G11");
        } catch (e) { litError = e.message; }
        finally { litLoading = false; }

        // --- 7. G20 Café (Chart.js - PolarArea) ---
        try {
            await fetch(`${COFFEE_API}/loadInitialData`).catch(() => {});
            const res = await fetch(COFFEE_API);
            if (res.ok) {
                const json = await res.json();
                if (json.data && json.data.length > 0) {
                    const sampleData = json.data.slice(0, 5);
                    new Chart(chartCanvasCoffee, {
                        type: 'polarArea',
                        data: {
                            labels: sampleData.map(item => `${item.country || 'País'} (${item.year || 'Año'})`),
                            datasets: [{
                                label: 'Datos de Café',
                                data: sampleData.map(item => item.production),
                                backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)']
                            }]
                        },
                        options: { responsive: true }
                    });
                }
            } else throw new Error("Error API G20");
        } catch (e) { coffeeError = e.message; }
        finally { coffeeLoading = false; }

        // --- 8. G21 SIDA (Chart.js - Doughnut) ---
        try {
            await fetch(`${AIDS_API}/loadInitialData`).catch(() => {});
            const res = await fetch(AIDS_API);
            if (res.ok) {
                const data = await res.json();
                const sampleData = data.slice(0, 5);
                new Chart(chartCanvasAids, {
                    type: 'doughnut',
                    data: {
                        labels: sampleData.map(item => `${item.country} (${item.year})`),
                        datasets: [{
                            label: 'Muertes registradas',
                            data: sampleData.map(item => (item.death_count_hiv_aids_under_5 || 0) + (item.death_count_hiv_aids_5_14 || 0) + (item.death_count_hiv_aids_15_49 || 0) + (item.death_count_hiv_aids_50_69 || 0) + (item.death_count_hiv_aids_70_plus || 0)),
                            backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0'],
                            hoverOffset: 4
                        }]
                    },
                    options: { responsive: true }
                });
            } else throw new Error("Error API G21");
        } catch (e) { aidsError = e.message; }
        finally { aidsLoading = false; }
    });
</script>

<main style="padding: 20px; font-family: Arial, sans-serif;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <h1>Mis Integraciones - Javier</h1>
        <a href="/analytics" class="btn-grupal">📊 Ver Gráfica Grupal</a>
    </div>

    <section class="integration-block">
        <h2>Integración 1: REST Countries (Vía Proxy)</h2>
        <p><strong>Tipo:</strong> Uso Textual (Tabla) | <strong>API Externa:</strong> restcountries.com</p>
        
        {#if countriesLoading} <p>Cargando datos de países...</p>
        {:else if countriesError} <p style="color: red;">Error: {countriesError}</p>
        {:else}
            <table class="styled-table">
                <thead><tr><th>País</th><th>Región</th><th>Población</th></tr></thead>
                <tbody>
                    {#each countriesData as c}
                        <tr><td>{c.name?.common || 'N/A'}</td><td>{c.region || 'N/A'}</td><td>{c.population?.toLocaleString() || 0}</td></tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </section>

    <section class="integration-block">
        <h2>Integración 2: Grupo 26 (IDH)</h2>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - Bar) | <strong>API Compañeros:</strong> countries-idh-per-years</p>
        
        {#if idhLoading} <p>Cargando gráfica de IDH...</p>
        {:else if idhError} <p style="color: red;">Error: {idhError}</p>
        {/if}
        <div class="chart-container-large"><canvas bind:this={chartCanvasIdh}></canvas></div>
    </section>

    <section class="integration-block">
        <h2>Integración 3: Grupo 10 (Factores de Riesgo)</h2>
        <p><strong>Tipo:</strong> Uso Textual (Tarjetas) | <strong>API Compañeros:</strong> deaths-by-risk-factors</p>
        
        {#if deathsLoading} <p>Cargando datos de salud...</p>
        {:else if deathsError} <p style="color: red;">Error: {deathsError}</p>
        {:else}
            <div class="cards-container">
                {#each deathsData as item}
                    <div class="card">
                        <h4>{item.entity || 'N/A'} ({item.year || 'N/A'})</h4>
                        <ul>
                            <li><strong>Aire:</strong> {item.air_pollution ? Math.round(item.air_pollution).toLocaleString() : 'N/A'}</li>
                            <li><strong>Presión:</strong> {item.high_systolic_blood_pressure ? Math.round(item.high_systolic_blood_pressure).toLocaleString() : 'N/A'}</li>
                            <li><strong>Glucosa:</strong> {item.high_fasting_plasma_glucose ? Math.round(item.high_fasting_plasma_glucose).toLocaleString() : 'N/A'}</li>
                        </ul>
                    </div>
                {/each}
            </div>
        {/if}
    </section>

    <section class="integration-block">
        <h2>Integración 4: PokeAPI</h2>
        <p><strong>Tipo:</strong> Uso Textual (Tarjetas con Imágenes) | <strong>API Externa:</strong> pokeapi.co</p>
        
        {#if pokeLoading} <p>Capturando Pokémon...</p>
        {:else if pokeError} <p style="color: red;">Error: {pokeError}</p>
        {:else}
            <div class="poke-container">
                {#each pokemonData as poke}
                    <div class="poke-card">
                        <img src={poke.sprites.front_default} alt={poke.name} />
                        <h4>{poke.name.toUpperCase()}</h4>
                        <p><strong>Altura:</strong> {poke.height / 10} m</p>
                        <p><strong>Peso:</strong> {poke.weight / 10} kg</p>
                    </div>
                {/each}
            </div>
        {/if}
    </section>

    <section class="integration-block">
        <h2>Integración 5: Open-Meteo (Clima 7 días)</h2>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - Radar) | <strong>API Externa:</strong> open-meteo.com</p>
        
        {#if meteoLoading} <p>Cargando radar meteorológico...</p>
        {:else if meteoError} <p style="color: red;">Error: {meteoError}</p>
        {/if}
        <div class="chart-container-medium"><canvas bind:this={chartCanvasMeteo}></canvas></div>
    </section>

    <section class="integration-block">
        <h2>Integración 6: Grupo 11 (Alfabetización)</h2>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - Scatter) | <strong>API Compañeros:</strong> literacy-rates</p>
        
        {#if litLoading} <p>Cargando gráfica de alfabetización...</p>
        {:else if litError} <p style="color: red;">Error: {litError}</p>
        {/if}
        <div class="chart-container-large"><canvas bind:this={chartCanvasLit}></canvas></div>
    </section>

    <section class="integration-block">
        <h2>Integración 7: Grupo 20 (Café)</h2>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - PolarArea) | <strong>API Compañeros:</strong> coffee-stats</p>
        
        {#if coffeeLoading} <p>Cargando estadísticas de café...</p>
        {:else if coffeeError} <p style="color: red;">Error: {coffeeError}</p>
        {/if}
        <div class="chart-container-small"><canvas bind:this={chartCanvasCoffee}></canvas></div>
    </section>

    <section class="integration-block">
        <h2>Integración 8: Grupo 21 (Muertes SIDA)</h2>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - Doughnut) | <strong>API Compañeros:</strong> aids-deaths-stats</p>
        
        {#if aidsLoading} <p>Cargando datos médicos...</p>
        {:else if aidsError} <p style="color: red;">Error: {aidsError}</p>
        {/if}
        <div class="chart-container-small"><canvas bind:this={chartCanvasAids}></canvas></div>
    </section>
</main>

<style>
    /* Estilos base */
    .integration-block { border: 1px solid #ccc; border-radius: 8px; padding: 20px; margin-bottom: 30px; background-color: #f9f9f9; }
    h2 { font-size: 1.5rem; margin-top: 0; color: #333; }
    p { margin: 5px 0 15px 0; color: #555; }
    
    /* Botón Superior */
    .btn-grupal { background-color: #6f42c1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; transition: background 0.2s; }
    .btn-grupal:hover { background-color: #5a32a3; }

    /* Contenedores de Gráficas */
    .chart-container-large { max-width: 800px; margin: 0 auto; }
    .chart-container-medium { max-width: 600px; margin: 0 auto; }
    .chart-container-small { max-width: 400px; margin: 0 auto; }

    /* Tablas */
    .styled-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .styled-table th, .styled-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    .styled-table th { background-color: #007BFF; color: white; }
    .styled-table tr:nth-child(even) { background-color: #f2f2f2; }

    /* Tarjetas G10 */
    .cards-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 15px; }
    .card { background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s; }
    .card:hover { transform: translateY(-5px); }
    .card h4 { margin-top: 0; color: #d9534f; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .card ul { list-style-type: none; padding: 0; margin: 0; }
    .card li { margin-bottom: 8px; font-size: 0.9em; }

    /* Tarjetas Pokémon */
    .poke-container { display: flex; gap: 15px; flex-wrap: wrap; margin-top: 15px; }
    .poke-card { background-color: #f0f8ff; border: 2px solid #add8e6; border-radius: 10px; padding: 10px; text-align: center; width: 150px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s; }
    .poke-card:hover { transform: scale(1.05); }
    .poke-card img { width: 96px; height: 96px; background-color: white; border-radius: 50%; margin-bottom: 10px; border: 1px solid #ddd; }
    .poke-card h4 { margin: 5px 0; color: #333; }
</style>