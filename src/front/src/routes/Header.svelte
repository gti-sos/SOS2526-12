<nav class="navbar">
    <div class="logo">
        <a href="/">🌍 SOS2526-12</a>
    </div>
    
    <ul class="nav-links">
        <li><a href="/">Inicio</a></li>
        
        <li><a href="/analytics">Analíticas</a></li>
        <li><a href="/integrations">Integraciones</a></li>
        <li><a href="/about">About</a></li>
    </ul>
</nav>

<style>
    .navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #0f172a; /* Azul oscuro elegante */
        padding: 1rem 2rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        position: sticky;
        top: 0;
        z-index: 1000;
    }

    .logo a {
        font-size: 1.5rem;
        font-weight: 700;
        text-decoration: none;
        color: white;
        letter-spacing: 0.5px;
    }

    .nav-links {
        list-style: none;
        display: flex;
        gap: 2rem;
        margin: 0;
        padding: 0;
    }

    .nav-links a {
        text-decoration: none;
        color: #cbd5e1; /* Gris claro */
        font-weight: 500;
        font-size: 1rem;
        transition: color 0.3s ease, border-bottom 0.3s ease;
        padding-bottom: 0.25rem;
    }

    .nav-links a:hover {
        color: #0ea5e9; /* Azul brillante al pasar el ratón */
        border-bottom: 2px solid #0ea5e9;
    }

    /* Diseño responsive para móviles */
    @media (max-width: 768px) {
        .navbar {
            flex-direction: column;
            gap: 1rem;
        }
        .nav-links {
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
        }
    }
</style>