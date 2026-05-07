<svelte:head>
    <title>About - Grupo 12 SOS</title>
</svelte:head>

<style>
    main { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h1, h2 { color: #333; text-align: center; }
    .description { text-align: center; color: #666; margin-bottom: 2rem; line-height: 1.6; }
    .repo-link { display: block; text-align: center; margin-bottom: 2rem; font-size: 1.2rem; font-weight: bold; }
    
    .table-container { overflow-x: auto; margin-bottom: 3rem; }
    table { width: 100%; border-collapse: collapse; min-width: 800px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: center; vertical-align: middle; }
    th { background-color: #f4f4f4; color: #333; }
    
    .github-section { background: #f9f9f9; padding: 1.5rem; border-radius: 8px; border: 1px solid #eee; }
    ul { list-style: none; padding: 0; }
    li { margin-bottom: 0.5rem; }
    
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    
    iframe { border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
</style>

<main>
    <h1>Sobre el Proyecto</h1>
    
    <p class="description">
        Este proyecto es desarrollado por el Grupo 12 de SOS. Nuestro objetivo es la integración de diversas 
        fuentes de datos mediante APIs para visualizar estadísticas globales.
    </p>

    <a class="repo-link" href="https://github.com/gti-sos/SOS2526-12" target="_blank">
        🔗 Repositorio de GitHub del Equipo
    </a>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Miembro</th>
                    <th>Fuente de Datos</th>
                    <th>Enlaces</th>
                    <th>Video Explicativo</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Francisco Mediavilla García</td>
                    <td>age-specific-fertility</td>
                    <td>
                        <a href="/age-specific-fertility-rates">Front</a> | 
                        <a href="/api/v2/age-specific-fertility-rates" target="_blank">API</a> | 
                        <a href="/api/v2/age-specific-fertility-rates/docs" target="_blank">Docs</a>
                    </td>
                    <td>
                        <iframe width="250" height="140" src="https://www.youtube.com/embed/0jUWPDm4aFQ" frameborder="0" allowfullscreen></iframe>
                    </td>
                </tr>
                <tr>
                    <td>Lucca Pereira</td>
                    <td>birth-death-growth</td>
                    <td>
                        <a href="/birth-death-growth-rates">Front</a> | 
                        <a href="/api/v2/birth-death-growth-rates" target="_blank">API</a> | 
                        <a href="/api/v2/birth-death-growth-rates/docs" target="_blank">Docs</a>
                    </td>
                    <td>
                        <iframe width="250" height="140" src="https://youtu.be/embed/b8FMQ9GPf60" frameborder="0" allowfullscreen></iframe>
                    </td>
                </tr>
                <tr>
                    <td>Javier Jimenez</td>
                    <td>mid-population-ages</td>
                    <td>
                        <a href="/mid-population-ages">Front</a> | 
                        <a href="/api/v2/mid-population-ages" target="_blank">API</a> | 
                        <a href="/api/v2/mid-population-ages/docs" target="_blank">Docs</a>
                    </td>
                    <td>
                        <iframe width="250" height="140" src="https://www.youtube.com/embed/TU_ID_AQUI" frameborder="0" allowfullscreen></iframe>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <section class="github-section">
        <h2>Perfiles de GitHub de los Miembros</h2>
        <ul>
            <li><strong>Francisco Mediavilla García:</strong> <a href="https://github.com/CMediavilla16" target="_blank">@Francisco</a></li>
            <li><strong>Lucca Pereira:</strong> <a href="https://github.com/Lucca-Pereira-2" target="_blank">@Lucca</a></li>
            <li><strong>Javier Jimenez:</strong> <a href="https://github.com/javier12012001" target="_blank">@Javier</a></li>
        </ul>
    </section>
</main>
