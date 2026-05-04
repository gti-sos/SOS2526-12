<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let loading = $state(true);
    let error = $state(false);

    onMount(async () => {
        try {
            // Tu API
            const res = await fetch('/api/v2/age-specific-fertility-rates');
            const fullData = await res.json();

            if (fullData.length > 0) {
                // Seleccionamos 10 aleatorios
                const sample = fullData
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 10);

                loading = false;

                // Formateamos los datos específicamente para un Pie Chart
                // Las tartas necesitan un array de objetos { name, y }
                const pieData = sample.map(d => ({
                    name: `${d.country_name || d.country} (${d.year})`,
                    y: Number(d.fert_15_19) || 0
                }));

                // Gráfica de Tarta (Pie Chart)
                Highcharts.chart('container', {
                    chart: {
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false,
                        type: 'pie',
                        backgroundColor: 'transparent'
                    },
                    title: {
                        text: 'Proporción de Fertilidad Juvenil en la Muestra'
                    },
                    subtitle: {
                        text: 'Distribución comparativa de 10 países aleatorios'
                    },
                    tooltip: {
                        // Muestra el valor real y el porcentaje calculado
                        pointFormat: '{series.name}: <b>{point.y} nacimientos</b> ({point.percentage:.1f}%)'
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: true,
                                // Muestra el nombre del país y su porcentaje fuera de la tarta
                                format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                            }
                        }
                    },
                    series: [{
                        name: 'Fertilidad',
                        colorByPoint: true,
                        // @ts-ignore
                        data: pieData
                    }],
                    credits: { enabled: false }
                });
            } else {
                error = "Base de datos vacía. Carga los datos iniciales primero.";
                loading = false;
            }
        } catch (e) {
            error = "Error de conexión con la API.";
            loading = false;
        }
    });
</script>

<main style="padding: 20px;">
    <h2>Visualización Individual (Fertilidad)</h2>
    <p>Comparación proporcional de la tasa de fertilidad en mujeres jóvenes mediante gráfico de sectores (tarta).</p>

    {#if loading}
        <p>Cargando datos...</p>
    {:else if error}
        <p style="color: red;">{error}</p>
    {/if}

    <div id="container" style="width: 100%; height: 500px;"></div>
</main>