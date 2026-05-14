<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto'; 
    import { dev } from '$app/environment';

    // ==========================================
    // 1. CONSTANTES DE LAS APIs
    // ==========================================
    const API_BASE_URL = dev ? 'http://localhost:3000' : '';
    const DISEASE_API  = `${API_BASE_URL}/api/v2/proxy/disease-stats`;
    const MY_API_URL   = `${API_BASE_URL}/api/v2/mid-population-ages`;
    const IDH_API      = 'https://sos2526-26.onrender.com/api/v2/countries-idh-per-years';
    const DEATHS_API   = 'https://sos2526-10.onrender.com/api/v2/deaths-by-risk-factors';
    const COUNTRIES_API = 'https://restcountries.com/v3.1/all?fields=name,flags,area';
    const METEO_API    = 'https://api.open-meteo.com/v1/forecast?latitude=37.3828&longitude=-5.9732&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FMadrid';
    const LITERACY_API = 'https://sos2526-11.onrender.com/api/v2/literacy-rates';
    const UNIS_API      = 'https://corsproxy.io/?http://universities.hipolabs.com/search?country=';
    const AIDS_API     = 'https://sos2526-21.onrender.com/api/v2/aids-deaths-stats';

    // ==========================================
    // 2. ESTADOS Y REFERENCIAS
    // ==========================================
    
    // Referencias a los lienzos de las gráficas
    let chartCanvasIdh, chartCanvasMeteo, chartCanvasLit, chartCanvasUnis, chartCanvasAids;

    // Estados Integración 1 (disease.sh)
    let diseaseData = $state([]);
    let diseaseLoading = $state(true);
    let diseaseError = $state(null);

    // Estados Integración 2 (G26 - IDH)
    let idhLoading = $state(true);
    let idhError = $state(null);

    // Estados Integración 3 (G10 - MPFDR)
    let deathsData = $state([]);
    let deathsLoading = $state(true);
    let deathsError = $state(null);

    // Estados Integración 4 (REST Countries - Tarjetas)
    let countriesData = $state([]);
    let countriesLoading = $state(true);
    let countriesError = $state(null);

    // Estados Integración 5 (Meteo)
    let meteoLoading = $state(true);
    let meteoError = $state(null);

    // Estados Integración 6 (G11 - Literacy)
    let litLoading = $state(true);
    let litError = $state(null);

    // Estados Integración 7 (Universidades - PolarArea)
    let unisLoading = $state(true);
    let unisError = $state(null);

    // Estados Integración 8 (G21 - AIDS)
    let aidsLoading = $state(true);
    let aidsError = $state(null);

    // ==========================================
    // 3. CARGA DE DATOS EN ONMOUNT
    // ==========================================
    onMount(async () => {
        // --- Carga de mi API (mid-population-ages) para los cruces ---
        let myDataByCountry = {};
        try {
            const myRes = await fetch(MY_API_URL);
            if (myRes.ok) {
                const myData = await myRes.json();
                myData.forEach(r => {
                    const key = (r.country_name || '').toLowerCase();
                    if (!key) return;
                    if (!myDataByCountry[key]) {
                        myDataByCountry[key] = { pop0: 0, pop25: 0, pop50: 0, pop75: 0, pop100: 0, max_age: 0 };
                    }
                    myDataByCountry[key].pop0   += r.population_age_0   || 0;
                    myDataByCountry[key].pop25  += r.population_age_25  || 0;
                    myDataByCountry[key].pop50  += r.population_age_50  || 0;
                    myDataByCountry[key].pop75  += r.population_age_75  || 0;
                    myDataByCountry[key].pop100 += r.population_age_100 || 0;
                    myDataByCountry[key].max_age = Math.max(myDataByCountry[key].max_age, r.max_age || 0);
                });
            }
        } catch (e) { console.error("Error cargando mid-population-ages:", e); }

        // --- 1. disease.sh (Proxy Externa) ---
        try {
            const res = await fetch(DISEASE_API);
            if (res.ok) {
                const data = await res.json();
                diseaseData = data
                    .sort((a, b) => b.population - a.population)
                    .slice(0, 15)
                    .map(c => ({
                        ...c,
                        pop50FromJJG: myDataByCountry[(c.country || '').toLowerCase()]?.pop50 || 0
                    }));
            } else throw new Error("Error al conectar con el servidor backend.");
        } catch (e) { diseaseError = e.message; }
        finally { diseaseLoading = false; }

        // --- 2. G26 IDH (Chart.js - Bar) ---
        try {
            await fetch(`${IDH_API}/loadInitialData`).catch(() => {});
            const res = await fetch(IDH_API);
            if (res.ok) {
                const data = await res.json();
                const crossed = data.filter(item => myDataByCountry[(item.country || '').toLowerCase()]);
                const sampleData = (crossed.length ? crossed : data).slice(0, 10);

                new Chart(chartCanvasIdh, {
                    type: 'bar',
                    data: {
                        labels: sampleData.map(item => `${item.country} (${item.year})`),
                        datasets: [
                            {
                                label: 'IDH (G26)',
                                data: sampleData.map(item => item.hdi_value),
                                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                borderColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 1,
                                yAxisID: 'y'
                            },
                            {
                                label: 'Pob. 50 años / 1000 (mi API)',
                                data: sampleData.map(item => (myDataByCountry[(item.country || '').toLowerCase()]?.pop50 || 0) / 1000),
                                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                                borderColor: 'rgba(255, 99, 132, 1)',
                                borderWidth: 1,
                                yAxisID: 'y2'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title:    { display: true, text: 'IDH vs población 50 años' },
                            subtitle: { display: true, text: 'hdi_value (G26) cruzado con population_age_50 (mi API)' }
                        },
                        scales: {
                            y:  { type: 'linear', position: 'left',  title: { display: true, text: 'IDH' } },
                            y2: { type: 'linear', position: 'right', title: { display: true, text: 'Pob. 50 años (miles)' }, grid: { drawOnChartArea: false } }
                        }
                    }
                });
            } else throw new Error("Error API G26");
        } catch (e) { idhError = e.message; }
        finally { idhLoading = false; }

        // --- 3. G10 Factores de Riesgo (Tarjetas) ---
        try {
            await fetch(`${DEATHS_API}/loadInitialData`).catch(() => {});
            const res = await fetch(DEATHS_API);
            if (res.ok) {
                const data = await res.json();
                deathsData = data.slice(0, 6).map(item => {
                    const key = (item.entity || '').toLowerCase();
                    const mine = myDataByCountry[key];
                    return {
                        ...item,
                        pop25FromJJG: mine?.pop25 || 0,
                        pop50FromJJG: mine?.pop50 || 0
                    };
                });
            } else throw new Error("Error API G10");
        } catch (e) { deathsError = e.message; }
        finally { deathsLoading = false; }

        // --- 4. REST Countries (Externa - Tarjetas con Imágenes) ---
        try {
            const res = await fetch(COUNTRIES_API);
            if (res.ok) {
                const list = await res.json();
                countriesData = list
                    .filter(c => myDataByCountry[(c.name.common || '').toLowerCase()]) // Solo países de tu BD
                    .slice(0, 5) // Mostramos 5 para no saturar
                    .map(c => {
                        const mine = myDataByCountry[(c.name.common || '').toLowerCase()];
                        return {
                            name: c.name.common,
                            image: c.flags.png,
                            area: c.area,
                            pop50: mine.pop50,
                            // Calculamos densidad poblacional de 50 años (personas/km2)
                            density: c.area ? (mine.pop50 / c.area).toFixed(4) : 0
                        };
                    });
            } else throw new Error("Error REST Countries API");
        } catch (e) { countriesError = e.message; }
        finally { countriesLoading = false; }

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

        // --- 6. G11 Alfabetización (Chart.js - Scatter) ---
        try {
            await fetch(`${LITERACY_API}/loadInitialData`).catch(() => {});
            const res = await fetch(LITERACY_API);
            if (res.ok) {
                const data = await res.json();
                const points = data
                    .map(item => {
                        const key = (item.country || '').toLowerCase();
                        const mine = myDataByCountry[key];
                        if (!mine || item.total === undefined) return null;
                        return { x: Number(item.total), y: mine.pop25, country: item.country, year: item.year };
                    })
                    .filter(p => p !== null)
                    .slice(0, 15);

                new Chart(chartCanvasLit, {
                    type: 'scatter',
                    data: {
                        datasets: [{
                            label: 'País',
                            data: points,
                            backgroundColor: 'rgba(75, 192, 192, 0.7)',
                            borderColor: '#4bc0c0',
                            pointRadius: 7,
                            pointHoverRadius: 10
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title:    { display: true, text: 'Alfabetización vs población 25 años' },
                            subtitle: { display: true, text: 'total (G11) en X cruzado con population_age_25 (mi API) en Y' },
                            tooltip: { callbacks: { label: (ctx) => `${ctx.raw.country}: alfab=${ctx.raw.x}, pob25=${ctx.raw.y}` } }
                        },
                        scales: {
                            x: { type: 'linear', title: { display: true, text: 'Tasa alfabetización (%)' } },
                            y: { type: 'linear', title: { display: true, text: 'Población 25 años' } }
                        }
                    }
                });
            } else throw new Error("Error API G11");
        } catch (e) { litError = e.message; }
        finally { litLoading = false; }

        // --- 7. Universidades (Chart.js - PolarArea) ---
        try {
            // Buscamos 5 países que sepamos que tenemos en nuestra API
            const paisesPrueba = Object.keys(myDataByCountry).slice(0, 5);
            let unisResults = [];

            for (let pais of paisesPrueba) {
                const res = await fetch(`${UNIS_API}${pais}`);
                if (res.ok) {
                    const data = await res.json();
                    unisResults.push({
                        country: pais,
                        uniCount: data.length // Contamos cuántas universidades devuelve la API para ese país
                    });
                }
            }

            if (unisResults.length > 0) {
                new Chart(chartCanvasUnis, {
                    type: 'polarArea',
                    data: {
                        labels: unisResults.map(item => item.country.toUpperCase()),
                        datasets: [{
                            label: 'Número de Universidades',
                            data: unisResults.map(item => item.uniCount),
                            backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)']
                        }]
                    },
                    options: { 
                        responsive: true,
                        plugins: {
                            title: { display: true, text: 'Número de Universidades por País' },
                            subtitle: { display: true, text: 'Universidades totales en los países de mi API' }
                        }
                    }
                });
            }
        } catch (e) { unisError = e.message; }
        finally { unisLoading = false; }

        // --- 8. G21 SIDA (Chart.js - Doughnut) ---
        try {
            await fetch(`${AIDS_API}/loadInitialData`).catch(() => {});
            const res = await fetch(AIDS_API);
            if (res.ok) {
                const data = await res.json();
                const crossed = data
                    .map(item => {
                        const key = (item.country || '').toLowerCase();
                        const mine = myDataByCountry[key];
                        if (!mine || !mine.pop50) return null;
                        const deaths = (item.death_count_hiv_aids_under_5 || 0) + (item.death_count_hiv_aids_5_14 || 0) + (item.death_count_hiv_aids_15_49 || 0) + (item.death_count_hiv_aids_50_69 || 0) + (item.death_count_hiv_aids_70_plus || 0);
                        return { country: item.country, year: item.year, ratio: deaths / (mine.pop50 / 1000) };
                    })
                    .filter(p => p !== null)
                    .slice(0, 5);

                new Chart(chartCanvasAids, {
                    type: 'doughnut',
                    data: {
                        labels: crossed.map(c => `${c.country} (${c.year})`),
                        datasets: [{
                            label: 'Muertes SIDA / 1k pob. 50 años',
                            data: crossed.map(c => Number(c.ratio.toFixed(2))),
                            backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0'],
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title:    { display: true, text: 'Mortalidad SIDA relativa a población 50 años' },
                            subtitle: { display: true, text: 'sum(deaths_*) (G21) ÷ (population_age_50/1000) (mi API)' }
                        }
                    }
                });
            } else throw new Error("Error API G21");
        } catch (e) { aidsError = e.message; }
        finally { aidsLoading = false; }
    });
</script>

<main style="padding: 20px; font-family: Arial, sans-serif;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <h1>Mis Integraciones - Javier</h1>
    </div>

    <!-- Integración 1 -->
    <section class="integration-block">
        <h2>Integración 1: disease.sh (Vía Proxy)</h2>
        <p><strong>Tipo:</strong> Uso Textual (Tabla) | <strong>API Externa:</strong> disease.sh | <em>cruzado con mi API</em></p>
        {#if diseaseLoading} <p>Cargando estadísticas globales...</p>
        {:else if diseaseError} <p style="color: red;">Error: {diseaseError}</p>
        {:else}
            <table class="styled-table">
                <thead><tr><th>País</th><th>Continente</th><th>Población (disease.sh)</th><th>Casos COVID</th><th>Muertes</th><th>Pob. 50 años (mi API)</th></tr></thead>
                <tbody>
                    {#each diseaseData as c}
                        <tr>
                            <td>{c.country || 'N/A'}</td>
                            <td>{c.continent || 'N/A'}</td>
                            <td>{c.population?.toLocaleString() || 0}</td>
                            <td>{c.cases?.toLocaleString() || 0}</td>
                            <td>{c.deaths?.toLocaleString() || 0}</td>
                            <td>{c.pop50FromJJG ? c.pop50FromJJG.toLocaleString() : '—'}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
            <div class="integration-proof">
                <strong>Fórmula:</strong> última columna = <code>population_age_50</code> (mi API) alineada por nombre con <code>country</code> (disease.sh).
            </div>
        {/if}
    </section>

    <!-- Integración 2 -->
    <section class="integration-block">
        <h2>Integración 2: Grupo 26 (IDH)</h2>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - Bar) | <strong>API Compañeros:</strong> countries-idh-per-years | <em>cruzado con mi API</em></p>
        {#if idhLoading} <p>Cargando gráfica de IDH...</p>
        {:else if idhError} <p style="color: red;">Error: {idhError}</p>
        {/if}
        <div class="chart-container-large"><canvas bind:this={chartCanvasIdh}></canvas></div>
    </section>

    <!-- Integración 3 -->
    <section class="integration-block">
        <h2>Integración 3: Grupo 10 (Factores de Riesgo)</h2>
        <p><strong>Tipo:</strong> Uso Textual (Tarjetas) | <strong>API Compañeros:</strong> deaths-by-risk-factors | <em>cruzado con mi API</em></p>
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
                            <li style="margin-top:6px;border-top:1px dashed #ccc;padding-top:6px;"><strong>Pob. 25 años (mía):</strong> {item.pop25FromJJG ? item.pop25FromJJG.toLocaleString() : '—'}</li>
                        </ul>
                    </div>
                {/each}
            </div>
        {/if}
    </section>

    <!-- Integración 4: REST Countries -->
    <section class="integration-block">
        <h2>Integración 4: REST Countries</h2>
        <p><strong>Tipo:</strong> Uso Textual (Tarjetas con Imágenes) | <strong>API Externa:</strong> restcountries.com | <em>cruzado con mi API</em></p>
        {#if countriesLoading} <p>Cargando datos de países y banderas...</p>
        {:else if countriesError} <p style="color: red;">Error: {countriesError}</p>
        {:else}
            <div class="img-card-container">
                {#each countriesData as country}
                    <div class="img-card">
                        <img src={country.image} alt="Bandera de {country.name}" />
                        <h4>{country.name.toUpperCase()}</h4>
                        <p><strong>Área:</strong> {country.area.toLocaleString()} km²</p>
                        <p><strong>Pob. 50 años (mía):</strong> {country.pop50.toLocaleString()}</p>
                        <hr>
                        <p style="color: #007BFF; font-weight:bold; font-size: 0.9em;">
                            Densidad (+50 años): {country.density} pers/km²
                        </p>
                    </div>
                {/each}
            </div>
            <div class="integration-proof">
                <strong>Fórmula:</strong> Densidad calculada dividiendo <code>population_age_50</code> (mi API) entre el <code>area</code> de la API externa de países.
            </div>
        {/if}
    </section>

    <!-- Integración 5 -->
    <section class="integration-block">
        <h2>Integración 5: Open-Meteo (Clima 7 días)</h2>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - Radar) | <strong>API Externa:</strong> open-meteo.com</p>
        {#if meteoLoading} <p>Cargando radar meteorológico...</p>
        {:else if meteoError} <p style="color: red;">Error: {meteoError}</p>
        {/if}
        <div class="chart-container-medium"><canvas bind:this={chartCanvasMeteo}></canvas></div>
    </section>

    <!-- Integración 6 -->
    <section class="integration-block">
        <h2>Integración 6: Grupo 11 (Alfabetización)</h2>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - Scatter) | <strong>API Compañeros:</strong> literacy-rates | <em>cruzado con mi API</em></p>
        {#if litLoading} <p>Cargando gráfica...</p>
        {:else if litError} <p style="color: red;">Error: {litError}</p>
        {/if}
        <div class="chart-container-large"><canvas bind:this={chartCanvasLit}></canvas></div>
    </section>

    <!-- Integración 7: Universidades -->
    <section class="integration-block">
        <h2>Integración 7: Universidades del Mundo</h2>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - PolarArea) | <strong>API Externa:</strong> universities.hipolabs.com | <em>cruzado por país</em></p>
        {#if unisLoading} <p>Calculando número de universidades por país...</p>
        {:else if unisError} <p style="color: red;">Error: {unisError}</p>
        {/if}
        <div class="chart-container-small"><canvas bind:this={chartCanvasUnis}></canvas></div>
    </section>

    <!-- Integración 8 -->
    <section class="integration-block">
        <h2>Integración 8: Grupo 21 (Muertes SIDA)</h2>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - Doughnut) | <strong>API Compañeros:</strong> aids-deaths-stats | <em>cruzado con mi API</em></p>
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

    /* Tarjetas con Imagen (Sustituto de Pokémon) */
    .img-card-container { display: flex; gap: 15px; flex-wrap: wrap; margin-top: 15px; }
    .img-card { background-color: #fff; border: 2px solid #eee; border-radius: 10px; padding: 15px; text-align: center; width: 180px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: transform 0.2s; }
    .img-card:hover { transform: scale(1.05); border-color: #007BFF; }
    .img-card img { width: 100px; height: 60px; object-fit: cover; border-radius: 4px; margin-bottom: 10px; border: 1px solid #ccc; }
    .img-card h4 { margin: 5px 0 10px 0; color: #333; font-size: 1.1em;}
    .img-card p { font-size: 0.85em; margin: 3px 0; }
    .img-card hr { border: 0; border-top: 1px dashed #ddd; margin: 10px 0; }

    /* Caja explicativa de cruce */
    .integration-proof { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-top: 12px; font-size: 0.92rem; border-radius: 4px; line-height: 1.5; }
    .integration-proof code { background: #fff; padding: 2px 6px; border-radius: 3px; font-family: monospace; color: #b45309; font-weight: 600; }
</style>