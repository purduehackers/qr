<script lang="ts">
	import { onMount } from 'svelte';
	import QrCode from '$lib/components/QrCode.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
	import ColorSwatch from '$lib/components/ColorSwatch.svelte';
	import Slider from '$lib/components/Slider.svelte';
	import NoiseTexture from '$lib/components/NoiseTexture.svelte';

	// Logo options are whatever is available in the logos folder — drop a
	// logo3.png into src/lib/assets/logos and it shows up automatically.
	const logoModules = import.meta.glob('/src/lib/assets/logos/*.{png,jpg,jpeg,svg,webp}', {
		eager: true,
		query: '?url',
		import: 'default'
	}) as Record<string, string>;
	const logos = Object.entries(logoModules)
		.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
		.map(([path, url]) => ({ url, name: path.split('/').pop() ?? '' }));

	let text = $state('');
	let selected = $state(0);
	let transparent = $state(false);
	let color = $state('#000000');
	let bgColor = $state('#ffffff');
	let invertLogo = $state(false);
	// Logo size as a fraction of the QR width. The QR component clamps it so the mark
	// never covers the finder patterns (so on a small QR the top of the range is a no-op).
	let logoSize = $state(0.3);

	// Explicit theme override. `null` until mount = follow the OS via the CSS media
	// query (no class → no hydration flash). Once set, the .light/.dark class on
	// .page wins over the media query.
	let theme = $state<'light' | 'dark' | null>(null);

	// In dark mode, default the QR to white-on-black so it matches the page theme.
	// Done on mount (client only) so SSR keeps the light defaults and the color
	// swatches don't hydrate-mismatch; runs before any user interaction, so it's
	// only a default — picking a colour afterwards sticks.
	onMount(() => {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		if (prefersDark) {
			color = '#ffffff';
			bgColor = '#000000';
		}
		theme = prefersDark ? 'dark' : 'light';
	});

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
	}
</script>

<svelte:head>
	<title>Purdue Hackers QR</title>
</svelte:head>

<div
	class="page relative min-h-screen w-full overflow-hidden bg-surface"
	class:light={theme === 'light'}
	class:dark={theme === 'dark'}
>
	<NoiseTexture seed={text} />

	<header
		class="absolute top-[29px] left-0 z-[1] flex w-full items-start justify-between px-6 max-[800px]:top-5"
	>
		<div class="relative h-[31px] w-[31px] shrink-0" aria-label="Purdue Hackers">
			<span class="absolute h-[10.333px] w-[10.333px] bg-ink" style="left: 0; top: 20.667px;"></span>
			<span class="absolute h-[10.333px] w-[10.333px] bg-ink" style="left: 10.333px; top: 10.333px;"></span>
			<span class="absolute h-[10.333px] w-[10.333px] bg-ink" style="left: 20.667px; top: 10.333px;"></span>
			<span class="absolute h-[10.333px] w-[10.333px] bg-ink" style="left: 20.667px; top: 20.667px;"></span>
			<span class="absolute h-[10.333px] w-[10.333px] bg-ink" style="left: 10.333px; top: 0;"></span>
		</div>
		<div class="flex w-[387px] flex-col items-end gap-1.5 max-[800px]:w-auto max-[800px]:gap-1">
			<p class="m-0 font-pixel text-[20px] whitespace-nowrap text-ink max-[800px]:text-[15px] max-[800px]:leading-[1.2]">
				<span class="max-[800px]:hidden">just a purdue hackers QR code generator</span>
				<span class="hidden max-[800px]:inline">purdue hackers QR code generator</span>
			</p>
			<a class="font-pixel text-xs text-muted underline max-[800px]:text-[10px]" href="#">check out da github</a>
		</div>
	</header>

	<main
		class="absolute inset-0 z-[1] flex items-center justify-center gap-5 max-[800px]:static max-[800px]:flex-col-reverse max-[800px]:gap-6 max-[800px]:px-6 max-[800px]:pt-24 max-[800px]:pb-12"
	>
		<section class="flex w-[358px] flex-col items-start gap-3 max-[800px]:w-full max-[800px]:max-w-[420px]">
			<div class="flex w-full flex-col items-start gap-1">
				<p class="m-0 w-full font-relax text-base text-ink">Enter QR code data</p>
				<div class="h-[93px] w-full overflow-clip border-2 border-ink bg-surface p-2">
					<textarea
						class="h-full w-full resize-none border-none bg-transparent p-0 font-neutral text-base text-ink outline-none placeholder:font-neutral placeholder:text-base placeholder:text-[#767676] placeholder:italic placeholder:opacity-100"
						bind:value={text}
						placeholder="mrrow mrrp meow"
					></textarea>
				</div>
			</div>

			<div class="flex w-full flex-col items-start gap-1">
				<p class="m-0 w-full font-relax text-base text-ink">Settings</p>
				<div class="flex w-full flex-col items-start gap-2 overflow-clip border-2 border-ink bg-surface p-2">
					<div class="flex h-[50px] items-end gap-2">
						{#each logos as logo, i (logo.name)}
							<button
								type="button"
								class="flex h-[50px] w-[50px] cursor-pointer items-center justify-center overflow-clip bg-surface p-0 transition-[border-color,border-width] duration-[50ms] ease-linear {selected ===
								i
									? 'border-4 border-accent'
									: 'border border-ink'}"
								aria-pressed={selected === i}
								aria-label={`Use ${logo.name}`}
								onclick={() => (selected = i)}
							>
								<img class="h-full w-full object-contain" src={logo.url} alt="" />
							</button>
						{/each}
					</div>

					<div class="h-px w-full bg-divider"></div>

					<div class="flex w-full flex-col items-start gap-2">
						<!-- Logo size slider hidden for now; the QR uses the logoSize default from the script. -->
						<!-- <Slider bind:value={logoSize} min={0.15} max={0.4} step={0.01} label="logo size" /> -->
						<Toggle bind:checked={invertLogo} label="invert logo" />
						<ColorSwatch bind:value={color} label="color" />
						<ColorSwatch bind:value={bgColor} label="background color" disabled={transparent} />
						<Toggle bind:checked={transparent} label="transparent bg" />
					</div>
				</div>
			</div>

			<a class="w-full font-neutral text-xs text-accent underline" href="#">Need an API?</a>
		</section>

		<QrCode
			{text}
			logoUrl={logos[selected]?.url}
			logoName={logos[selected]?.name}
			logoFraction={logoSize}
			{color}
			{bgColor}
			{transparent}
			{invertLogo}
		/>
	</main>

	<button
		type="button"
		class="fixed right-6 bottom-6 z-[2] flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-ink bg-surface p-0 text-ink"
		onclick={toggleTheme}
		aria-label="Toggle dark mode"
	>
		{#if theme === 'dark'}
			<!-- sun — click to switch to light -->
			<svg
				class="block h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="4" />
				<path
					d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
				/>
			</svg>
		{:else}
			<!-- moon — click to switch to dark -->
			<svg
				class="block h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
			</svg>
		{/if}
	</button>
</div>
