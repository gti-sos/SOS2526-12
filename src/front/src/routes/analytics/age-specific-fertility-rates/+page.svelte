<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';

    // Ajusta la URL a tu API real
    let BASE = dev ? 'http://localhost:3000' : '';
    const MI_API = BASE + '/api/v2/age-specific-fertility-rates'; 

    let loading = $state(true);
    let errorMsg = $state("");

    onMount(async () => {
        try {
            // Importamos Highcharts
            const HighchartsLib = await import('highcharts');
            const Highcharts = HighchartsLib.default || HighchartsLib;
            const AccessibilityLib = await import('highcharts/modules/accessibility');
            const initAccessibility = AccessibilityLib.default || AccessibilityLib;
            // @ts-ignore
            if (typeof initAccessibility === 'function') initAccessibility(Highcharts);

            // Fetch sencillo a tu propia API (sin tokens de compañeros)
            const res = await fetch(MI_API);
            if (!res.ok) throw new Error("Error obteniendo los datos de la API");
            const data = await res.json();

            loading = false;

            if (data && data.length > 0) {
                // Damos un respiro al DOM para que dibuje el div antes de inyectar Highcharts
                setTimeout(() => renderChart(Highcharts, data), 100);
            } else {
                errorMsg = "Tu base de datos está vacía en este momento.";
            }
        } catch (err) {
            loading = false;
            errorMsg = "Hubo un error cargando la gráfica.";
            console.error(err);
        }
    });

    // @ts-ignore
    function renderChart(Highcharts, data) {
        // 1. Filtramos los datos para coger un solo año y que la gráfica no sea un caos
        const yearBase = 2022; 
        // @ts-ignore
        let datosFiltrados = data.filter(d => Number(d.year) === yearBase);
        
        // Si no tienes datos de 2022, cogemos los primeros 10 registros que haya
        if (datosFiltrados.length === 0) {
            datosFiltrados = data.slice(0, 10);
        } else {
            datosFiltrados = datosFiltrados.slice(0, 10); // Máximo 10 países para que se lea bien
        }

        // 2. Preparamos las series
        // @ts-ignore
        const categorias = datosFiltrados.map(d => d.country_name || d.country);
        // @ts-ignore
        const valoresFertilidad = datosFiltrados.map(d => Number(d.fert_15_19) || 0);

        // 3. Renderizamos la gráfica
        Highcharts.chart('mi-grafica-individual', {
            chart: { 
                type: 'area' // <-- AQUÍ CUMPLIMOS LOS REQUISITOS (no es line, no es column)
            },
            title: { 
                text: 'Tasa de fertilidad en mujeres de 15 a 19 años' 
            },
            subtitle: { 
                text: `Visualización Individual - Año ${datosFiltrados[0]?.year || yearBase}` 
            },
            xAxis: { 
                categories: categorias,
                title: { text: 'Países' }
            },
            yAxis: { 
                title: { text: 'Tasa de fertilidad' } 
            },
            plotOptions: {
                area: {
                    fillOpacity: 0.5 // Hace que el área sea semitransparente (queda más moderno)
                }
            },
            series: [{
                name: 'Fertilidad (15-19 años)',
                data: valoresFertilidad,
                color: '#2c3e50' // Color azul oscuro
            }]
        });
    }
</script>

<main>
    <div class="contenedor">
        <h2>Mi Visualización Individual (FMG)</h2>
        
        {#if loading}
            <p>Cargando datos del motor de visualización...</p>
        {/if}

        {#if errorMsg}
            <p style="color: red; font-weight: bold;">{errorMsg}</p>
        {/if}

        <div id="mi-grafica-individual" style="width: 100%; height: 500px;"></div>
    </div>
</main>

<style>
    .contenedor {
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
        text-align: center;
    }
</style>