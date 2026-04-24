<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment'; // 🟢 Importante para detectar el entorno local
    import Highcharts from 'highcharts';

    let chartContainer;

    onMount(async () => {
        // 🟢 FIX: Usamos el puerto 3000 si estamos en desarrollo
        let API = '/api/v2/mid-population-ages';
        if (dev) {
            API = "http://localhost:3000" + API;
        }

        try {
            const res = await fetch(API);
            if (res.ok) {
                const data = await res.json();

                // Cogemos los 10 primeros para que el gráfico no se sature
                const topData = data.slice(0, 10); 
                
                const categories = topData.map(d => `${d.country_name} (${d.year})`);
                const pop0 = topData.map(d => d.population_age_0);
                const pop25 = topData.map(d => d.population_age_25);
                const pop50 = topData.map(d => d.population_age_50);

                Highcharts.chart(chartContainer, {
                    chart: { type: 'column' },
                    title: { text: 'Población por Franjas de Edad (Top 10 Registros)' },
                    xAxis: { categories: categories },
                    yAxis: {
                        min: 0,
                        title: { text: 'Cantidad de Población' },
                        stackLabels: { enabled: true }
                    },
                    plotOptions: {
                        column: {
                            stacking: 'normal',
                            dataLabels: { enabled: true }
                        }
                    },
                    series: [{
                        name: '0 Años',
                        data: pop0
                    }, {
                        name: '25 Años',
                        data: pop25
                    }, {
                        name: '50 Años',
                        data: pop50
                    }]
                });
            }
        } catch (error) {
            console.error("Error al cargar datos para Highcharts:", error);
        }
    });
</script>

<main>
    <h1>📈 Analíticas de Población (JJG)</h1>
    <div class="actions">
        <a href="/mid-population-ages" class="btn">🔙 Volver a la tabla</a>
    </div>
    
    <div bind:this={chartContainer} class="chart"></div>
</main>

<style>
    main { max-width: 1000px; margin: auto; padding: 20px; font-family: sans-serif; }
    .chart { width: 100%; height: 500px; margin-top: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .btn { background: #6c757d; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold; }
    .actions { margin-bottom: 20px; }
</style>