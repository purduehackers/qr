<script lang="ts">
	import { onMount } from 'svelte';

	// Canvas-rendered version of the old tiled bg.png: a grid of white squares,
	// each at its own random alpha, dimmed as a whole by --tex-opacity. The per-cell
	// alpha is drawn from a PRNG seeded by `seed` (the QR text), so the same content
	// always paints the same square layout and typing reshuffles where they land.
	let {
		seed = '',
		cell = 92
	}: {
		seed?: string;
		cell?: number;
	} = $props();

	let canvas: HTMLCanvasElement;

	// cyrb53-style string hash → 32-bit seed for the PRNG.
	function hashSeed(str: string): number {
		let h1 = 0xdeadbeef ^ str.length;
		let h2 = 0x41c6ce57 ^ str.length;
		for (let i = 0; i < str.length; i++) {
			const ch = str.charCodeAt(i);
			h1 = Math.imul(h1 ^ ch, 2654435761);
			h2 = Math.imul(h2 ^ ch, 1597334677);
		}
		h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
		h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
		return (h2 >>> 0) ^ (h1 >>> 0);
	}

	// mulberry32 — small, fast, deterministic PRNG returning [0, 1).
	function mulberry32(a: number) {
		return function () {
			a |= 0;
			a = (a + 0x6d2b79f5) | 0;
			let t = Math.imul(a ^ (a >>> 15), 1 | a);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	function draw() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		if (w === 0 || h === 0) return;

		const dpr = window.devicePixelRatio || 1;
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);

		// Default to the QR's fallback content so an empty box still has texture.
		const rng = mulberry32(hashSeed(seed || 'mrrow mrrp meow'));
		const cols = Math.ceil(w / cell);
		const rows = Math.ceil(h / cell);

		// White squares; the page's --tex-opacity dims the whole layer (1 light / 0.1 dark).
		ctx.fillStyle = '#ffffff';
		for (let gy = 0; gy < rows; gy++) {
			for (let gx = 0; gx < cols; gx++) {
				ctx.globalAlpha = rng();
				ctx.fillRect(gx * cell, gy * cell, cell, cell);
			}
		}
		ctx.globalAlpha = 1;
	}

	// Repaint whenever the seed (QR text) changes.
	$effect(() => {
		seed;
		cell;
		draw();
	});

	onMount(() => {
		draw();
		const ro = new ResizeObserver(() => draw());
		ro.observe(canvas);
		return () => ro.disconnect();
	});
</script>

<canvas bind:this={canvas} class="noise" aria-hidden="true"></canvas>

<style>
	.noise {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		pointer-events: none;
		/* Inherited from .page: 1 in light mode, 0.1 in dark mode. */
		opacity: var(--tex-opacity, 1);
		z-index: 0;
	}
</style>
