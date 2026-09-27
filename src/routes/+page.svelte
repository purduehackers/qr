<script lang="ts">
	import { onMount } from 'svelte';
	import QrCode from '$lib/components/QrCode.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
	import ColorSwatch from '$lib/components/ColorSwatch.svelte';
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

<div class="page" class:light={theme === 'light'} class:dark={theme === 'dark'}>
	<NoiseTexture seed={text} />

	<header class="header">
		<div class="brand" aria-label="Purdue Hackers">
			<span class="px" style="left: 0; top: 20.667px;"></span>
			<span class="px" style="left: 10.333px; top: 10.333px;"></span>
			<span class="px" style="left: 20.667px; top: 10.333px;"></span>
			<span class="px" style="left: 20.667px; top: 20.667px;"></span>
			<span class="px" style="left: 10.333px; top: 0;"></span>
		</div>
		<div class="tagline">
			<p class="title">
				<span class="title-full">just a purdue hackers QR code generator</span>
				<span class="title-short">purdue hackers QR code generator</span>
			</p>
			<a class="github" href="#">check out da github</a>
		</div>
	</header>

	<main class="stage">
		<section class="controls">
			<div class="field">
				<p class="label">Enter QR code data</p>
				<div class="textbox">
					<textarea bind:value={text} placeholder="mrrow mrrp meow"></textarea>
				</div>
			</div>

			<div class="field">
				<p class="label">Settings</p>
				<div class="settings">
					<div class="logo-selector">
						{#each logos as logo, i (logo.name)}
							<button
								type="button"
								class="logo-box"
								class:selected={selected === i}
								aria-pressed={selected === i}
								aria-label={`Use ${logo.name}`}
								onclick={() => (selected = i)}
							>
								<img src={logo.url} alt="" />
							</button>
						{/each}
					</div>

					<div class="divider"></div>

					<div class="options">
						<Toggle bind:checked={invertLogo} label="invert logo" />
						<ColorSwatch bind:value={color} label="color" />
						<ColorSwatch bind:value={bgColor} label="background color" disabled={transparent} />
						<Toggle bind:checked={transparent} label="transparent bg" />
					</div>
				</div>
			</div>

			<a class="api-link" href="#">Need an API?</a>
		</section>

		<QrCode
			{text}
			logoUrl={logos[selected]?.url}
			logoName={logos[selected]?.name}
			{color}
			{bgColor}
			{transparent}
			{invertLogo}
		/>
	</main>

	<button
		type="button"
		class="theme-toggle"
		onclick={toggleTheme}
		aria-label="Toggle dark mode"
	>
		{#if theme === 'dark'}
			<!-- sun — click to switch to light -->
			<svg
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

<style>
	.page {
		/* Light ("white mode") theme. Dark mode overrides these below. */
		--ink: #000000;
		--surface: #fbf7ec;
		--muted: #7f7f7f;
		--accent: #7d3bff;
		--track: #cccccc;
		--divider: #949494;
		--card-bg: #ffffff;
		--tex-opacity: 1;
		position: relative;
		min-height: 100vh;
		width: 100%;
		background-color: var(--surface);
		overflow: hidden;
	}

	/* Follow the OS unless the user has picked a theme explicitly (.light/.dark). */
	@media (prefers-color-scheme: dark) {
		.page:not(.light):not(.dark) {
			--ink: #fbf7ec;
			--surface: #000000;
			--muted: #d8cdae;
			--accent: #fcd202;
			--track: #4e4949;
			--divider: #4e4949;
			--card-bg: #000000;
			--tex-opacity: 0.1;
		}
	}

	/* Explicit dark choice — wins over the media query above. */
	.page.dark {
		--ink: #fbf7ec;
		--surface: #000000;
		--muted: #d8cdae;
		--accent: #fcd202;
		--track: #4e4949;
		--divider: #4e4949;
		--card-bg: #000000;
		--tex-opacity: 0.1;
	}

	.theme-toggle {
		position: fixed;
		bottom: 24px;
		right: 24px;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: var(--surface);
		border: 2px solid var(--ink);
		color: var(--ink);
		cursor: pointer;
		z-index: 2;
	}
	.theme-toggle svg {
		width: 20px;
		height: 20px;
		display: block;
	}

	/* Header */
	.header {
		position: absolute;
		top: 29px;
		left: 0;
		width: 100%;
		padding: 0 24px;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		z-index: 1;
	}

	.brand {
		position: relative;
		width: 31px;
		height: 31px;
		flex-shrink: 0;
	}
	.brand .px {
		position: absolute;
		width: 10.333px;
		height: 10.333px;
		background: var(--ink);
	}

	.tagline {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 6px;
		width: 387px;
	}
	.title {
		margin: 0;
		font-family: 'PixelHackers', monospace;
		font-size: 20px;
		color: var(--ink);
		white-space: nowrap;
	}
	/* Full wording on desktop; the mobile media query swaps in the short one. */
	.title-short {
		display: none;
	}
	.github {
		font-family: 'PixelHackers', monospace;
		font-size: 12px;
		color: var(--muted);
		text-decoration: underline;
	}

	/* Centered two-panel stage */
	.stage {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20px;
		z-index: 1;
	}

	/* Left controls panel */
	.controls {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
		width: 358px;
	}

	.field {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		width: 100%;
	}
	.label {
		margin: 0;
		font-family: 'PolySans Relax', sans-serif;
		font-size: 16px;
		color: var(--ink);
		width: 100%;
	}

	.textbox {
		width: 100%;
		height: 93px;
		background: var(--surface);
		border: 2px solid var(--ink);
		padding: 8px;
		overflow: clip;
	}
	.textbox textarea {
		width: 100%;
		height: 100%;
		border: none;
		outline: none;
		resize: none;
		background: transparent;
		font-family: 'PolySans Neutral', sans-serif;
		font-size: 16px;
		color: var(--ink);
		padding: 0;
	}
	.textbox textarea::placeholder {
		font-family: 'PolySans Neutral', sans-serif;
		font-style: italic;
		font-size: 16px;
		color: #767676;
		opacity: 1;
	}

	/* Settings box */
	.settings {
		width: 100%;
		background: var(--surface);
		border: 2px solid var(--ink);
		padding: 8px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		overflow: clip;
	}

	.logo-selector {
		display: flex;
		align-items: flex-end;
		gap: 8px;
		height: 50px;
	}
	.logo-box {
		width: 50px;
		height: 50px;
		background: var(--surface);
		border: 1px solid var(--ink);
		padding: 0;
		cursor: pointer;
		overflow: clip;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: border-width 0.05s linear, border-color 0.05s linear;
	}
	.logo-box.selected {
		border-width: 4px;
		border-color: var(--accent);
	}
	.logo-box img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.divider {
		width: 100%;
		height: 1px;
		background: var(--divider);
	}

	.options {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		width: 100%;
	}

	.api-link {
		font-family: 'PolySans Neutral', sans-serif;
		font-size: 12px;
		color: var(--accent);
		text-decoration: underline;
		width: 100%;
	}

	@media (max-width: 800px) {
		.stage {
			position: static;
			/* QR preview on top, data + settings underneath it. */
			flex-direction: column-reverse;
			align-items: center;
			padding: 96px 24px 48px;
			gap: 24px;
		}
		/* Match the QR preview's width so the two stack equiwidth (see QrCode.svelte). */
		.controls {
			width: 100%;
			max-width: 420px;
		}

		/* Shrink the top-right title/link so it doesn't dominate the small screen. */
		.header {
			top: 20px;
		}
		.tagline {
			width: auto;
			gap: 4px;
		}
		.title {
			font-size: 15px;
			line-height: 1.2;
		}
		.title-full {
			display: none;
		}
		.title-short {
			display: inline;
		}
		.github {
			font-size: 10px;
		}
	}
</style>
