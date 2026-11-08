<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';
	import { icons, type IconName } from './icons';

	let {
		name,
		label,
		class: className,
		...rest
	}: SVGAttributes<SVGSVGElement> & { name: IconName; label?: string } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	fill="currentColor"
	shape-rendering="crispEdges"
	class={['size-4 shrink-0', className]}
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : true}
	focusable="false"
	{...rest}
>
	{@html icons[name]}
</svg>
