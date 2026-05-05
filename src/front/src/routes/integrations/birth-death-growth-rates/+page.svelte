<script>
    import { onMount } from 'svelte';

    // @ts-ignore
    let countries = $state([]);
    let loading = $state(true);
    let error = $state(null);

    // @ts-ignore
    let spices = $state([]);
    let spicesLoading = $state(true);
    let spicesError = $state(null);

    const SPICE_API = 'https://sos2526-20-stable.onrender.com/api/v2/spice-stats';
    const SALES_API = 'https://mrr-sos2526-23.onrender.com/api/v1/online-sales-popular-marketplaces';
    const WAGES_API = 'https://sos2526-15.onrender.com/api/v2/minimum-interprofessional-wages';

    // @ts-ignore
    let sales = $state([]);
    let salesLoading = $state(true);
    let salesError = $state(null);

    // @ts-ignore
    let wages = $state([]);
    let wagesLoading = $state(true);
    let wagesError = $state(null);

    // @ts-ignore
    let water = $state([]);
    let waterLoading = $state(true);
    let waterError = $state(null);

    const WATER_API = 'https://sos2526-27.onrender.com/api/v1/drinking-water-services';
    const WORLDBANK_GDP_API = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&per_page=300&mrv=1';
    const WORLDBANK_URBAN_API = 'https://api.worldbank.org/v2/country/all/indicator/SP.URB.TOTL.IN.ZS?format=json&per_page=300&mrv=1';

    // @ts-ignore
    let gdpData = $state([]);
    let gdpLoading = $state(true);
    let gdpError = $state(null);

    // @ts-ignore
    let urbanData = $state([]);
    let urbanLoading = $state(true);
    let urbanError = $state(null);

    onMount(async () => {
        // REST Countries
        try {
            const res = await fetch('/api/v2/birth-death-growth-rates/integrations/rest-countries');
            if (!res.ok) throw new Error('Error al cargar los datos');
            const data = await res.json();
            // @ts-ignore
            countries = data.sort((a, b) => b.population - a.population).slice(0, 15);
        } catch (err) {
            // @ts-ignore
            error = err.message;
        } finally {
            loading = false;
        }

        // World Bank — GDP per capita
        try {
            const resGDP = await fetch(WORLDBANK_GDP_API);
            if (!resGDP.ok) throw new Error('Error al cargar datos de PIB del World Bank');
            const gdpJson = await resGDP.json();
            // World Bank returns [metadata, data_array]
            const gdpRaw = gdpJson[1] || [];
            // @ts-ignore
            gdpData = gdpRaw.filter(d => d.value !== null).slice(0, 10);
        } catch (err) {
            // @ts-ignore
            gdpError = err.message;
        } finally {
            gdpLoading = false;
        }

        // World Bank — Urbanization
        try {
            const resUrban = await fetch(WORLDBANK_URBAN_API);
            if (!resUrban.ok) throw new Error('Error al cargar datos de urbanización del World Bank');
            const urbanJson = await resUrban.json();
            const urbanRaw = urbanJson[1] || [];
            // @ts-ignore
            urbanData = urbanRaw.filter(d => d.value !== null).slice(0, 10);
        } catch (err) {
            // @ts-ignore
            urbanError = err.message;
        } finally {
            urbanLoading = false;
        }

        // Online Sales (G23)
        try {
            await fetch(`${SALES_API}/loadInitialData`).catch(() => {});
            const resSales = await fetch(SALES_API);
            if (!resSales.ok) throw new Error('Error al cargar datos de ventas');
            const salesData = await resSales.json();
            sales = (Array.isArray(salesData) ? salesData : salesData.data || []).slice(0, 10);
        } catch (err) {
            // @ts-ignore
            salesError = err.message;
        } finally {
            salesLoading = false;
        }

        // Minimum Wages (G15)
        try {
            await fetch(`${WAGES_API}/loadInitialData`).catch(() => {});
            const resWages = await fetch(WAGES_API);
            if (!resWages.ok) throw new Error('Error al cargar datos de salarios');
            const wagesData = await resWages.json();
            wages = (Array.isArray(wagesData) ? wagesData : wagesData.data || []).slice(0, 10);
        } catch (err) {
            // @ts-ignore
            wagesError = err.message;
        } finally {
            wagesLoading = false;
        }

        // Drinking Water (G27)
        try {
            await fetch(`${WATER_API}/loadInitialData`).catch(() => {});
            const resWater = await fetch(WATER_API);
            if (!resWater.ok) throw new Error('Error al cargar datos de agua potable');
            const waterData = await resWater.json();
            water = (Array.isArray(waterData) ? waterData : waterData.data || []).slice(0, 10);
        } catch (err) {
            // @ts-ignore
            waterError = err.message;
        } finally {
            waterLoading = false;
        }

        // Spice Stats (G20)
        try {
            await fetch(`${SPICE_API}/loadInitialData`).catch(() => {});
            const res = await fetch(`${SPICE_API}?limit=200`);
            if (!res.ok) throw new Error('Error al cargar datos de especias');
            const json = await res.json();
            spices = (json.data || []).slice(0, 10);
        } catch (err) {
            // @ts-ignore
            spicesError = err.message;
        } finally {
            spicesLoading = false;
        }
    });
</script>

<h1>Integración: REST Countries</h1>
<p>Datos de población por país obtenidos a través del proxy propio desde <strong>restcountries.com</strong></p>

{#if loading}
    <p>Cargando datos...</p>
{:else if error}
    <p style="color:red">Error: {error}</p>
{:else}
    <table border="1" cellpadding="6" cellspacing="0">
        <thead>
            <tr>
                <th>Bandera</th>
                <th>País</th>
                <th>Región</th>
                <th>Población</th>
            </tr>
        </thead>
        <tbody>
            {#each countries as country}
                <tr>
                    <td><img src={country.flags?.png} alt="bandera" width="40" /></td>
                    <td>{country.name?.common}</td>
                    <td>{country.region}</td>
                    <td>{country.population?.toLocaleString('es-ES')}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<h2>Integración: World Bank — PIB per cápita</h2>
<p>Datos de PIB per cápita más reciente por país obtenidos desde <strong>api.worldbank.org</strong></p>

{#if gdpLoading}
    <p>Cargando datos de PIB...</p>
{:else if gdpError}
    <p style="color:red">Error: {gdpError}</p>
{:else}
    <table>
        <thead>
            <tr>
                <th>País</th>
                <th>Código</th>
                <th>Año</th>
                <th>PIB per cápita (USD)</th>
            </tr>
        </thead>
        <tbody>
            {#each gdpData as g}
                <tr>
                    <td>{g.country?.value}</td>
                    <td>{g.countryiso3code}</td>
                    <td>{g.date}</td>
                    <td>${g.value?.toLocaleString('es-ES', { maximumFractionDigits: 2 })}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<h2>Integración: World Bank — Urbanización</h2>
<p>Porcentaje de población urbana por país obtenido desde <strong>api.worldbank.org</strong></p>

{#if urbanLoading}
    <p>Cargando datos de urbanización...</p>
{:else if urbanError}
    <p style="color:red">Error: {urbanError}</p>
{:else}
    <table>
        <thead>
            <tr>
                <th>País</th>
                <th>Código</th>
                <th>Año</th>
                <th>Población urbana (%)</th>
            </tr>
        </thead>
        <tbody>
            {#each urbanData as u}
                <tr>
                    <td>{u.country?.value}</td>
                    <td>{u.countryiso3code}</td>
                    <td>{u.date}</td>
                    <td>{u.value?.toFixed(2)}%</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<h2>Integración: Online Sales (G23)</h2>
<p>Datos de ventas online obtenidos desde <strong>sos2526-23</strong></p>

{#if salesLoading}
    <p>Cargando datos de ventas...</p>
{:else if salesError}
    <p style="color:red">Error: {salesError}</p>
{:else}
    <table>
        <thead>
            <tr>
                <th>Región</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Precio Ud.</th>
                <th>Total</th>
                <th>Método Pago</th>
            </tr>
        </thead>
        <tbody>
            {#each sales as s}
                <tr>
                    <td>{s.region}</td>
                    <td>{s.product_name}</td>
                    <td>{s.category}</td>
                    <td>{s.quantity}</td>
                    <td>${s.unit_price?.toFixed(2)}</td>
                    <td>${s.total_price?.toFixed(2)}</td>
                    <td>{s.payment_method}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<h2>Integración: Salarios Mínimos (G15)</h2>
<p>Datos de salarios mínimos interprofesionales obtenidos desde <strong>sos2526-15</strong></p>

{#if wagesLoading}
    <p>Cargando datos de salarios...</p>
{:else if wagesError}
    <p style="color:red">Error: {wagesError}</p>
{:else}
    <table>
        <thead>
            <tr>
                <th>País</th>
                <th>Año</th>
                <th>Salario (moneda local)</th>
                <th>Salario (USD)</th>
                <th>Cambio (%)</th>
            </tr>
        </thead>
        <tbody>
            {#each wages as w}
                <tr>
                    <td>{w.country}</td>
                    <td>{w.date}</td>
                    <td>{w.national_currency_minimum_wage?.toLocaleString('es-ES')}</td>
                    <td>${w.nmw_on_dollar?.toLocaleString('es-ES')}</td>
                    <td>{w.percentage_change}%</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<h2>Integración: Drinking Water Services (G27)</h2>
<p>Datos de acceso a agua potable obtenidos desde <strong>sos2526-27</strong></p>

{#if waterLoading}
    <p>Cargando datos de agua potable...</p>
{:else if waterError}
    <p style="color:red">Error: {waterError}</p>
{:else}
    <table>
        <thead>
            <tr>
                <th>País</th>
                <th>Código</th>
                <th>Año</th>
                <th>Población urbana con acceso</th>
            </tr>
        </thead>
        <tbody>
            {#each water as w}
                <tr>
                    <td>{w.entity}</td>
                    <td>{w.code}</td>
                    <td>{w.year}</td>
                    <td>{w.wat_bas_pop_residence_urban?.toLocaleString('es-ES') ?? 'N/A'}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<h2>Integración: Spice Stats (G20)</h2>
<p>Datos de comercio de especias obtenidos desde <strong>sos2526-20</strong></p>

{#if spicesLoading}
    <p>Cargando datos de especias...</p>
{:else if spicesError}
    <p style="color:red">Error: {spicesError}</p>
{:else}
    <table>
        <thead>
            <tr>
                <th>País</th>
                <th>Especia</th>
                <th>Año</th>
                <th>Importación (t)</th>
                <th>Exportación (t)</th>
                <th>Producción (t)</th>
            </tr>
        </thead>
        <tbody>
            {#each spices as s}
                <tr>
                    <td>{s.area}</td>
                    <td>{s.item}</td>
                    <td>{s.year}</td>
                    <td>{s.import?.toLocaleString('es-ES')}</td>
                    <td>{s.export?.toLocaleString('es-ES')}</td>
                    <td>{s.production?.toLocaleString('es-ES')}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<style>
    table { font-size: 0.85rem; border-collapse: collapse; max-width: 600px; }
    th, td { padding: 4px 8px; }
    th { background: #f1f5f9; }
    img { vertical-align: middle; }
</style>
