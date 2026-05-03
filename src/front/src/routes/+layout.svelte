<script>
	import favicon from '$lib/assets/favicon.svg';
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Header></Header>
{@render children()}
<Footer></Footer>

<style>
    /* Hace que la web ocupe al menos el 100% de la altura de la pantalla */
    :global(body), :global(html) {
        margin: 0;
        padding: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: #f8fafc;
        font-family: system-ui, -apple-system, sans-serif;
    }

    /* El contenedor principal donde va {@render children()} */
    :global(body > div) {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    /* Hace que el contenido de la página empuje al footer hacia abajo */
    :global(main) {
        flex: 1;
    }
</style>