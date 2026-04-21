<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let loading = $state(true);
    let error = $state(false);

    onMount(async () => {
        try {
            const res = await fetch('/api/v2/age-specific-fertility-rates');
            const fullData = await res.json();

            if (fullData.length > 0) {
                // Aleatoriedad: desordenamos y cogemos 10
                const randomSample = fullData
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 10);

                // CORRECCIÓN AQUÍ: Manejamos country_name o country
                // @ts-ignore
                const categories = randomSample.map(d => 
                    `${d.country_name || d.country || 'País'} (${d.year})`
                );
                // @ts-ignore
                const values = randomSample.map(d => Number(d.fert_15_19) || 0);

                loading = false;

                Highcharts.chart('container', {
                    chart: { type: 'bar' },
                    title: { text: 'Fertilidad: Muestra Aleatoria Individual' },
                    xAxis: { categories: categories },
                    yAxis: { title: { text: 'Tasa (15-19 años)' } },
                    series: [{
                        name: 'Tasa de Fertilidad',
                        data: values,
                        color: '#434348'
                    }],
                    credits: { enabled: false }
                });
            } else {
                // @ts-ignore
                error = "Base de datos vacía.";
                loading = false;
            }
        } catch (e) {
            // @ts-ignore
            error = "Error de conexión.";
            loading = false;
        }
    });
</script>

<main style="padding: 20px;">
    <h2>Visualización Individual (FMG)</h2>

    {#if loading}
        <p>Cargando datos aleatorios...</p>
    {:else if error}
        <p style="color: red;">{error}</p>
    {/if}

    <div id="container" style="width: 100%; height: 500px;"></div>
</main>