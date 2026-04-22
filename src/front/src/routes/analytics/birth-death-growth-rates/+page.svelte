<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let loading = $state(true);
    let error = $state(false);

    onMount(async () => {
        try {
            const res = await fetch('/api/v2/birth-death-growth-rates');
            const fullData = await res.json();

            if (fullData.length > 0) {
                // Muestra aleatoria de 10 registros para no saturar el grafico
                const sample = fullData
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 10);

                const categories = sample.map(d =>
                    `${d.country_name || d.country_code} (${d.year})`
                );
                const birthRates = sample.map(d => Number(d.crude_birth_rate) || 0);
                const deathRates = sample.map(d => Number(d.crude_death_rate) || 0);

                loading = false;

                Highcharts.chart('container', {
                    chart: { type: 'column' },
                    title: { text: 'Tasas de Natalidad y Mortalidad por País' },
                    xAxis: {
                        categories,
                        labels: { rotation: -45 }
                    },
                    yAxis: {
                        title: { text: 'Tasa (por 1000 hab.)' }
                    },
                    tooltip: {
                        shared: true,
                        valueSuffix: ' por 1000 hab.'
                    },
                    series: [
                        { name: 'Natalidad', data: birthRates, color: '#2ecc71' },
                        { name: 'Mortalidad', data: deathRates, color: '#e74c3c' }
                    ],
                    credits: { enabled: false }
                });
            } else {
                // @ts-ignore
                error = "Base de datos vacía. Carga los datos iniciales primero.";
                loading = false;
            }
        } catch (e) {
            // @ts-ignore
            error = "Error de conexión con la API.";
            loading = false;
        }
    });
</script>

<main style="padding: 20px;">
    <h2>Visualización Individual (LPH)</h2>
    <p>Comparación de tasas de natalidad y mortalidad — gráfico de columnas agrupadas.</p>

    {#if loading}
        <p>Cargando datos...</p>
    {:else if error}
        <p style="color: red;">{error}</p>
    {/if}

    <div id="container" style="width: 100%; height: 500px;"></div>
</main>
