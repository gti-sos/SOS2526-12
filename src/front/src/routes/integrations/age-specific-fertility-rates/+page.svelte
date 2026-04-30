<svelte:head>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/highcharts-more.js"></script> 
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js"></script>
    <script src="https://code.highcharts.com/modules/heatmap.js"></script>
</svelte:head>

<main>
    <header>
        <h1>Panel de Integraciones SOS</h1>
        <p>Visualización de Datos Cruzados: Fertilidad, Fatalidades y Cólera</p>
    </header>

    <div class="container">
        <section class="card">
            <div id="chart-fatalities"></div>
            <div class="description">
                <h3>Integración 1: Road Fatalities (G11)</h3>
                <p>
                    Esta gráfica cruza mis datos de <strong>Fertilidad (15-19)</strong> con las 
                    <strong>Muertes Viales</strong> del Grupo 11. <br>
                    <em>*Datos obtenidos a través de mi propio proxy (`/api/v2/proxy-sos-1`).</em>
                </p>
            </div>
        </section>

        <section class="card">
            <div id="chart-cholera"></div>
            <div class="description">
                <h3>Integración 2: Impacto del Cólera</h3>
                <p>
                    Gráfico de burbujas empaquetadas agrupadas por continentes/regiones de la OMS. 
                    Cruza <strong>Tasa de Fertilidad</strong> (tamaño de la burbuja) con <strong>Mortalidad por Cólera</strong>. <br>
                    <em>*¡Prueba a arrastrar las burbujas con el ratón!</em>
                </p>
            </div>
        </section>

    <section class="card">
        <div id="chart-happiness-heatmap"></div>
        <div class="description">
            <h3>Integración 3: Evolución de la Felicidad por Año</h3>
            <p>
                Mapa de calor que muestra el <strong>Índice de Felicidad</strong> entre 2020 y 2023. 
                Al pasar el cursor, se cruza con mis datos de <strong>Fertilidad</strong> y el GDP de cada país.
            </p>
        </div>
    </section>


    <section class="card">
        <div id="chart-wine-radar"></div>
        <div class="description">
            <h3>Integración 4: Perfil de Fertilidad vs. Consumo de Vino</h3>
            <p>
                Gráfico de Radar (Araña) que compara el "perfil" de cada país cruzando mi <strong>Tasa de Fertilidad</strong> con el <strong>Precio Medio del Vino (€)</strong> y los <strong>Grados de Alcohol (ABV)</strong> de la API del Grupo 29.
            </p>
        </div>
    </section>

    </div>
</main>

<script>
    import { onMount } from "svelte";

    // --- CONFIGURACIÓN DE ENDPOINTS ---
    // Tu API propia en Render:
    const MY_API_URL = "https://sos2526-12.onrender.com/api/v2/age-specific-fertility-rates";
    
    // TU PROXY 1 (G11):
    const G11_PROXY_URL = "https://sos2526-12.onrender.com/api/v2/proxy-sos-1"; 

    // API CÓLERA (Sustituye esto por la URL real asegurando que empieza por https://)
    const CHOLERA_API_URL = "https://soporte-sos.onrender.com/api/v1/cholera-stats"; 

    // @ts-ignore
    let matchedFatalities = [];

    onMount(async () => {
        console.log("Iniciando carga de datos...");
        await loadInitialDataSilently();
        
        // Ejecutamos ambas integraciones en paralelo
        await fetchAndMatchData();
        await fetchAndMatchCholeraPacked();
        await fetchAndMatchHappiness();
        await fetchAndMatchWine();

        if (matchedFatalities.length > 0) {
            drawFatalitiesChart();
        } else {
            console.error("No hay datos suficientes para generar la gráfica de Fatalities.");
        }
    });

    async function loadInitialDataSilently() {
        // Inicializamos solo tu API directa
        try {
            const res = await fetch(`${MY_API_URL}/loadinitialdata`);
            if (res.ok) console.log("✅ Inicialización propia lista.");
        } catch (e) {
            console.warn("⚠️ Aviso al inicializar datos:", e);
        }
    }

    // --- LÓGICA INTEGRACIÓN 1 (ROAD FATALITIES) ---
    async function fetchAndMatchData() {
        try {
            const [resMine, resG11] = await Promise.all([
                fetch(MY_API_URL),
                fetch(G11_PROXY_URL)
            ]);

            if (resMine.ok && resG11.ok) {
                const myData = await resMine.json();
                const g11Data = await resG11.json();

                const uniqueMatches = {};

                // @ts-ignore
                myData.forEach(myRecord => {
                    const countryLower = myRecord.country_name.toLowerCase();
                    // @ts-ignore
                    const countryInG11 = g11Data.filter(g => g.nation.toLowerCase() === countryLower);

                    if (countryInG11.length > 0) {
                        // @ts-ignore
                        const mostRecent = countryInG11.sort((a, b) => b.year - a.year)[0];
                        // @ts-ignore
                        uniqueMatches[countryLower] = {
                            country: myRecord.country_name,
                            fertility: myRecord.fert_15_19,
                            deaths: mostRecent.total_death,
                            year: mostRecent.year
                        };
                    }
                });

                matchedFatalities = Object.values(uniqueMatches);
                console.log("Cruce de datos 1 finalizado con éxito a través del proxy.");
            } else {
                console.error(`Error en respuestas I1: Mis datos ${resMine.status}, Proxy ${resG11.status}`);
            }
        } catch (error) {
            console.error("Error crítico en el fetch I1:", error);
        }
    }

    function drawFatalitiesChart() {
        // @ts-ignore
        Highcharts.chart('chart-fatalities', {
            chart: { type: 'column', backgroundColor: 'transparent' },
            title: { text: 'Impacto Vial vs. Fertilidad Juvenil' },
            // @ts-ignore
            xAxis: { categories: matchedFatalities.map(d => d.country), crosshair: true },
            yAxis: [
                { title: { text: 'Muertes en Tráfico', style: { color: '#ef4444' } }, labels: { style: { color: '#ef4444' } } }, 
                { title: { text: 'Tasa Fertilidad (15-19)', style: { color: '#0ea5e9' } }, labels: { style: { color: '#0ea5e9' } }, opposite: true }
            ],
            tooltip: { 
                shared: true,
                formatter: function() {
                    let s = `<b>${this.x}</b>`;
                    // @ts-ignore
                    this.points.forEach(point => { s += `<br/><span style="color:${point.color}">\u25CF</span> ${point.series.name}: <b>${point.y}</b>`; });
                    // @ts-ignore
                    const info = matchedFatalities.find(d => d.country === this.x);
                    s += `<br/><small>Año de datos viales: ${info.year}</small>`;
                    return s;
                }
            },
            series: [
                // @ts-ignore
                { name: 'Muertes Totales', data: matchedFatalities.map(d => d.deaths), color: '#ef4444' },
                // @ts-ignore
                { name: 'Tasa Fertilidad', type: 'spline', yAxis: 1, data: matchedFatalities.map(d => d.fertility), color: '#0ea5e9' }
            ]
        });
    }

    // --- LÓGICA INTEGRACIÓN 2 (CÓLERA BUBBLES) ---
    async function fetchAndMatchCholeraPacked() {
        try {
            const [resMine, resCholera] = await Promise.all([
                fetch(MY_API_URL),
                fetch(CHOLERA_API_URL)
            ]);

            if (resMine.ok && resCholera.ok) {
                const myData = await resMine.json();
                const choleraData = await resCholera.json();

                const regions = {};
                const uniqueMatches = new Set(); 

                // @ts-ignore
                myData.forEach(myRecord => {
                    const countryLower = myRecord.country_name.toLowerCase();
                    // @ts-ignore
                    const countryInCholera = choleraData.filter(c => (c.country || "").toLowerCase() === countryLower);

                    if (countryInCholera.length > 0 && !uniqueMatches.has(countryLower)) {
                        uniqueMatches.add(countryLower);
                        // @ts-ignore
                        const mostRecent = countryInCholera.sort((a, b) => b.year - a.year)[0];
                        
                        const regionName = mostRecent.whoRegion || "Other";

                        // @ts-ignore
                        if (!regions[regionName]) {
                            // @ts-ignore
                            regions[regionName] = [];
                        }

                        // @ts-ignore
                        regions[regionName].push({
                            name: myRecord.country_name,
                            value: myRecord.fert_15_19, // Tamaño de la burbuja
                            fatality: mostRecent.fatalityRate || 0,
                            cases: mostRecent.reportedCases || 0,
                            year: mostRecent.year
                        });
                    }
                });

                const seriesData = Object.keys(regions).map(region => ({
                    name: region,
                    // @ts-ignore
                    data: regions[region]
                }));

                console.log("Cruce de datos 2 (Cólera) finalizado con éxito.");
                if (seriesData.length > 0) {
                    drawCholeraPackedBubble(seriesData);
                } else {
                    console.error("No hay datos cruzados suficientes para el Cólera.");
                }
            } else {
                console.error(`Error en respuestas I2: Mis datos ${resMine.status}, Cólera ${resCholera.status}`);
            }
        } catch (error) {
            console.error("Error cruzando datos con Cólera:", error);
        }
    }

    // @ts-ignore
    function drawCholeraPackedBubble(seriesData) {
        // @ts-ignore
        Highcharts.chart('chart-cholera', {
            chart: {
                type: 'packedbubble',
                height: '500px',
                backgroundColor: 'transparent'
            },
            title: {
                text: 'Impacto Global: Fertilidad Adolescente vs. Casos de Cólera'
            },
            subtitle: {
                text: 'Agrupado por región OMS. El tamaño indica la Tasa de Fertilidad.'
            },
            tooltip: {
                useHTML: true,
                pointFormat: `<b>{point.name}</b><br/>
                              Tasa Fertilidad: <b>{point.value}</b><br/>
                              Mortalidad Cólera: <b>{point.fatality}%</b><br/>
                              Casos reportados: <b>{point.cases}</b>`
            },
            plotOptions: {
                packedbubble: {
                    minSize: '20%',
                    maxSize: '100%',
                    zMin: 0,
                    zMax: 1000,
                    layoutAlgorithm: {
                        splitSeries: true, 
                        gravitationalConstant: 0.02
                    },
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}',
                        filter: {
                            property: 'y',
                            operator: '>',
                            value: 15
                        },
                        style: {
                            color: 'black',
                            textOutline: 'none',
                            fontWeight: 'normal'
                        }
                    }
                }
            },
            series: seriesData
        });
    }

    
    const HAPPINESS_API_URL = "https://sos2526-15.onrender.com/api/v2/happiness-indices";
    let heatmapYears = [2020, 2021, 2022, 2023];
    // @ts-ignore
    let heatmapCountries = [];

    // @ts-ignore
    async function fetchAndMatchHappiness() {
        try {
            const [resMine, resHappy] = await Promise.all([
                fetch(MY_API_URL),
                fetch(HAPPINESS_API_URL)
            ]);

            if (resMine.ok && resHappy.ok) {
                const myData = await resMine.json();
                const happyData = await resHappy.json();

                // 1. Sacamos los países que coinciden en ambas APIs
                // @ts-ignore
                const myCountryNames = myData.map(d => d.country_name.toLowerCase());
                // @ts-ignore
                const happyCountryNames = [...new Set(happyData.map(d => d.country.toLowerCase()))];
                
                const commonCountries = happyCountryNames.filter(c => myCountryNames.includes(c));
                
                // Formateamos los nombres para el Eje Y (Primera letra mayúscula)
                heatmapCountries = commonCountries.map(c => c.charAt(0).toUpperCase() + c.slice(1));

                // 2. Preparamos los datos en el formato [x (año), y (país), valor]
                // @ts-ignore
                let seriesData = [];

                heatmapCountries.forEach((countryName, yIndex) => {
                    heatmapYears.forEach((year, xIndex) => {
                        // Buscamos el dato de felicidad de ese año
                        // @ts-ignore
                        const happyRecord = happyData.find(h => 
                            h.country.toLowerCase() === countryName.toLowerCase() && h.year === year
                        );
                        // Buscamos tu dato de fertilidad
                        // @ts-ignore
                        const myRecord = myData.find(m => 
                            m.country_name.toLowerCase() === countryName.toLowerCase()
                        );

                        if (happyRecord) {
                            seriesData.push({
                                x: xIndex,
                                y: yIndex,
                                value: happyRecord.happiness_score,
                                gdp: happyRecord.gdp_per_capita,
                                fertility: myRecord ? myRecord.fert_15_19 : 'N/A'
                            });
                        }
                    });
                });

                if (seriesData.length > 0) {
                    // @ts-ignore
                    drawHappinessHeatmap(seriesData);
                    console.log("Cruce de datos 3 (Felicidad) finalizado con éxito.");
                } else {
                    console.error("No hay datos comunes para el Heatmap.");
                }
            }
        } catch (error) {
            console.error("Error cruzando datos con Felicidad:", error);
        }
    }

    // @ts-ignore
    function drawHappinessHeatmap(seriesData) {
        // @ts-ignore
        Highcharts.chart('chart-happiness-heatmap', {
            chart: {
                type: 'heatmap',
                marginTop: 40,
                marginBottom: 80,
                plotBorderWidth: 1,
                backgroundColor: 'transparent'
            },
            title: {
                text: 'Mapa de Calor: Felicidad Global (2020-2023)'
            },
            xAxis: {
                categories: heatmapYears,
                title: { text: 'Año' }
            },
            yAxis: {
                // @ts-ignore
                categories: heatmapCountries,
                title: null,
                reversed: true // Para que empiece de arriba hacia abajo
            },
            colorAxis: {
                min: 4, // Basado en los scores mínimos de tu JSON (aprox 4.9)
                max: 8, // Basado en los máximos (aprox 7.8)
                minColor: '#f8fafc', // Color muy claro para baja felicidad
                maxColor: '#10b981'  // Verde esmeralda para alta felicidad
            },
            legend: {
                align: 'right',
                layout: 'vertical',
                margin: 0,
                verticalAlign: 'top',
                y: 25,
                symbolHeight: 280
            },
            tooltip: {
                useHTML: true,
                formatter: function () {
                    // @ts-ignore
                    return `<b>${this.series.yAxis.categories[this.point.y]} (${this.series.xAxis.categories[this.point.x]})</b><br/>
                            Índice de Felicidad: <b>${this.
// @ts-ignore
                            point.value}</b><br/>
                            GDP per cápita: <b>${this.
// @ts-ignore
                            point.gdp}</b><br/>
                            <i>Tasa Fertilidad: <b>${this.
// @ts-ignore
                            point.fertility}</b></i>`;
                }
            },
            series: [{
                name: 'Felicidad',
                borderWidth: 1,
                data: seriesData,
                dataLabels: {
                    enabled: true,
                    color: '#000000',
                    format: '{point.value:.2f}' // Muestra el número con 2 decimales en la casilla
                }
            }]
        });
    }


// --- ENDPOINT DEL VINO ---
    const WINE_API_URL = "https://sos2526-29.onrender.com/api/v1/wine-stats";

    // @ts-ignore
    async function fetchAndMatchWine() {
        try {
            // Si quieres forzar la carga inicial de ellos por si acaso está vacía:
            await fetch(`${WINE_API_URL}/loadinitialdata`).catch(() => {});

            const [resMine, resWine] = await Promise.all([
                fetch(MY_API_URL),
                fetch(WINE_API_URL)
            ]);

            if (resMine.ok && resWine.ok) {
                const myData = await resMine.json();
                const wineData = await resWine.json();

                // 1. Agrupamos los vinos por país y calculamos las medias
                const wineStatsByCountry = {};
                // @ts-ignore
                wineData.forEach(w => {
                    const countryLower = (w.country || "").toLowerCase();
                    // @ts-ignore
                    if (!wineStatsByCountry[countryLower]) {
                        // @ts-ignore
                        wineStatsByCountry[countryLower] = { sumPrice: 0, sumAbv: 0, count: 0 };
                    }
                    // @ts-ignore
                    wineStatsByCountry[countryLower].sumPrice += w.price;
                    // @ts-ignore
                    wineStatsByCountry[countryLower].sumAbv += w.abv;
                    // @ts-ignore
                    wineStatsByCountry[countryLower].count++;
                });

                // 2. Extraemos el dato más reciente de tu fertilidad por país
                const myLatestFertility = {};
                // @ts-ignore
                myData.forEach(m => {
                    const c = m.country_name.toLowerCase();
                    // @ts-ignore
                    if (!myLatestFertility[c] || myLatestFertility[c].year < m.year) {
                        // @ts-ignore
                        myLatestFertility[c] = m;
                    }
                });

                // 3. Cruzamos los datos y los preparamos para el Radar
                const seriesData = [];

                for (const [country, myRecord] of Object.entries(myLatestFertility)) {
                    // @ts-ignore
                    if (wineStatsByCountry[country]) {
                        // @ts-ignore
                        const stats = wineStatsByCountry[country];
                        const avgPrice = stats.sumPrice / stats.count;
                        const avgAbv = stats.sumAbv / stats.count;

                        seriesData.push({
                            name: myRecord.country_name,
                            data: [
                                myRecord.fert_15_19,                 // Punta 1: Fertilidad
                                parseFloat(avgPrice.toFixed(2)),     // Punta 2: Precio medio
                                parseFloat(avgAbv.toFixed(2))        // Punta 3: Alcohol medio
                            ],
                            pointPlacement: 'on'
                        });
                    }
                }

                if (seriesData.length > 0) {
                    drawWineRadarChart(seriesData);
                    console.log("Cruce de datos 4 (Vino) finalizado con éxito.");
                } else {
                    console.error("No hay países en común para la gráfica del Vino.");
                }
            }
        } catch (error) {
            console.error("Error cruzando datos con el Vino:", error);
        }
    }

    // @ts-ignore
    function drawWineRadarChart(seriesData) {
        // @ts-ignore
        Highcharts.chart('chart-wine-radar', {
            chart: {
                polar: true,
                type: 'line',
                backgroundColor: 'transparent'
            },
            title: {
                text: 'Análisis Multidimensional: Vino vs Fertilidad',
                x: -50
            },
            pane: {
                size: '80%'
            },
            xAxis: {
                categories: [
                    'Tasa de Fertilidad (15-19 años)', 
                    'Precio Medio Vino (€)', 
                    'Alcohol Medio (% ABV)'
                ],
                tickmarkPlacement: 'on',
                lineWidth: 0
            },
            yAxis: {
                gridLineInterpolation: 'polygon',
                lineWidth: 0,
                min: 0
            },
            tooltip: {
                shared: true,
                pointFormat: '<span style="color:{series.color}">{series.name}: <b>{point.y}</b><br/>'
            },
            legend: {
                align: 'right',
                verticalAlign: 'middle',
                layout: 'vertical'
            },
            series: seriesData,
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        legend: {
                            align: 'center',
                            verticalAlign: 'bottom',
                            layout: 'horizontal'
                        },
                        pane: {
                            size: '70%'
                        }
                    }
                }]
            }
        });
    }

    
</script>

<style>
    :global(body) { background-color: #f8fafc; margin: 0; font-family: system-ui, sans-serif; }
    header { background-color: #0f172a; color: white; text-align: center; padding: 3rem 1rem; margin-bottom: 2rem; }
    .container { max-width: 1000px; margin: 0 auto; padding: 0 1rem; display: flex; flex-direction: column; gap: 2rem; padding-bottom: 3rem;}
    .card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    #chart-fatalities, #chart-cholera { width: 100%; height: 500px; }
    .description { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
    h3 { margin: 0 0 0.5rem 0; color: #1e293b; }
    p { color: #64748b; font-size: 0.95rem; }
</style>