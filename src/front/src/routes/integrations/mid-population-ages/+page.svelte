<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto'; // Importamos la biblioteca de gráficas

    // --- ESTADOS PARA INTEGRACIÓN 1 (REST Countries) ---
    // @ts-ignore
    let countriesData = $state([]);
    let errorMessage = $state("");
    let isLoading = $state(true);

    // --- ESTADOS PARA INTEGRACIÓN 2 (G26 - IDH) ---
    let idhErrorMessage = $state("");
    // @ts-ignore
    let chartCanvas; // Aquí guardaremos la referencia al <canvas> del HTML
    // --- ESTADOS PARA INTEGRACIÓN 3 (G10 - MPFDR) ---

    // @ts-ignore
    let deathsData = $state([]);
    let deathsErrorMessage = $state("");

    // --- ESTADOS PARA INTEGRACIÓN 4 (PokeAPI) ---
    // @ts-ignore
    let pokemonData = $state([]);
    let pokeErrorMessage = $state("");

    // --- ESTADOS PARA INTEGRACIÓN 5 (Open-Meteo - Clima) ---
    let meteoErrorMessage = $state("");
    // @ts-ignore
    let meteoCanvas; // Referencia para el lienzo de esta nueva gráfica

    // --- ESTADOS PARA INTEGRACIÓN 6 (G11 - Literacy) ---
    let litErrorMessage = $state("");
    let litCanvas;

    // --- ESTADOS PARA INTEGRACIÓN 7 (G20 - Café) ---
    let coffeeErrorMessage = $state("");
    let coffeeCanvas;


    // --- ESTADOS PARA INTEGRACIÓN 8 (G21 - SIDA) ---
    let aidsErrorMessage = $state("");
    let aidsCanvas;

    onMount(async () => {
        // ==========================================
        // CARGA DE INTEGRACIÓN 1: Proxy REST Countries (EXTERNA)
        // ==========================================
        try {
            const response = await fetch('https://sos2526-12.onrender.com/api/v2/proxy/countries'); 
            if (response.ok) {
                const data = await response.json();
                countriesData = data.slice(0, 15); 
            } else {
                errorMessage = "Error al conectar con el servidor backend.";
            }
        } catch (error) {
            errorMessage = "Error de red o CORS: " + error.message;
        } finally {
            isLoading = false; 
        }

        // ==========================================
        // CARGA DE INTEGRACIÓN 2: G26 IDH (COMPAÑEROS)
        // ==========================================
        try {
            const idhResponse = await fetch('https://sos2526-26.onrender.com/api/v2/countries-idh-per-years');
            if (idhResponse.ok) {
                let idhData = await idhResponse.json(); // Usamos 'let' para poder actualizarlo

                

                if (idhData.length > 0) {
                    const sampleData = idhData.slice(0, 10);
                    const labels = sampleData.map(item => `${item.country} (${item.year})`);
                    const values = sampleData.map(item => item.hdi_value); 

                    new Chart(chartCanvas, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Índice de Desarrollo Humano (IDH)',
                                data: values,
                                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                borderColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 1
                            }]
                        },
                        options: { responsive: true }
                    });
                }
            } else {
                idhErrorMessage = "Error al cargar la API del Grupo 26.";
            }
        } catch (error) {
            idhErrorMessage = "Error con G26: " + error.message;
        }

        // ==========================================
        // CARGA DE INTEGRACIÓN 3: G10 Muertes (COMPAÑEROS)
        // ==========================================
        try {
            const deathsResponse = await fetch('https://sos2526-10.onrender.com/api/v2/deaths-by-risk-factors');
            if (deathsResponse.ok) {
                let data = await deathsResponse.json();

                

                if (data.length > 0) {
                    deathsData = data.slice(0, 6); 
                }
            } else {
                deathsErrorMessage = "Error al cargar la API del Grupo 10.";
            }
        } catch (error) {
            deathsErrorMessage = "Error de red con G10: " + error.message;
        }

        // ==========================================
        // CARGA DE INTEGRACIÓN 4: PokeAPI (EXTERNA)
        // ==========================================
        try {
            const pokeRes = await fetch('https://pokeapi.co/api/v2/pokemon?limit=5');
            if (pokeRes.ok) {
                const pokeList = await pokeRes.json();
                const detailedPokemon = await Promise.all(
                    pokeList.results.map(async (p) => {
                        const res = await fetch(p.url);
                        return await res.json();
                    })
                );
                pokemonData = detailedPokemon;
            } else {
                pokeErrorMessage = "Error al conectar con el servidor de PokeAPI.";
            }
        } catch (error) {
            pokeErrorMessage = "Error de red con PokeAPI: " + error.message;
        }

        // ==========================================
        // CARGA DE INTEGRACIÓN 5: Open-Meteo (EXTERNA)
        // ==========================================
        try {
            const meteoRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.3828&longitude=-5.9732&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FMadrid');
            if (meteoRes.ok) {
                const meteoData = await meteoRes.json();
                
                const dias = meteoData.daily.time; 
                const tempsMax = meteoData.daily.temperature_2m_max;
                const tempsMin = meteoData.daily.temperature_2m_min;

                new Chart(meteoCanvas, {
                    type: 'radar', 
                    data: {
                        labels: dias,
                        datasets: [
                            {
                                label: 'Temp Máxima (°C)',
                                data: tempsMax,
                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                borderColor: 'rgba(255, 99, 132, 1)',
                                borderWidth: 2
                            },
                            {
                                label: 'Temp Mínima (°C)',
                                data: tempsMin,
                                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                borderColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 2
                            }
                        ]
                    },
                    options: { responsive: true }
                });
            } else {
                meteoErrorMessage = "Error al conectar con la API de Open-Meteo.";
            }
        } catch (error) {
            meteoErrorMessage = "Error de red con Meteo: " + error.message;
        }

        // ==========================================
        // CARGA DE INTEGRACIÓN 6: G11 Literacy (COMPAÑEROS)
        // ==========================================
        try {
            const litRes = await fetch('https://sos2526-11.onrender.com/api/v2/literacy-rates');
            if (litRes.ok) {
                let litData = await litRes.json();

                

                if (litData.length > 0) {
                    const sampleData = litData.slice(0, 10);
                    const labels = sampleData.map(item => `${item.country || 'País'} (${item.year || 'Año'})`);
                    const values = sampleData.map(item => item.total);

                    new Chart(litCanvas, {
                        type: 'scatter', // Tipo scatter
                        data: {
                            labels: labels, // Usamos tus etiquetas con el país y el año
                            datasets: [{
                                label: 'Tasa de Alfabetización',
                                data: values,
                                backgroundColor: 'rgba(75, 192, 192, 1)', // Puntos en verde agua
                                borderColor: '#4bc0c0',
                                pointRadius: 6, // Hacemos el punto más gordito para que se vea bien
                                pointHoverRadius: 8
                            }]
                        },
                        options: { 
                            responsive: true,
                            scales: {
                                x: {
                                    type: 'category' // ¡ESTA ES LA MAGIA! Le decimos que use las etiquetas de texto
                                }
                            }
                        }
                    });
                }
            } else {
                litErrorMessage = "Error al cargar la API del Grupo 11.";
            }
        } catch (error) {
            litErrorMessage = "Error de red con G11: " + error.message;
        }

        // ==========================================
        // CARGA DE INTEGRACIÓN 7: G20 Café (COMPAÑEROS)
        // ==========================================
        try {
            const coffeeRes = await fetch('https://sos2526-20.onrender.com/api/v2/coffee-stats');
            if (coffeeRes.ok) {
                let coffeeJson = await coffeeRes.json();

                

                if (coffeeJson.data && coffeeJson.data.length > 0) {
                    const sampleData = coffeeJson.data.slice(0, 5);
                    const labels = sampleData.map(item => `${item.country || 'País'} (${item.year || 'Año'})`);
                    const values = sampleData.map(item => item.production); 

                    new Chart(coffeeCanvas, {
                        type: 'polarArea',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Datos de Café',
                                data: values,
                                backgroundColor: [
                                    'rgba(255, 99, 132, 0.6)',
                                    'rgba(54, 162, 235, 0.6)',
                                    'rgba(255, 206, 86, 0.6)',
                                    'rgba(75, 192, 192, 0.6)',
                                    'rgba(153, 102, 255, 0.6)'
                                ]
                            }]
                        },
                        options: { responsive: true }
                    });
                }
            } else {
                coffeeErrorMessage = "Error al cargar la API del Grupo 20.";
            }
        } catch (error) {
            coffeeErrorMessage = "Error de red con G20: " + error.message;
        }

        // ==========================================
        // CARGA DE INTEGRACIÓN 8: G21 SIDA (COMPAÑEROS)
        // ==========================================
        try {
            // Nota: He usado v1 como confirmamos antes que funcionaba con su API
            const aidsRes = await fetch('https://sos2526-21.onrender.com/api/v2/aids-deaths-stats');
            if (aidsRes.ok) {
                let aidsData = await aidsRes.json();

                

                if (aidsData.length > 0) {
                    const sampleData = aidsData.slice(0, 5);
                    const labels = sampleData.map(item => `${item.country} (${item.year})`);                
                    const values = sampleData.map(item => 
                        (item.death_count_hiv_aids_under_5 || 0) + 
                        (item.death_count_hiv_aids_5_14 || 0) + 
                        (item.death_count_hiv_aids_15_49 || 0) + 
                        (item.death_count_hiv_aids_50_69 || 0) + 
                        (item.death_count_hiv_aids_70_plus || 0)
                    );

                    new Chart(aidsCanvas, {
                        type: 'doughnut',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Muertes registradas',
                                data: values,
                                backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0'],
                                hoverOffset: 4
                            }]
                        },
                        options: { responsive: true }
                    });
                }
            } else {
                aidsErrorMessage = "Error al cargar la API del Grupo 21.";
            }
        } catch (error) {
            aidsErrorMessage = "Error de red con G21: " + error.message;
        }
    });
</script>

<main>
    <h2>Mis Integraciones - Javier</h2>

    <section class="integration-block">
        <h3>1. Integración con REST Countries (Vía Proxy)</h3>
        <p><strong>Tipo:</strong> Uso Textual (Tabla) | <strong>API Externa:</strong> restcountries.com</p>

        {#if isLoading}
            <p>Cargando datos de países...</p>
        {:else if errorMessage}
            <p style="color: red;">{errorMessage}</p>
        {:else}
            <!-- USO TEXTUAL: Renderizamos los datos en una tabla -->
            <table class="styled-table">
                <thead>
                    <tr>
                        <th>País (Nombre Común)</th>
                        <th>Región</th>
                        <th>Población</th>
                    </tr>
                </thead>
                <tbody>
                    {#each countriesData as country}
                        <tr>
                            <td>{country.name?.common || 'Desconocido'}</td>
                            <td>{country.region || 'N/A'}</td>
                            <td>{country.population?.toLocaleString() || 0}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </section>

    <section class="integration-block">
        <h3>2. Integración con Grupo 26 (IDH)</h3>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - Barras) | <strong>API Compañeros:</strong> countries-idh-per-years</p>

        {#if idhErrorMessage}
            <p style="color: red;">{idhErrorMessage}</p>
        {:else}
            <!-- Aquí es donde Chart.js dibujará la gráfica -->
            <div style="max-width: 800px; margin: 0 auto;">
                <canvas bind:this={chartCanvas}></canvas>
            </div>
        {/if}
    </section>

    <section class="integration-block">
        <h3>3. Integración con Grupo 10 (Factores de Riesgo)</h3>
        <p><strong>Tipo:</strong> Uso Textual (Tarjetas HTML) | <strong>API Compañeros:</strong> deaths-by-risk-factors</p>

        {#if deathsErrorMessage}
            <p style="color: red;">{deathsErrorMessage}</p>
        {:else if deathsData.length === 0}
            <p>Cargando datos de salud...</p>
        {:else}
            <div class="cards-container">
                {#each deathsData as item}
                    <div class="card">
                        <!-- Han usado 'entity' en lugar de 'country' -->
                        <h4>{item.entity || 'Desconocido'} ({item.year || 'N/A'})</h4>
                        <ul>
                            <li><strong>Contaminación del Aire:</strong> 
                                {item.air_pollution ? Math.round(item.air_pollution).toLocaleString() : 'N/A'}
                            </li>
                            <li><strong>Presión Arterial Alta:</strong> 
                                {item.high_systolic_blood_pressure ? Math.round(item.high_systolic_blood_pressure).toLocaleString() : 'N/A'}
                            </li>
                            <li><strong>Glucosa Alta:</strong> 
                                {item.high_fasting_plasma_glucose ? Math.round(item.high_fasting_plasma_glucose).toLocaleString() : 'N/A'}
                            </li>
                        </ul>
                    </div>
                {/each}
            </div>
        {/if}
    </section>

    <section class="integration-block">
        <h3>4. Integración con PokeAPI</h3>
        <p><strong>Tipo:</strong> Uso Textual (Tarjetas con Imágenes) | <strong>API Externa:</strong> pokeapi.co</p>

        {#if pokeErrorMessage}
            <p style="color: red;">{pokeErrorMessage}</p>
        {:else if pokemonData.length === 0}
            <p>Capturando Pokémon en la hierba alta...</p>
        {:else}
            <div class="poke-container">
                {#each pokemonData as poke}
                    <div class="poke-card">
                        <!-- Sacamos el sprite (la fotito) del Pokémon -->
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
        <h3>5. Integración con Open-Meteo (Clima 7 días)</h3>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - Radar) | <strong>API Externa:</strong> open-meteo.com</p>

        {#if meteoErrorMessage}
            <p style="color: red;">{meteoErrorMessage}</p>
        {:else}
            <!-- Lo metemos en un div un poco más pequeño (600px) para que el radar no ocupe toda la pantalla y se vea más estético -->
            <div style="max-width: 600px; margin: 0 auto;">
                <canvas bind:this={meteoCanvas}></canvas>
            </div>
        {/if}
    </section>

    <section class="integration-block">
        <h3>6. Integración con Grupo 11 (Alfabetización)</h3>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - scatter) | <strong>API Compañeros:</strong> literacy-rates</p>

        {#if litErrorMessage}
            <p style="color: red;">{litErrorMessage}</p>
        {:else}
            <div style="max-width: 800px; margin: 0 auto;">
                <canvas bind:this={litCanvas}></canvas>
            </div>
        {/if}
    </section>



    <section class="integration-block">
        <h3>7. Integración con Grupo 20 (Estadísticas de Café)</h3>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - Polar Area) | <strong>API Compañeros:</strong> coffee-stats</p>

        {#if coffeeErrorMessage}
            <p style="color: red;">{coffeeErrorMessage}</p>
        {:else}
            <div style="max-width: 500px; margin: 0 auto;">
                <canvas bind:this={coffeeCanvas}></canvas>
            </div>
        {/if}
    </section>


    <section class="integration-block">
        <h3>8. Integración con Grupo 21 (Muertes por SIDA)</h3>
        <p><strong>Tipo:</strong> Widget Gráfico (Chart.js - Doughnut) | <strong>API Compañeros:</strong> aids-deaths-stats</p>

        {#if aidsErrorMessage}
            <p style="color: red;">{aidsErrorMessage}</p>
        {:else}
            <div style="max-width: 400px; margin: 0 auto;">
                <canvas bind:this={aidsCanvas}></canvas>
            </div>
        {/if}
    </section>
    
</main>

<style>
    
    main {
        padding: 20px;
        font-family: Arial, sans-serif;
    }
    .integration-block {
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 30px;
        background-color: #f9f9f9;
    }
    .styled-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
    }
    .styled-table th, .styled-table td {
        border: 1px solid #ddd;
        padding: 10px;
        text-align: left;
    }
    .styled-table th {
        background-color: #007BFF;
        color: white;
    }
    .styled-table tr:nth-child(even) {
        background-color: #f2f2f2;
    }
    .cards-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 15px;
    }
    .card {
        background-color: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: transform 0.2s;
    }
    .card:hover {
        transform: translateY(-5px);
    }
    .card h4 {
        margin-top: 0;
        color: #d9534f;
        border-bottom: 2px solid #eee;
        padding-bottom: 10px;
    }
    .card ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }
    .card li {
        margin-bottom: 8px;
        font-size: 0.9em;
    }
    .poke-container {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
        margin-top: 15px;
    }
    .poke-card {
        background-color: #f0f8ff; /* Azul clarito */
        border: 2px solid #add8e6;
        border-radius: 10px;
        padding: 10px;
        text-align: center;
        width: 150px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: transform 0.2s;
    }
    .poke-card:hover {
        transform: scale(1.05); /* Efecto zoom al pasar el ratón */
    }
    .poke-card img {
        width: 96px;
        height: 96px;
        background-color: white;
        border-radius: 50%; /* Círculo blanco detrás del Pokémon */
        margin-bottom: 10px;
        border: 1px solid #ddd;
    }
    .poke-card h4 {
        margin: 5px 0;
        color: #333;
    }
</style>