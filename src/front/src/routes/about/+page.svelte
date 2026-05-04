<svelte:head>
    <title>Grupo 12 SOS</title>
</svelte:head>


<style>
    main {
        font-family: Arial, sans-serif;
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
    }
    h1 {
        color: #333;
        text-align: center;
    }
    .repo-link {
        display: block;
        text-align: center;
        margin-bottom: 2rem;
        font-size: 1.2rem;
        font-weight: bold;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }
    th, td {
        border: 1px solid #ddd;
        padding: 12px;
        text-align: left;
    }
    th {
        background-color: #f4f4f4;
        color: #333;
    }
    tr:hover {
        background-color: #f9f9f9;
    }
    a {
        color: #0066cc;
        text-decoration: none;
    }
    a:hover {
        text-decoration: underline;
    }
</style>

<main>
    <h1>About</h1>

    <table>
        <thead>
            <tr>
                <th>Miembro del Equipo</th>
                <th>Fuente de Datos (Recurso)</th>
                <th>Video</th>

            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Francisco Mediavilla García</td>
                <td>age-specific-fertility-rates</td>
                <td><a href="[Link_video]"> Link </a></td>

            </tr>

            <tr>
                <td>Lucca Pereira</td>
                <td>birth-death-growth-rates</td>
                <td><a href="https://youtu.be/gEJI84i89i8"> Link </a></td>

            </tr>

            <tr>
                <td>Javier Jimenez</td>
                <td>mid-population-ages</td>
                <td><a href="[Link_video]"> Link </a></td>
                
            </tr>
        </tbody>
    </table>
</main>