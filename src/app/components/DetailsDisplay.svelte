<template>
    {#if value === undefined}
        <span class="undefined">undefined</span>
    {:else if value === null}
        <span class="null">null</span>
    {:else if typeof value === 'string'}
        {value}
    {:else if typeof value === 'number'}
        {value}
    {:else if typeof value === 'boolean'}
        {#if value}
            True
        {:else}
            False
        {/if}
    {:else if Array.isArray(value)}
        <ol>
            {#each value as item}
                <li><svelte:self value={item} /></li>
            {/each}
        </ol>
    {:else if value.shardNum !== undefined && value.realmNum !== undefined && value.accountNum !== undefined }
        {value.shardNum}.{value.realmNum}.{value.accountNum}
    {:else}
        <dl>
            {#each Object.entries(value) as [valueKey, valueValue]}
                <dt>{valueKey}</dt>
                <dd><svelte:self value={valueValue} /></dd>
            {/each}
        </dl>
    {/if}
</template>

<script lang="ts">
    export let value: any;
</script>