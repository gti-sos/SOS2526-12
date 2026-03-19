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
<hr>
{@render children()}
<hr>
<hr>

<Footer></Footer>

