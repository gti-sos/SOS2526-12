<script>
    import { onMount } from 'svelte';

    let loading = $state(true);
    let error = $state(false);

    // Coordenadas conocidas — carga instantanea, sin API
    const KNOWN_COORDS = {
        'Slovenia': [46.15, 14.99],
        'Latvia': [56.88, 24.60],
        'Mongolia': [46.86, 103.85],
        'Mauritania': [20.25, -10.71],
        'Liberia': [6.43, -9.43],
        'Saint Barthelemy': [17.90, -62.83],
        'Ukraine': [48.38, 31.17],
        'Cyprus': [35.13, 33.43],
        'Venezuela': [6.42, -66.59],
        'Ethiopia': [9.14, 40.49],
        'Zambia': [-13.13, 28.28],
    };

    // localStorage cache — persiste entre visitas
    function loadCache() {
        try {
            return JSON.parse(localStorage.getItem('geo_cache') || '{}');
        } catch { return {}; }
    }

    function saveCache(cache) {
        localStorage.setItem('geo_cache', JSON.stringify(cache));
    }

    // Nominatim — solo para paises desconocidos
    async function geocode(countryName, cache) {
        // 1. Tabla estatica
        if (KNOWN_COORDS[countryName]) return KNOWN_COORDS[countryName];

        // 2. Cache de localStorage
        if (cache[countryName]) return cache[countryName];

        // 3. Nominatim (ultimo recurso, lento)
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(countryName)}&format=json&limit=1`;
            const res = await fetch(url, {
                headers: { 'User-Agent': 'SOS2526-12-university-project' }
            });
            const results = await res.json();

            if (results.length > 0) {
                const coords = [parseFloat(results[0].lat), parseFloat(results[0].lon)];
                cache[countryName] = coords;
                saveCache(cache);
                return coords;
            }
        } catch (e) {
            console.warn(`Geocoding fallo para: ${countryName}`, e);
        }
        return null;
    }

    onMount(async () => {
        try {
            const L = await import('leaflet');

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            const res = await fetch('/api/v2/birth-death-growth-rates');
            const data = await res.json();

            if (data.length === 0) {
                // @ts-ignore
                error = "Base de datos vacía. Carga los datos iniciales primero.";
                loading = false;
                return;
            }

            await new Promise(r => setTimeout(r, 200));

            const map = L.map('map-container', {
                maxBounds: [[-85, -180], [85, 180]],
                maxBoundsViscosity: 1.0,
                minZoom: 2,
                worldCopyJump: false
            }).setView([20, 10], 2);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(map);

            loading = false;

            const cache = loadCache();
            let needsDelay = false;

            for (const d of data) {
                const name = d.country_name || d.country_code;
                const isKnown = KNOWN_COORDS[name] || cache[name];

                // Solo delay si la anterior fue una llamada a Nominatim
                if (needsDelay) {
                    await new Promise(r => setTimeout(r, 1100));
                }

                const coords = await geocode(name, cache);
                needsDelay = !isKnown; // Solo true si acabo de llamar a Nominatim

                if (!coords) continue;

                const growth = Number(d.growth_rate) || 0;
                const isPositive = growth >= 0;

                const icon = L.divIcon({
                    className: '',
                    html: `<div style="
                        width: 14px; height: 14px;
                        background: ${isPositive ? '#2ecc71' : '#e74c3c'};
                        border: 2px solid white;
                        border-radius: 50%;
                        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
                    "></div>`,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                });

                const marker = L.marker(coords, { icon }).addTo(map);

                marker.bindPopup(`
                    <strong>${d.country_name}</strong> (${d.year})<br>
                    Natalidad: ${d.crude_birth_rate} ‰<br>
                    Mortalidad: ${d.crude_death_rate} ‰<br>
                    Crecimiento: <span style="color:${isPositive ? 'green' : 'red'}">
                        ${growth > 0 ? '+' : ''}${growth.toFixed(3)}%
                    </span>
                `);

                marker.bindTooltip(`${d.country_name} (${d.year})`, { direction: 'top', offset: [0, -10] });
            }

        } catch (e) {
            // @ts-ignore
            error = "Error de conexión con la API.";
            loading = false;
        }
    });
</script>

<main style="padding: 20px;">
    <h2>Mapa Geoespacial (LPH)</h2>
    <p>Ubicación geográfica de los países — verde = crecimiento positivo, rojo = negativo.</p>

    {#if loading}
        <p>Cargando mapa...</p>
    {:else if error}
        <p style="color: red;">{error}</p>
    {/if}

    <div id="map-container" style="width: 100%; height: 550px; border-radius: 8px; border: 1px solid #ddd;"></div>
</main>
