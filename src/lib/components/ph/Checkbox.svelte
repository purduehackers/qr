<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import './checkbox.css';

	let {
		checked = $bindable(false),
		children,
		class: className,
		...rest
	}: Omit<HTMLInputAttributes, 'type' | 'children'> & { children?: Snippet } = $props();
</script>

<label class={['inline-flex cursor-pointer items-center gap-2 leading-[1.35]', className]}>
	<input type="checkbox" class="ph-checkbox" bind:checked {...rest} />
	{@render children?.()}
</label>
