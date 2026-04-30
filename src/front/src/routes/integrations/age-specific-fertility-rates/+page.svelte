<svelte:head>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js"></script>
</svelte:head>

<main>
    <header>
        <h1>Panel de Integraciones SOS</h1>
        <p>Visualización de Datos Cruzados: Fertilidad vs. Fatalidades</p>
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
    </div>
</main>

<script>
    import { onMount } from "svelte";

    // --- CONFIGURACIÓN DE ENDPOINTS ---
    // Tu API propia en Render:
    const MY_API_URL = "https://sos2526-12.onrender.com/api/v2/age-specific-fertility-rates";
    
    // TU PROXY:
    const G11_PROXY_URL = "http://sos2526-12.onrender.com/api/v2/proxy-sos-1"; 

    // @ts-ignore
    let matchedFatalities = [];

    onMount(async () => {
        console.log("Iniciando carga de datos...");
        await loadInitialDataSilently();
        await fetchAndMatchData();
        if (matchedFatalities.length > 0) {
            drawFatalitiesChart();
        } else {
            console.error("No hay datos suficientes para generar la gráfica.");
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

    async function fetchAndMatchData() {
        try {
            // Hacemos el fetch atacando a TU proxy en lugar de la API de ellos
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
                console.log("Cruce de datos finalizado con éxito a través del proxy.");
            } else {
                console.error(`Error en las respuestas: Mis datos ${resMine.status}, Proxy ${resG11.status}`);
            }
        } catch (error) {
            console.error("Error crítico en el fetch:", error);
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
</script>

<style>
    :global(body) { background-color: #f8fafc; margin: 0; font-family: system-ui, sans-serif; }
    header { background-color: #0f172a; color: white; text-align: center; padding: 3rem 1rem; margin-bottom: 2rem; }
    .container { max-width: 1000px; margin: 0 auto; padding: 0 1rem; }
    .card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    #chart-fatalities { width: 100%; height: 500px; }
    .description { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
    h3 { margin: 0 0 0.5rem 0; color: #1e293b; }
    p { color: #64748b; font-size: 0.95rem; }
</style>