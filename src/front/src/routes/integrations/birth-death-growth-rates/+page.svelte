<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let chartCountries, chartGdp, chartUrban, chartWages, chartWater;

    let spices = $state([]);
    let spicesLoading = $state(true);
    let spicesError = $state(null);

    const SPICE_API = 'https://sos2526-20-stable.onrender.com/api/v2/spice-stats';
    const SALES_API = 'https://mrr-sos2526-23.onrender.com/api/v1/online-sales-popular-marketplaces';
    const WAGES_API = 'https://sos2526-15.onrender.com/api/v2/minimum-interprofessional-wages';
    const WATER_API = 'https://sos2526-27.onrender.com/api/v1/drinking-water-services';
    const WORLDBANK_GDP_API = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&per_page=300&mrv=1';
    const WORLDBANK_URBAN_API = 'https://api.worldbank.org/v2/country/all/indicator/SP.URB.TOTL.IN.ZS?format=json&per_page=300&mrv=1';

    let sales = $state([]);
    let salesLoading = $state(true);
    let salesError = $state(null);

    onMount(async () => {
        // Load extra chart type modules (client-side only)
        await import('highcharts/highcharts-more');
        await import('highcharts/modules/funnel');
        await import('highcharts/modules/dumbbell');
        await import('highcharts/modules/lollipop');
        await import('highcharts/modules/solid-gauge');

        // REST Countries
        try {
            const res = await fetch('/api/v2/birth-death-growth-rates/integrations/rest-countries');
            if (res.ok) {
                const data = await res.json();
                const countries = data.sort((a, b) => b.population - a.population).slice(0, 15);
                Highcharts.chart(chartCountries, {
                    chart: { type: 'pyramid' },
                    title: { text: 'Población por País (Top 15)' },
                    plotOptions: { series: { dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.y:,.0f}' } } },
                    series: [{ name: 'Población', data: countries.map(c => ({ name: c.name?.common, y: c.population })) }],
                    legend: { enabled: false },
                    credits: { enabled: false }
                });
            }
        } catch (e) { console.error('REST Countries error:', e); }

        // World Bank GDP
        try {
            const res = await fetch(WORLDBANK_GDP_API);
            if (res.ok) {
                const json = await res.json();
                const gdpData = (json[1] || []).filter(d => d.value !== null).slice(0, 10);
                Highcharts.chart(chartGdp, {
                    chart: { type: 'funnel' },
                    title: { text: 'PIB per cápita por País (USD)' },
                    plotOptions: { series: { dataLabels: { enabled: true, format: '<b>{point.name}</b>: ${point.y:,.0f}' }, neckWidth: '30%', neckHeight: '25%' } },
                    series: [{ name: 'PIB per cápita', data: gdpData.sort((a, b) => b.value - a.value).map(g => ({ name: g.country?.value, y: g.value })) }],
                    legend: { enabled: false },
                    credits: { enabled: false }
                });
            }
        } catch (e) { console.error('GDP error:', e); }

        // World Bank Urbanization
        try {
            const res = await fetch(WORLDBANK_URBAN_API);
            if (res.ok) {
                const json = await res.json();
                const urbanData = (json[1] || []).filter(d => d.value !== null).slice(0, 10);
                Highcharts.chart(chartUrban, {
                    chart: { type: 'lollipop' },
                    title: { text: 'Población Urbana por País (%)' },
                    xAxis: { categories: urbanData.map(u => u.country?.value), labels: { rotation: -45 } },
                    yAxis: { title: { text: '%' }, max: 100 },
                    series: [{ name: '% Urbana', data: urbanData.map(u => parseFloat(u.value?.toFixed(2))), color: '#8e44ad' }],
                    legend: { enabled: false },
                    credits: { enabled: false }
                });
            }
        } catch (e) { console.error('Urban error:', e); }

        // Online Sales (G23) — table
        try {
            await fetch(`${SALES_API}/loadInitialData`).catch(() => {});
            const res = await fetch(SALES_API);
            if (res.ok) {
                const data = await res.json();
                sales = (Array.isArray(data) ? data : data.data || []).slice(0, 10);
            }
        } catch (e) { console.error('Sales error:', e); }
        finally { salesLoading = false; }

        // Minimum Wages (G15)
        try {
            await fetch(`${WAGES_API}/loadInitialData`).catch(() => {});
            const res = await fetch(WAGES_API);
            if (res.ok) {
                const data = await res.json();
                const wages = (Array.isArray(data) ? data : data.data || []).slice(0, 10);
                Highcharts.chart(chartWages, {
                    chart: { type: 'dumbbell', inverted: true },
                    title: { text: 'Salario Mínimo: Moneda Local vs USD' },
                    xAxis: { categories: wages.map(w => `${w.country} (${w.date})`), labels: { rotation: 0 } },
                    yAxis: { title: { text: 'Valor' } },
                    series: [{ name: 'Salario', data: wages.map(w => ({ low: Math.min(w.nmw_on_dollar || 0, w.national_currency_minimum_wage || 0), high: Math.max(w.nmw_on_dollar || 0, w.national_currency_minimum_wage || 0) })), color: '#e67e22', connectorColor: '#e67e22' }],
                    legend: { enabled: false },
                    credits: { enabled: false }
                });
            }
        } catch (e) { console.error('Wages error:', e); }

        // Drinking Water (G27)
        try {
            await fetch(`${WATER_API}/loadInitialData`).catch(() => {});
            const res = await fetch(WATER_API);
            if (res.ok) {
                const data = await res.json();
                const water = (Array.isArray(data) ? data : data.data || []).slice(0, 10);
                Highcharts.chart(chartWater, {
                    chart: { type: 'gauge' },
                    title: { text: 'Acceso a Agua Potable (Promedio)' },
                    pane: { startAngle: -150, endAngle: 150, background: [{ backgroundColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, '#FFF'], [1, '#DDD']] }, borderWidth: 0, outerRadius: '109%' }] },
                    yAxis: { min: 0, max: Math.max(...water.map(w => w.wat_bas_pop_residence_urban || 0)) * 1.2, title: { text: 'Población' }, plotBands: [{ from: 0, to: Math.max(...water.map(w => w.wat_bas_pop_residence_urban || 0)) * 0.5, color: '#DF5353' }, { from: Math.max(...water.map(w => w.wat_bas_pop_residence_urban || 0)) * 0.5, to: Math.max(...water.map(w => w.wat_bas_pop_residence_urban || 0)) * 0.8, color: '#DDDF0D' }, { from: Math.max(...water.map(w => w.wat_bas_pop_residence_urban || 0)) * 0.8, to: Math.max(...water.map(w => w.wat_bas_pop_residence_urban || 0)) * 1.2, color: '#55BF3B' }] },
                    series: [{ name: 'Acceso agua potable', data: [Math.round(water.reduce((s, w) => s + (w.wat_bas_pop_residence_urban || 0), 0) / water.length)] }],
                    credits: { enabled: false }
                });
            }
        } catch (e) { console.error('Water error:', e); }

        // Spice Stats (G20) — table
        try {
            await fetch(`${SPICE_API}/loadInitialData`).catch(() => {});
            const res = await fetch(`${SPICE_API}?limit=200`);
            if (res.ok) {
                const json = await res.json();
                spices = (json.data || []).slice(0, 10);
            }
        } catch (e) { console.error('Spices error:', e); }
        finally { spicesLoading = false; }
    });
</script>

<main style="padding: 20px;">
    <h1>Integración: REST Countries</h1>
    <p>Datos de población por país obtenidos a través del proxy propio desde <strong>restcountries.com</strong> — Gráfico tipo <strong>Pyramid</strong></p>
    <div bind:this={chartCountries} class="chart"></div>

    <h2>Integración: World Bank — PIB per cápita</h2>
    <p>Datos de PIB per cápita más reciente por país obtenidos desde <strong>api.worldbank.org</strong> — Gráfico tipo <strong>Funnel</strong></p>
    <div bind:this={chartGdp} class="chart"></div>

    <h2>Integración: World Bank — Urbanización</h2>
    <p>Porcentaje de población urbana por país obtenido desde <strong>api.worldbank.org</strong> — Gráfico tipo <strong>Lollipop</strong></p>
    <div bind:this={chartUrban} class="chart"></div>

    <h2>Integración: Online Sales (G23)</h2>
    <p>Datos de ventas online obtenidos desde <strong>sos2526-23</strong></p>
    {#if salesLoading}
        <p>Cargando datos de ventas...</p>
    {:else if salesError}
        <p style="color:red">Error: {salesError}</p>
    {:else}
        <table>
            <thead><tr><th>Región</th><th>Producto</th><th>Categoría</th><th>Cantidad</th><th>Precio Ud.</th><th>Total</th><th>Método Pago</th></tr></thead>
            <tbody>
                {#each sales as s}
                    <tr><td>{s.region}</td><td>{s.product_name}</td><td>{s.category}</td><td>{s.quantity}</td><td>${s.unit_price?.toFixed(2)}</td><td>${s.total_price?.toFixed(2)}</td><td>{s.payment_method}</td></tr>
                {/each}
            </tbody>
        </table>
    {/if}

    <h2>Integración: Salarios Mínimos (G15)</h2>
    <p>Datos de salarios mínimos interprofesionales obtenidos desde <strong>sos2526-15</strong> — Gráfico tipo <strong>Dumbbell</strong></p>
    <div bind:this={chartWages} class="chart"></div>

    <h2>Integración: Drinking Water Services (G27)</h2>
    <p>Datos de acceso a agua potable obtenidos desde <strong>sos2526-27</strong> — Gráfico tipo <strong>Gauge</strong></p>
    <div bind:this={chartWater} class="chart"></div>

    <h2>Integración: Spice Stats (G20)</h2>
    <p>Datos de comercio de especias obtenidos desde <strong>sos2526-20</strong></p>
    {#if spicesLoading}
        <p>Cargando datos de especias...</p>
    {:else if spicesError}
        <p style="color:red">Error: {spicesError}</p>
    {:else}
        <table>
            <thead><tr><th>País</th><th>Especia</th><th>Año</th><th>Importación (t)</th><th>Exportación (t)</th><th>Producción (t)</th></tr></thead>
            <tbody>
                {#each spices as s}
                    <tr><td>{s.area}</td><td>{s.item}</td><td>{s.year}</td><td>{s.import?.toLocaleString('es-ES')}</td><td>{s.export?.toLocaleString('es-ES')}</td><td>{s.production?.toLocaleString('es-ES')}</td></tr>
                {/each}
            </tbody>
        </table>
    {/if}
</main>

<style>
    .chart { width: 100%; height: 400px; margin-bottom: 20px; }
    table { font-size: 0.85rem; border-collapse: collapse; max-width: 600px; }
    th, td { padding: 4px 8px; }
    th { background: #f1f5f9; }
</style>
