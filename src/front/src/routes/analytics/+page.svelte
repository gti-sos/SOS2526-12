<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';

    let BASE = dev ? 'http://localhost:3000' : '';
    const API_FMG = BASE + '/api/v2/age-specific-fertility-rates';
    const API_JJG = BASE + '/api/v2/mid-population-ages';
    const API_LPH = BASE + '/api/v2/birth-death-growth-rates';

    // AQUÍ ESTABA EL ERROR: Svelte 5 necesita $state para actualizar la pantalla
    let loading = $state(true);
    let errorMsg = $state("");

    onMount(async () => {
        try {
            const HighchartsLib = await import('highcharts');
            const Highcharts = HighchartsLib.default || HighchartsLib;
            const AccessibilityLib = await import('highcharts/modules/accessibility');
            const initAccessibility = AccessibilityLib.default || AccessibilityLib;
            // @ts-ignore
            if (typeof initAccessibility === 'function') initAccessibility(Highcharts);

            // Fetch con el token de Auth0 incluido para todas las APIs
            // @ts-ignore
            const fetchData = async (url) => {
                try {
                    const token = localStorage.getItem('lph_jwt');
                    const opciones = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
                    
                    const res = await fetch(url, opciones);
                    return res.ok ? await res.json() : [];
                } catch (e) { 
                    console.error("Error en", url, e);
                    return []; 
                }
            };

            const [dataFMG, dataJJG, dataLPH] = await Promise.all([
                fetchData(API_FMG),
                fetchData(API_JJG),
                fetchData(API_LPH)
            ]);

            // Como usamos $state, ahora esto sí ocultará el texto de cargando
            loading = false; 

            if (dataFMG.length || dataJJG.length || dataLPH.length) {
                setTimeout(() => renderChart(Highcharts, dataFMG, dataJJG, dataLPH), 100);
            } else {
                errorMsg = "Las APIs están vacías o la sesión ha caducado.";
            }
        } catch (err) {
            loading = false;
            errorMsg = "Error al inicializar la gráfica.";
            console.error(err);
        }
    });

    // @ts-ignore
    function renderChart(Highcharts, fmg, jjg, lph) {
        const yearBase = 2022;

        // Sacamos los países que existan en cualquiera de las APIs
        const todosLosPaises = [
            // @ts-ignore
            ...fmg.map(d => d.country_name || d.country),
            // @ts-ignore
            ...jjg.map(d => d.country_name || d.country),
            // @ts-ignore
            ...lph.map(d => d.country_name || d.country)
        ].filter(Boolean);
        
        // @ts-ignore
        const categoriasUnicas = [];
        todosLosPaises.forEach(p => {
            // @ts-ignore
            if (!categoriasUnicas.find(c => c.toUpperCase() === p.toUpperCase())) {
                categoriasUnicas.push(p);
            }
        });

        // @ts-ignore
        const categorias = categoriasUnicas.slice(0, 8);

        // Búsqueda genérica (para FMG y LPH — un registro por pais/año)
        // @ts-ignore
        const findData = (dataset, country, year, field) => {
            // @ts-ignore
            const entry = dataset.find(d =>
                ( (d.country_name || d.country || "").toLowerCase() === country.toLowerCase() ) &&
                ( Number(d.year) === year )
            );
            return entry ? (Number(entry[field]) || 0) : 0;
        };

        // Búsqueda específica para JJG (suma hombres y mujeres si existen)
        // @ts-ignore
        const findJJGData = (dataset, country, year, field) => {
            // @ts-ignore
            const entries = dataset.filter(d =>
                ( (d.country_name || d.country || "").toLowerCase() === country.toLowerCase() ) &&
                ( Number(d.year) === year )
            );

            if (entries.length === 0) return 0;

            // JJG tiene registros separados por sexo (Male y Female), sumamos
            let total = 0;
            // @ts-ignore
            entries.forEach(e => {
                total += (Number(e[field]) || 0);
            });
            return total;
        };

        Highcharts.chart('chart-container', {
            chart: { type: 'bar' },
            title: { text: 'Análisis Demográfico Combinado (SOS2526-12)' },
            subtitle: { text: `Año ${yearBase}` },
            xAxis: { categories: categorias },
            yAxis: { title: { text: 'Valor' } },
            series: [
                {
                    name: 'Fertilidad 15-19 (FMG)',
                    data: categorias.map(c => findData(fmg, c, yearBase, 'fert_15_19'))
                },
                {
                    name: 'Población 50 años / 1k (JJG)',
                    data: categorias.map(c => findJJGData(jjg, c, yearBase, 'population_age_50') / 1000)
                },
                {
                    name: 'Tasa de crecimiento (LPH)',
                    data: categorias.map(c => findData(lph, c, yearBase, 'growth_rate'))
                }
            ]
        });
    }
</script>

<main class="analytics-page">
    <div class="header">
        <h1>Panel de Analytics Integrado</h1>
        <p>Visualización de datos combinados de todos los miembros del grupo.</p>
    </div>
    <hr />

    {#if loading}
        <div class="status-msg">Cargando datos y motor de visualización...</div>
    {:else if errorMsg}
        <div class="status-msg error">{errorMsg}</div>
    {/if}

    <div id="chart-container"></div>
</main>

<style>
    .analytics-page {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem;
        color: #333;
    }
    .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    #chart-container {
        width: 100%;
        height: 550px;
        margin: 2rem 0;
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 8px;
    }
    .status-msg { text-align: center; padding: 2rem; font-style: italic; color: #666; }
    .status-msg.error { color: #dc3545; background: #fff5f5; border-radius: 5px; font-weight: bold; }
</style>