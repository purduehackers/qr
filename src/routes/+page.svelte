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

	// In dark mode, default the QR to white-on-black so it matches the page theme.
	// Done on mount (client only) so SSR keeps the light defaults and the color
	// swatches don't hydrate-mismatch; runs before any user interaction, so it's
	// only a default — picking a colour afterwards sticks.
	onMount(() => {
		if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			color = '#ffffff';
			bgColor = '#000000';
		}
	});
</script>

<svelte:head>
	<title>just a purdue hackers QR code generator</title>
</svelte:head>

<div class="page">
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
			<p class="title">just a purdue hackers QR code generator</p>
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
		--tex-opacity: 1;
		position: relative;
		min-height: 100vh;
		width: 100%;
		background-color: var(--surface);
		overflow: hidden;
	}

	@media (prefers-color-scheme: dark) {
		.page {
			--ink: #fbf7ec;
			--surface: #000000;
			--muted: #d8cdae;
			--accent: #fcd202;
			--track: #4e4949;
			--divider: #4e4949;
			--tex-opacity: 0.1;
		}
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
		transition: border-width 0.15s linear, border-color 0.15s linear;
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
			flex-direction: column;
			padding: 120px 24px 48px;
			gap: 24px;
		}
		.title {
			white-space: normal;
		}
	}
</style>
