<script>
    // @ts-ignore
    let fertility = $state([]);

    import {dev} from "$app/environment";

    let API = '/api/v1/age-specific-fertility-rates';

    if (dev)
        API = "http://localhost:3000" + API;

async function getFertility(){
        const res = await fetch(API, {
            method: "GET"
        });

        const data = await res.json();

        fertility = data;

    }

</script>


<h1>Fertility Rates</h1>

<ul>
{#each fertility as fert (fert.country_code)}
    <li>{fert.country_code} - {fert.country_name}</li>
{/each}
</ul>

<button onclick={getFertility}>Refresh</button>
