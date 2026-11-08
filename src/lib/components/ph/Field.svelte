<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let {
		label,
		for: htmlFor,
		hint,
		error,
		children,
		class: className
	}: {
		label: string;
		for?: string;
		hint?: string;
		error?: string;
		children: Snippet;
		class?: string;
	} = $props();
</script>

<div class={['flex flex-col gap-1.5', className]}>
	<label for={htmlFor} class="ph-subheadline text-[12px]">{label}</label>
	{@render children()}
	{#if error}
		<p class="flex items-center gap-1.5 text-[13px]">
			<Icon name="exclamation-triangle" class="size-3.5 text-ph-orange" />
			{error}
		</p>
	{:else if hint}
		<p class="text-[13px]">{hint}</p>
	{/if}
</div>
