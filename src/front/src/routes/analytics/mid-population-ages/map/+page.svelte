<script>
    import { dev, browser } from '$app/environment';

    let mapContainer;

    const coordenadas = {
        "Spain": [40.4168, -3.7038],
        "España": [40.4168, -3.7038],
        "Italy": [41.8719, 12.5674],    
        "Italia": [41.8719, 12.5674],
        "France": [46.2276, 2.2137],
        "Francia": [46.2276, 2.2137],
        "Germany": [51.1657, 10.4515],
        "Alemania": [51.1657, 10.4515],
        "Afghanistan": [33.9391, 67.7100],
        "Afganistán": [33.9391, 67.7100],
        "Australia": [-25.2744, 133.7751],
        "Brazil": [-14.2350, -51.9253],
        "Brasil": [-14.2350, -51.9253],
        "Canada": [56.1304, -106.3468],
        "China": [35.8617, 104.1954],
        "India": [20.5937, 78.9629],
        "Armenia": [40.0691, 45.0382],
        "Andorra": [42.5063, 1.5218],
        "Bahrain": [26.0667, 50.5577],
        "Botswana": [-22.3285, 24.6849],
        "Bermuda": [32.3078, -64.7505],
        "Bahamas The": [25.0343, -77.3963],
        "Japan": [36.2048, 138.2529],
        "Japón": [36.2048, 138.2529],
        "Mexico": [23.6345, -102.5528],
        "México": [23.6345, -102.5528],
        "Azerbaijan": [40.1431, 47.5769],
        "United States": [37.0902, -95.7129],
        "Estados Unidos": [37.0902, -95.7129]
    };

    // Usamos el $effect de Svelte 5, que garantiza que solo se ejecuta en el navegador
    $effect(() => {
        if (!browser) return; // Doble seguridad: si no es navegador, aborta.

        // Importamos Leaflet y sus estilos de forma asíncrona y segura
        Promise.all([
            import('leaflet'),
            import('leaflet/dist/leaflet.css')
        ]).then(async ([LModule]) => {
            // Manejamos cómo Vite empaqueta la librería
            const L = LModule.default || LModule;

            const map = L.map(mapContainer).setView([20, 0], 2);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Fix para los iconos de Leaflet
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });

            // Apuntamos al backend
            let API = '/api/v2/mid-population-ages';
            if (dev) {
                API = "http://localhost:3000" + API;
            }

            try {
                const res = await fetch(API);
                if (res.ok) {
                    const data = await res.json();
                    console.log("📍 Datos recibidos para el mapa:", data);

                    data.forEach(recurso => {
                        const coords = coordenadas[recurso.country_name];
                        if (coords) {
                            const popTotal = recurso.population_age_0 + recurso.population_age_25 + recurso.population_age_50;
                            
                            L.marker(coords)
                             .addTo(map)
                             .bindPopup(`
                                <div style="text-align: center;">
                                    <strong>${recurso.country_name} (${recurso.year})</strong><br>
                                    <em>Sexo: ${recurso.sex}</em><br><br>
                                    Población (0-50 años):<br>
                                    <b style="color: #007bff; font-size: 1.1em;">${popTotal}</b>
                                </div>
                             `);
                        }
                    });
                }
            } catch (error) {
                console.error("❌ Error al cargar los datos del mapa:", error);
            }
        });
    });
</script>

<main>
    <h1>🌍 Mapa Geospacial de Población</h1>
    <div class="actions">
        <a href="/mid-population-ages" class="btn">🔙 Volver a la tabla</a>
    </div>

    <div bind:this={mapContainer} class="map"></div>
</main>

<style>
    main { max-width: 1200px; margin: auto; padding: 20px; font-family: sans-serif; }
    .map { width: 100%; height: 600px; margin-top: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1; }
    .btn { background: #6c757d; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; }
    .actions { margin-bottom: 20px; }
</style>