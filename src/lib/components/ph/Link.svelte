<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import './link.css';

	let {
		href,
		tint,
		class: className,
		children,
		...rest
	}: HTMLAnchorAttributes & { href: string; tint?: string } = $props();

	const external = $derived(/^https?:\/\//.test(href));
</script>

<a
	{href}
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
	data-tint={tint ? '' : undefined}
	class={['ph-link', className]}
	style:--link={tint}
	{...rest}>{@render children?.()}</a
>
