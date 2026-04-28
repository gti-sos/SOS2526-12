<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let loading = true;
    let error = false;

    onMount(async () => {
        try {
            const res = await fetch('/api/v2/birth-death-growth-rates');
            const fullData = await res.json();

            if (fullData.length > 0) {
                const sample = fullData
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 10);

                const categories = sample.map(d =>
                    `${d.country_name || d.country_code} (${d.year})`
                );

                loading = false;

                Highcharts.chart('container', {
                    chart: { type: 'scatter' },
                    title: { text: 'Tasas de Natalidad y Mortalidad por País' },
                    xAxis: {
                        categories,
                        labels: { rotation: -45 }
                    },
                    yAxis: {
                        title: { text: 'Tasa (por 1000 hab.)' }
                    },
                    tooltip: {
                        formatter: function() {
                            return `<b>${this.point.name}</b><br/>${this.series.name}: ${this.y} por 1000 hab.`;
                        }
                    },
                    series: [
                        {
                            name: 'Natalidad',
                            type: 'scatter',
                            data: sample.map((d, i) => ({
                                x: i,
                                y: Number(d.crude_birth_rate) || 0,
                                name: categories[i]
                            })),
                            color: '#2ecc71',
                            marker: { symbol: 'circle', radius: 6 }
                        },
                        {
                            name: 'Mortalidad',
                            type: 'scatter',
                            data: sample.map((d, i) => ({
                                x: i,
                                y: Number(d.crude_death_rate) || 0,
                                name: categories[i]
                            })),
                            color: '#e74c3c',
                            marker: { symbol: 'diamond', radius: 6 }
                        }
                    ],
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
    <h2>Visualización Individual (LPH)</h2>
    <p>Comparación de tasas de natalidad y mortalidad — gráfico de dispersión.</p>

    {#if loading}
        <p>Cargando datos...</p>
    {:else if error}
        <p style="color: red;">{error}</p>
    {/if}

    <div id="container" style="width: 100%; height: 500px;"></div>
</main>