<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { applyTheme, getTheme, setTheme } from './theme';

	let { class: className }: { class?: string } = $props();

	onMount(() => {
		const media = matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => applyTheme(getTheme());
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	});
</script>

<button
	type="button"
	aria-label="Toggle dark mode"
	title="Middle-click to follow your system"
	onclick={() => setTheme(getTheme() === 'dark' ? 'light' : 'dark')}
	onauxclick={(e) => e.button === 1 && setTheme(null)}
	class={[
		'inline-flex cursor-pointer items-center justify-center p-1.5 transition-transform duration-100 active:scale-[0.97]',
		className
	]}
>
	<Icon name="sun" class="size-4.5 dark:hidden" />
	<Icon name="moon" class="hidden size-4 -rotate-6 dark:block" />
</button>
