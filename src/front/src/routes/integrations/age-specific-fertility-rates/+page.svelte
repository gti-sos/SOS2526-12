<svelte:head>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/highcharts-more.js"></script> 
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js"></script>
    <script src="https://code.highcharts.com/modules/heatmap.js"></script>
    <script src="https://code.highcharts.com/modules/treemap.js"></script>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/sankey.js"></script>
    <script src="https://code.highcharts.com/modules/item-series.js"></script>
</svelte:head>

<main>
    <header>
        <h1>Panel de Integraciones SOS</h1>
        <p>Visualización de Datos Cruzados: Fertilidad, Fatalidades, Cólera y Más</p>
    </header>

    <div class="container">
        <section class="card">
            <div id="chart-fatalities"></div>
            <div class="description">
                <h3>Integración 1: Road Fatalities (G11)</h3>
                <p>
                    Esta gráfica cruza mis datos de <strong>Fertilidad (15-19)</strong> con las 
                    <strong>Muertes Viales</strong> del Grupo 11. <br>
                    
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

        <section class="card">
            <div id="chart-area-treemap"></div>
            <div class="description">
                <h3>Integración 5: Extensión Territorial vs. Fertilidad (API Pública)</h3>
                <p>
                    <strong>Treemap:</strong> El tamaño del cuadro representa el <strong>Área del país (km²)</strong> y el color indica mi <strong>Tasa de Fertilidad</strong>. Datos obtenidos en tiempo real desde la API pública de RestCountries.
                </p>
            </div>
        </section>

    <section class="card">
        <div id="chart-universities-sankey" style="width: 100%; height: 500px;"></div>
        <div class="description">
            <h3>Integración 6: Flujo Educación -> Fertilidad</h3>
            <p>
                Este **Sankey Chart** muestra cómo se distribuyen los países según su tasa de matriculación universitaria (izquierda) y su impacto en la fertilidad juvenil (derecha).
            </p>
        </div>
    </section>


    <section class="card">
        <div id="chart-labor-parliament" style="width: 100%; height: 450px;"></div>
        <div class="description">
            <h3>Integración 7: Participación Laboral Femenina vs. Fertilidad</h3>
            <p>
                <strong>Gráfico de Hemiciclo:</strong> Cada "escaño" representa un país, agrupados en bancadas según el porcentaje de mujeres en la fuerza laboral (Datos: <em>World Bank API</em>). Al pasar el cursor, se observa la <strong>Tasa de Fertilidad media</strong> de cada grupo, demostrando la correlación sociológica.
            </p>
        </div>
    </section>



    </div>
</main>

<script>

    import { onMount } from "svelte";

    // --- CONFIGURACIÓN DE ENDPOINTS ---
    const MY_API_URL = "https://sos2526-12.onrender.com/api/v2/age-specific-fertility-rates";
 
    const G11_API_URL = "https://sos2526-11.onrender.com/api/v2/road-fatalities"; 
    
    const CHOLERA_API_URL = "https://soporte-sos.onrender.com/api/v1/cholera-stats"; 
    const HAPPINESS_API_URL = "https://sos2526-15.onrender.com/api/v2/happiness-indices";
    const WINE_API_URL = "https://sos2526-29.onrender.com/api/v1/wine-stats";
    
    const RESTCOUNTRIES_API_URL = "https://restcountries.com/v3.1/all?fields=name,area"; 

    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    const UNIVERSITIES_API_URL = "https://universities.hipolabs.com/search?country=";

    // La API del Banco Mundial para el % de mujeres en la fuerza laboral
    const WORLDBANK_LABOR_API = "https://api.worldbank.org/v2/country/all/indicator/SL.TLF.CACT.FE.ZS?format=json&date=2022&per_page=300";

    // @ts-ignore
    let matchedFatalities = [];

    onMount(async () => {
        console.log("Iniciando carga de datos...");
        
        // 1. Cargamos datos iniciales de todas las APIs que lo necesiten
        await loadInitialDataSilently();
        
        // 2. Ejecutamos todas las integraciones en paralelo
        await fetchAndMatchData(); 
        await fetchAndMatchCholeraPacked();
        await fetchAndMatchHappiness();
        await fetchAndMatchWine();
        await fetchAndMatchArea(); 
        await fetchAndDrawSankey();
        await fetchAndDrawParliament();

        // Dibujar Fatalities si hay datos
        if (matchedFatalities.length > 0) {
            drawFatalitiesChart();
        } else {
            console.error("No hay datos suficientes para generar la gráfica de Fatalities.");
        }
    });

// Función inteligente que comprueba antes de intentar cargar
    // @ts-ignore
    async function checkAndLoad(apiUrl) {
        try {
            // 1. Preguntamos si ya hay datos (haciendo un GET normal a la API)
            const checkRes = await fetch(apiUrl);
            
            if (checkRes.ok) {
                const data = await checkRes.json();
                // Si ya hay datos (array con más de 0 elementos), NO hacemos la carga.
                if (data.length > 0) {
                    return; // Salimos silenciosamente sin hacer el loadinitialdata
                }
            }

            // 2. Si llegamos aquí, es que no hay datos. Ahora sí llamamos a cargar.
            await fetch(`${apiUrl}/loadinitialdata`);
            
        } catch (e) {
            // Si el servidor está caído, lo ignoramos para que no rompa la página
        }
    }

    async function loadInitialDataSilently() {
        console.log("⏳ Verificando y cargando bases de datos si están vacías...");
        
        // Comprobamos y cargamos una por una, solo si es necesario
        await checkAndLoad(MY_API_URL);
        await checkAndLoad(G11_API_URL);
        await checkAndLoad(WINE_API_URL);
        await checkAndLoad(HAPPINESS_API_URL);
        await checkAndLoad(CHOLERA_API_URL);
        
        console.log("✅ Inicialización de bases de datos completada.");
    }

    
    async function fetchAndMatchData() {
        try {
            const [resMine, resG11] = await Promise.all([
                fetch(MY_API_URL),
                fetch(G11_API_URL) // <-- Petición directa a su API
            ]);

            if (resMine.ok && resG11.ok) {
                const myData = await resMine.json();
                const g11Data = await resG11.json();

                const uniqueMatches = {};

                // @ts-ignore
                myData.forEach(myRecord => {
                    const countryLower = myRecord.country_name.toLowerCase();
                    // @ts-ignore
                    const countryInG11 = g11Data.filter(g => (g.nation || g.country || "").toLowerCase() === countryLower);

                    if (countryInG11.length > 0) {
                        // @ts-ignore
                        const mostRecent = countryInG11.sort((a, b) => b.year - a.year)[0];
                        // @ts-ignore
                        uniqueMatches[countryLower] = {
                            country: myRecord.country_name,
                            fertility: myRecord.fert_15_19,
                            deaths: mostRecent.total_death || mostRecent.deaths || 0,
                            year: mostRecent.year
                        };
                    }
                });

                matchedFatalities = Object.values(uniqueMatches);
                console.log("Cruce de datos 1 (Fatalities) finalizado con éxito sin proxy.");
            } else {
                console.error(`Error en respuestas I1: Mis datos ${resMine.status}, G11 ${resG11.status}`);
            }
        } catch (error) {
            console.error("Error crítico en el fetch I1 (CORS):", error);
        }
    }

function drawFatalitiesChart() {
        // @ts-ignore
        Highcharts.chart('chart-fatalities', {
            chart: { 
                type: 'area', 
                backgroundColor: 'transparent' 
            },
            title: { text: 'Impacto Vial vs. Fertilidad Juvenil' },
            xAxis: { 
                // @ts-ignore
                categories: matchedFatalities.map(d => d.country), 
                crosshair: true 
            },
            yAxis: [
                { 
                    title: { text: 'Muertes en Tráfico', style: { color: '#ef4444' } }, 
                    labels: { style: { color: '#ef4444' } } 
                }, 
                { 
                    title: { text: 'Tasa Fertilidad (15-19)', style: { color: '#0ea5e9' } }, 
                    labels: { style: { color: '#0ea5e9' } }, 
                    opposite: true // Pone este eje a la derecha
                }
            ],
            tooltip: { 
                shared: true,
                formatter: function() {
                    let s = `<b>${this.x}</b>`;
                    // @ts-ignore
                    this.points.forEach(point => { 
                        s += `<br/><span style="color:${point.color}">\u25CF</span> ${point.series.name}: <b>${point.y}</b>`; 
                    });
                    // @ts-ignore
                    const info = matchedFatalities.find(d => d.country === this.x);
                    if (info) s += `<br/><small>Año de datos viales: ${info.year}</small>`;
                    return s;
                }
            },
            plotOptions: {
                area: {
                    fillOpacity: 0.4, // Transparencia para que se vean ambas áreas superpuestas
                    marker: {
                        enabled: true,
                        symbol: 'circle',
                        radius: 3
                    }
                }
            },
            series: [
                { 
                    name: 'Muertes Totales', 
                    // @ts-ignore
                    data: matchedFatalities.map(d => d.deaths), 
                    color: '#ef4444' // Rojo
                },
                { 
                    name: 'Tasa Fertilidad', 
                    yAxis: 1, 
                    // @ts-ignore
                    data: matchedFatalities.map(d => d.fertility), 
                    color: '#0ea5e9' // Azul
                }
            ]
        });
    }

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
                        if (!regions[regionName]) regions[regionName] = [];

                        // @ts-ignore
                        regions[regionName].push({
                            name: myRecord.country_name,
                            value: myRecord.fert_15_19,
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

                if (seriesData.length > 0) drawCholeraPackedBubble(seriesData);
            }
        } catch (error) {
            console.error("Error cruzando datos con Cólera:", error);
        }
    }

    // @ts-ignore
    function drawCholeraPackedBubble(seriesData) {
        // @ts-ignore
        Highcharts.chart('chart-cholera', {
            chart: { type: 'packedbubble', height: '500px', backgroundColor: 'transparent' },
            title: { text: 'Impacto Global: Fertilidad Adolescente vs. Casos de Cólera' },
            subtitle: { text: 'Agrupado por región OMS. El tamaño indica la Tasa de Fertilidad.' },
            tooltip: {
                useHTML: true,
                pointFormat: `<b>{point.name}</b><br/>Tasa Fertilidad: <b>{point.value}</b><br/>Mortalidad Cólera: <b>{point.fatality}%</b><br/>Casos reportados: <b>{point.cases}</b>`
            },
            plotOptions: {
                packedbubble: {
                    minSize: '20%', maxSize: '100%', zMin: 0, zMax: 1000,
                    layoutAlgorithm: { splitSeries: true, gravitationalConstant: 0.02 },
                    dataLabels: { enabled: true, format: '{point.name}', filter: { property: 'y', operator: '>', value: 15 }, style: { color: 'black', textOutline: 'none', fontWeight: 'normal' } }
                }
            },
            series: seriesData
        });
    }

    // --- LÓGICA INTEGRACIÓN 3 (FELICIDAD HEATMAP) ---
    let heatmapYears = [2020, 2021, 2022, 2023];
    // @ts-ignore
    let heatmapCountries = [];

    async function fetchAndMatchHappiness() {
        try {
            const [resMine, resHappy] = await Promise.all([
                fetch(MY_API_URL), fetch(HAPPINESS_API_URL)
            ]);

            if (resMine.ok && resHappy.ok) {
                const myData = await resMine.json();
                const happyData = await resHappy.json();

                // @ts-ignore
                const myCountryNames = myData.map(d => d.country_name.toLowerCase());
                // @ts-ignore
                const happyCountryNames = [...new Set(happyData.map(d => d.country.toLowerCase()))];
                const commonCountries = happyCountryNames.filter(c => myCountryNames.includes(c));
                
                heatmapCountries = commonCountries.map(c => c.charAt(0).toUpperCase() + c.slice(1));

                // @ts-ignore
                let seriesData = [];

                heatmapCountries.forEach((countryName, yIndex) => {
                    heatmapYears.forEach((year, xIndex) => {
                        // @ts-ignore
                        const happyRecord = happyData.find(h => h.country.toLowerCase() === countryName.toLowerCase() && h.year === year);
                        // @ts-ignore
                        const myRecord = myData.find(m => m.country_name.toLowerCase() === countryName.toLowerCase());

                        if (happyRecord) {
                            seriesData.push({
                                x: xIndex, y: yIndex,
                                value: happyRecord.happiness_score,
                                gdp: happyRecord.gdp_per_capita,
                                fertility: myRecord ? myRecord.fert_15_19 : 'N/A'
                            });
                        }
                    });
                });

                // @ts-ignore
                if (seriesData.length > 0) drawHappinessHeatmap(seriesData);
            }
        } catch (error) {
            console.error("Error cruzando datos con Felicidad:", error);
        }
    }

    // @ts-ignore
    function drawHappinessHeatmap(seriesData) {
        // @ts-ignore
        Highcharts.chart('chart-happiness-heatmap', {
            chart: { type: 'heatmap', marginTop: 40, marginBottom: 80, plotBorderWidth: 1, backgroundColor: 'transparent' },
            title: { text: 'Mapa de Calor: Felicidad Global (2020-2023)' },
            xAxis: { categories: heatmapYears, title: { text: 'Año' } },
            // @ts-ignore
            yAxis: { categories: heatmapCountries, title: null, reversed: true },
            colorAxis: { min: 4, max: 8, minColor: '#f8fafc', maxColor: '#10b981' },
            legend: { align: 'right', layout: 'vertical', margin: 0, verticalAlign: 'top', y: 25, symbolHeight: 280 },
            tooltip: {
                useHTML: true,
                formatter: function () {
                    // @ts-ignore
                    return `<b>${this.series.yAxis.categories[this.point.y]} (${this.series.xAxis.categories[this.point.x]})</b><br/>Índice de Felicidad: <b>${this.point.value}</b><br/>GDP per cápita: <b>${this.point.gdp}</b><br/><i>Tasa Fertilidad: <b>${this.point.fertility}</b></i>`;
                }
            },
            series: [{ name: 'Felicidad', borderWidth: 1, data: seriesData, dataLabels: { enabled: true, color: '#000000', format: '{point.value:.2f}' } }]
        });
    }

// --- LÓGICA INTEGRACIÓN 4 (VINO BUBBLES - DETALLE POR VINO) ---
    async function fetchAndMatchWine() {
        try {
            const [resMine, resWine] = await Promise.all([
                fetch(MY_API_URL), fetch(WINE_API_URL)
            ]);

            if (resMine.ok && resWine.ok) {
                const myData = await resMine.json();
                const wineData = await resWine.json();

                // 1. Extraemos tu historial de fertilidad SOLO para España
                const spainFertilityByYear = {};
                let latestSpainFertility = 0;
                let latestYear = 0;

                // @ts-ignore
                myData.forEach(m => {
                    if (m.country_name.toLowerCase() === 'spain') {
                        // @ts-ignore
                        spainFertilityByYear[m.year] = m.fert_15_19;
                        // Guardamos el dato más reciente por si hay vinos del futuro (ej. 2026)
                        if (m.year > latestYear) {
                            latestYear = m.year;
                            latestSpainFertility = m.fert_15_19;
                        }
                    }
                });

                // 2. Creamos una burbuja por cada vino de la API
                // @ts-ignore
                const bubbleData = [];
                // @ts-ignore
                wineData.forEach(wine => {
                    // Cruzamos por año: Buscamos cómo estaba la fertilidad en España el año del vino
                    // Si no tenemos ese año (ej. 2026), ponemos por defecto tu dato más reciente
                    // @ts-ignore
                    const fertInWineYear = spainFertilityByYear[wine.year] || latestSpainFertility;

                    bubbleData.push({
                        name: wine.title,           // Nombre del vino
                        x: wine.price,              // Eje X: Precio
                        y: wine.abv,                // Eje Y: Alcohol
                        z: wine.unit,               // Eje Z (Tamaño): Unidades en stock
                        wineYear: wine.year,        // Dato extra para el Tooltip
                        fertility: fertInWineYear,  // Dato cruzado para el Tooltip
                        grape: wine.grape           // Dato extra para el Tooltip
                    });
                });

                // @ts-ignore
                if (bubbleData.length > 0) drawWineBubbleChart(bubbleData);
            }
        } catch (error) {
            console.error("Error cruzando datos con el Vino:", error);
        }
    }

    // @ts-ignore
    function drawWineBubbleChart(bubbleData) {
        // @ts-ignore
        Highcharts.chart('chart-wine-radar', {
            chart: { 
                type: 'bubble', 
                plotBorderWidth: 1, 
                zoomType: 'xy', 
                backgroundColor: 'transparent' 
            },
            title: { text: 'Mercado de Vino Español vs Contexto de Fertilidad' },
            subtitle: { text: 'Cada burbuja es un vino. El tamaño indica el Stock disponible.' },
            xAxis: { 
                title: { text: 'Precio del Vino (€)' },
                gridLineWidth: 1
            },
            yAxis: { 
                title: { text: 'Volumen de Alcohol (% ABV)' }
            },
            tooltip: {
                useHTML: true,
                headerFormat: '<table>',
                // Tooltip enriquecido con todos los datos cruzados
                pointFormat: '<tr><th colspan="2"><h3>{point.name}</h3></th></tr>' +
                    '<tr><th>Uva:</th><td>{point.grape}</td></tr>' +
                    '<tr><th>Precio:</th><td>{point.x} €</td></tr>' +
                    '<tr><th>Alcohol:</th><td>{point.y} %</td></tr>' +
                    '<tr><th>Stock:</th><td>{point.z} uds</td></tr>' +
                    '<tr><th style="color:#e11d48; padding-top:10px;">Fertilidad España ({point.wineYear}):</th>' +
                    '<td style="color:#e11d48; padding-top:10px;"><b>{point.fertility}</b> nacimientos</td></tr>',
                footerFormat: '</table>',
                followPointer: true
            },
            plotOptions: {
                bubble: {
                    minSize: '5%',
                    maxSize: '20%' // Ajustado para que las burbujas no se tapen demasiado
                }
            },
            series: [{
                name: 'Vinos de España',
                // @ts-ignore
                data: bubbleData,
                color: 'rgba(153, 27, 27, 0.6)', // Color rojo vino semitransparente
                marker: {
                    fillOpacity: 0.6,
                    lineWidth: 1,
                    lineColor: 'rgba(153, 27, 27, 1)'
                }
            }],
            credits: { enabled: false }
        });
    }
    
    // --- LÓGICA INTEGRACIÓN 5 (CAMBIADA A ÁREA/SUPERFICIE TREEMAP) ---
    async function fetchAndMatchArea() {
        try {
            const [resMine, resRest] = await Promise.all([
                fetch(MY_API_URL),
                fetch(RESTCOUNTRIES_API_URL)
            ]);

            if (resMine.ok && resRest.ok) {
                const myData = await resMine.json();
                const restData = await resRest.json();

                const matchedData = [];

                // Extraemos tu dato más reciente por país
                const myLatestFertility = {};
                // @ts-ignore
                myData.forEach(m => {
                    const c = m.country_name.toLowerCase();
                    // @ts-ignore
                    if (!myLatestFertility[c] || myLatestFertility[c].year < m.year) myLatestFertility[c] = m;
                });

                // Cruzamos con la superficie (area) de RestCountries
                for (const [country, myRecord] of Object.entries(myLatestFertility)) {
                    // @ts-ignore
                    const restCountry = restData.find(r => 
                        (r.name.common && r.name.common.toLowerCase() === country) || 
                        (r.name.official && r.name.official.toLowerCase() === country)
                    );
                    
                    if (restCountry && restCountry.area) {
                        matchedData.push({
                            // @ts-ignore
                            name: myRecord.country_name,
                            // @ts-ignore
                            colorValue: myRecord.fert_15_19, // Color para la fertilidad
                            value: restCountry.area          // Tamaño para el área
                        });
                    }
                }

                if (matchedData.length > 0) {
                    drawAreaTreemap(matchedData); 
                    console.log("Cruce de datos 5 (Superficie Treemap) finalizado con éxito.");
                }
            } else {
                console.error("Error en respuestas I5:", resRest.status);
            }
        } catch (error) {
            console.error("Error cruzando datos con RestCountries:", error);
        }
    }

    // @ts-ignore
    function drawAreaTreemap(matchedData) {
        // @ts-ignore
        Highcharts.chart('chart-area-treemap', {
            colorAxis: { 
                minColor: '#e0f2fe', 
                maxColor: '#be123c' 
            },
            title: { text: 'Superficie Territorial vs Fertilidad' },
            tooltip: {
                pointFormat: '<b>{point.name}</b><br/>Superficie: <b>{point.value} km²</b><br/>Tasa Fertilidad: <b>{point.colorValue}</b>'
            },
            series: [{
                type: 'treemap',
                layoutAlgorithm: 'squarified',
                data: matchedData
            }]
        });
    }


async function fetchAndDrawSankey() {
    try {
        console.log("Generando Sankey con World Bank...");

        // 1. Obtener tus datos (URL completa para evitar el 404)
        const resMine = await fetch(MY_API_URL);
        const myData = await resMine.json();

        // Guardamos el dato más reciente por país
        const latestFertility = {};
        // @ts-ignore
        myData.forEach(m => {
            const c = m.country_name || m.country;
            // @ts-ignore
            if (!latestFertility[c] || latestFertility[c].year < m.year) {
                // @ts-ignore
                latestFertility[c] = m.fert_15_19;
            }
        });

        // 2. Obtener datos del Banco Mundial (Matriculación Universitaria)
        const wbRes = await fetch('https://api.worldbank.org/v2/country/all/indicator/SE.TER.ENRR?format=json&date=2020:2022&per_page=300');
        const wbRaw = await wbRes.json();
        const wbData = wbRaw[1];

        // 3. Crear el mapa de flujos (Agrupando datos)
        // Estructura: { "Edu_Baja -> Fert_Alta": cantidad }
        const flows = {};

        // @ts-ignore
        wbData.forEach(item => {
            const countryName = item.country.value;
            const enrollment = item.value;
            // @ts-ignore
            const fert = latestFertility[countryName];

            if (enrollment !== null && fert !== undefined) {
                // Categorizar Educación
                let eduCat = enrollment < 30 ? 'Edu. Univ. Baja (<30%)' : 
                             enrollment < 60 ? 'Edu. Univ. Media (30-60%)' : 'Edu. Univ. Alta (>60%)';
                
                // Categorizar Fertilidad
                let fertCat = fert < 20 ? 'Fertilidad Baja (<20)' : 
                              fert < 50 ? 'Fertilidad Media (20-50)' : 'Fertilidad Alta (>50)';

                const key = `${eduCat}|${fertCat}`;
                // @ts-ignore
                flows[key] = (flows[key] || 0) + 1;
            }
        });

        // 4. Transformar a formato Highcharts [from, to, weight]
        const sankeyData = Object.entries(flows).map(([key, count]) => {
            const [from, to] = key.split('|');
            return [from, to, count];
        });

        // 5. Dibujar
        // @ts-ignore
        Highcharts.chart('chart-universities-sankey', {
            title: { text: 'Relación: Educación Superior vs Fertilidad Juvenil' },
            accessibility: { point: { valueDescriptionFormat: '{index}. {point.from} to {point.to}, {point.weight}.' } },
            series: [{
                keys: ['from', 'to', 'weight'],
                data: sankeyData,
                type: 'sankey',
                name: 'Flujo de Países',
                nodes: [
                    { id: 'Edu. Univ. Alta (>60%)', color: '#10b981' },
                    { id: 'Fertilidad Baja (<20)', color: '#3b82f6' },
                    { id: 'Fertilidad Alta (>50)', color: '#ef4444' }
                ]
            }]
        });

    } catch (error) {
        console.error("Error en el Sankey:", error);
    }
}
    

    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    function drawSankeyChart(sankeyData) {
        // @ts-ignore
        Highcharts.chart('chart-universities-sankey', {
            chart: { backgroundColor: 'transparent' },
            title: { text: 'Flujo de Educación Superior a Fertilidad Juvenil' },
            subtitle: { text: 'Relación entre volumen de universidades y tasas de fertilidad por país' },
            tooltip: {
                // @ts-ignore
                nodeFormat: '{point.name}: <b>{point.sum}</b> países',
                // @ts-ignore
                nodeFormatter: function () {
                    // @ts-ignore
                    return `${this.name}: <b>${this.sum}</b> países`;
                }
            },
            series: [{
                keys: ['from', 'to', 'weight'],
                // @ts-ignore
                data: sankeyData,
                type: 'sankey',
                name: 'Flujo de Países',
                nodePadding: 40, // Espacio entre los bloques
                nodes: [
                    // Le damos colores específicos a los nodos de fertilidad para que resalten
                    { id: 'Fertilidad Alta (>70)', color: '#ef4444' }, // Rojo
                    { id: 'Fertilidad Media (30-70)', color: '#eab308' }, // Amarillo
                    { id: 'Fertilidad Baja (<30)', color: '#22c55e' }  // Verde
                ]
            }]
        });
    }


// --- LÓGICA INTEGRACIÓN FINAL (PARLIAMENT CHART - WORLD BANK) ---
    async function fetchAndDrawParliament() {
        try {
            // 1. Obtener tus datos de fertilidad
            const resMine = await fetch(MY_API_URL);
            const myData = await resMine.json();

            // Extraer el dato más reciente por país
            const latestFertility = {};
            // @ts-ignore
            myData.forEach(m => {
                const c = m.country_name;
                // @ts-ignore
                if (!latestFertility[c] || latestFertility[c].year < m.year) {
                    // @ts-ignore
                    latestFertility[c] = m.fert_15_19;
                }
            });

            // 2. Obtener datos del Banco Mundial (Trae un array donde la pos [1] son los datos)
            const resWB = await fetch(WORLDBANK_LABOR_API);
            const wbDataRaw = await resWB.json();
            const wbData = wbDataRaw[1]; // El Banco Mundial devuelve [metadatos, datos_reales]

            // 3. Contadores para nuestras "Bancadas"
            const groups = {
                baja: { count: 0, totalFert: 0, name: 'Baja Participación (<45%)', color: '#ef4444' },
                media: { count: 0, totalFert: 0, name: 'Participación Media (45-60%)', color: '#eab308' },
                alta: { count: 0, totalFert: 0, name: 'Alta Participación (>60%)', color: '#22c55e' }
            };

            // 4. Cruzar datos
            // @ts-ignore
            wbData.forEach(country => {
                const name = country.country.value; // Nombre del país en el BM
                const laborRate = country.value;    // % de mujeres trabajando

                // @ts-ignore
                if (laborRate !== null && latestFertility[name] !== undefined) {
                    // @ts-ignore
                    const fert = latestFertility[name];

                    if (laborRate < 45) {
                        groups.baja.count++;
                        groups.baja.totalFert += fert;
                    } else if (laborRate <= 60) {
                        groups.media.count++;
                        groups.media.totalFert += fert;
                    } else {
                        groups.alta.count++;
                        groups.alta.totalFert += fert;
                    }
                }
            });

            // 5. Formatear para el Parliament Chart (Calculando el promedio de fertilidad)
            const parliamentData = [
                {
                    name: groups.baja.name,
                    y: groups.baja.count, // Número de escaños (países)
                    color: groups.baja.color,
                    avgFert: (groups.baja.totalFert / (groups.baja.count || 1)).toFixed(2)
                },
                {
                    name: groups.media.name,
                    y: groups.media.count,
                    color: groups.media.color,
                    avgFert: (groups.media.totalFert / (groups.media.count || 1)).toFixed(2)
                },
                {
                    name: groups.alta.name,
                    y: groups.alta.count,
                    color: groups.alta.color,
                    avgFert: (groups.alta.totalFert / (groups.alta.count || 1)).toFixed(2)
                }
            ];

            // 6. Dibujar la gráfica
            drawParliamentChart(parliamentData);
            console.log("Cruce finalizado: Hemiciclo del Banco Mundial renderizado.");

        } catch (error) {
            console.error("Error montando el Parliament Chart:", error);
        }
    }

    // @ts-ignore
    function drawParliamentChart(data) {
        // @ts-ignore
        Highcharts.chart('chart-labor-parliament', {
            chart: { type: 'item', backgroundColor: 'transparent' },
            title: { text: 'El Hemiciclo de la Participación Femenina' },
            subtitle: { text: 'Cada punto es un país. Mayor integración laboral equivale a menor fertilidad temprana.' },
            legend: { labelFormat: '{name} <span style="opacity: 0.4">{y} países</span>' },
            tooltip: {
                headerFormat: '<span style="font-size: 13px"><b>{point.key}</b></span><br/>',
                // Usamos la variable personalizada avgFert que creamos antes
                pointFormat: '{series.name}: <b>{point.y} países</b><br/>Fertilidad Juvenil Media: <b>{point.avgFert}</b> nacimientos'
            },
            series: [{
                name: 'Países',
                keys: ['name', 'y', 'color', 'avgFert'],
                // @ts-ignore
                data: data,
                dataLabels: { enabled: false },
                // Configuración de la forma de hemiciclo (semicírculo)
                center: ['50%', '88%'],
                size: '170%',
                startAngle: -100,
                endAngle: 100
            }]
        });
    }



</script>

<style>
    :global(body) { background-color: #f8fafc; margin: 0; font-family: system-ui, sans-serif; }
    header { background-color: #0f172a; color: white; text-align: center; padding: 3rem 1rem; margin-bottom: 2rem; }
    .container { max-width: 1000px; margin: 0 auto; padding: 0 1rem; display: flex; flex-direction: column; gap: 2rem; padding-bottom: 3rem;}
    .card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    
    /* CAMBIO: Se ha sustituido #chart-restcountries por #chart-area-treemap */
    #chart-fatalities, #chart-cholera, #chart-happiness-heatmap, #chart-wine-radar, #chart-area-treemap { width: 100%; height: 500px; }
    
    .description { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
    h3 { margin: 0 0 0.5rem 0; color: #1e293b; }
    p { color: #64748b; font-size: 0.95rem; line-height: 1.5; }
</style>