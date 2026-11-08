<script lang="ts">
	import { onMount } from 'svelte';
	import QrCode from '$lib/components/QrCode.svelte';
	import ColorSwatch from '$lib/components/ColorSwatch.svelte';
	import Slider from '$lib/components/Slider.svelte';
	import NoiseTexture from '$lib/components/NoiseTexture.svelte';
	import Glider from '$lib/components/ph/Glider.svelte';
	import Field from '$lib/components/ph/Field.svelte';
	import Textarea from '$lib/components/ph/Textarea.svelte';
	import Checkbox from '$lib/components/ph/Checkbox.svelte';
	import Link from '$lib/components/ph/Link.svelte';
	import ThemeToggle from '$lib/components/ph/ThemeToggle.svelte';

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

	// In dark mode, default the QR to white-on-black so it matches the page theme.
	// Done on mount (client only) so SSR keeps the light defaults and the color
	// swatches don't hydrate-mismatch; runs before any user interaction, so it's
	// only a default — picking a colour afterwards sticks. The theme itself is the
	// .dark class the PH theme script puts on <html> before paint.
	onMount(() => {
		if (document.documentElement.classList.contains('dark')) {
			color = '#ffffff';
			bgColor = '#000000';
		}
	});
</script>

<div class="relative min-h-screen w-full overflow-hidden bg-background">
	<NoiseTexture seed={text} />

	<header
		class="absolute top-[29px] left-0 z-[1] flex w-full items-start justify-between px-6 max-[800px]:top-5"
	>
		<Glider label="Purdue Hackers" class="enter size-[31px]" />
		<div class="enter flex w-[387px] flex-col items-end gap-1.5 max-[800px]:w-auto max-[800px]:gap-1">
			<p class="m-0 ph-headline text-[20px] whitespace-nowrap max-[800px]:text-[15px]">
				<span class="max-[800px]:hidden">Just a Purdue Hackers QR code generator</span>
				<span class="hidden max-[800px]:inline">Purdue Hackers QR code generator</span>
			</p>
			<Link class="font-mono text-xs" href="#">Check out the GitHub</Link>
		</div>
	</header>

	<main
		class="absolute inset-0 z-[1] flex items-center justify-center gap-5 max-[800px]:relative max-[800px]:flex-col-reverse max-[800px]:gap-6 max-[800px]:px-6 max-[800px]:pt-24 max-[800px]:pb-12"
	>
		<section class="flex w-[358px] flex-col items-start gap-4 max-[800px]:w-full max-[800px]:max-w-[420px]">
			<Field label="QR code data" for="qr-text" class="enter w-full [--i:1]">
				<Textarea id="qr-text" class="resize-none" bind:value={text} placeholder="mrrow mrrp meow" />
			</Field>

			<Field label="Settings" class="enter w-full [--i:2]">
				<div class="flex w-full flex-col items-start gap-3 border border-border bg-card p-3">
					<div class="flex h-[50px] items-end gap-2" role="group" aria-label="Logo">
						{#each logos as logo, i (logo.name)}
							<button
								type="button"
								class={[
									'flex h-[50px] w-[50px] cursor-pointer items-center justify-center overflow-clip bg-background p-0 transition-[border-color,border-width] duration-150 ease-quint active:scale-[0.97]',
									selected === i ? 'border-2 border-primary' : 'border border-input'
								]}
								aria-pressed={selected === i}
								aria-label={`Use ${logo.name}`}
								onclick={() => (selected = i)}
							>
								<img class="h-full w-full object-contain" src={logo.url} alt="" />
							</button>
						{/each}
					</div>

					<div class="h-px w-full bg-border"></div>

					<div class="flex w-full flex-col items-start gap-2.5">
						<!-- Logo size slider hidden for now; the QR uses the logoSize default from the script. -->
						<!-- <Slider bind:value={logoSize} min={0.15} max={0.4} step={0.01} label="logo size" /> -->
						<Checkbox bind:checked={invertLogo}>invert logo</Checkbox>
						<ColorSwatch bind:value={color} label="color" />
						<ColorSwatch bind:value={bgColor} label="background color" disabled={transparent} />
						<Checkbox bind:checked={transparent}>transparent bg</Checkbox>
					</div>
				</div>
			</Field>

			<!-- "Need an API?" link hidden for now. -->
			<!-- <Link href="#" tint="var(--primary)">Need an API?</Link> -->
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

	<ThemeToggle class="fixed right-6 bottom-6 z-[2] border border-border bg-card" />
</div>
