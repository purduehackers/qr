<script lang="ts">
	import { onMount } from 'svelte';
	import type { AwesomeQR as AwesomeQRClass } from 'awesome-qr';
	import copyIcon from '$lib/assets/icon-copy.svg';
	import downloadIcon from '$lib/assets/icon-download.svg';

	let {
		text = '',
		logoUrl = undefined,
		logoName = '',
		color = '#000000',
		bgColor = '#ffffff',
		transparent = false,
		invertLogo = false
	}: {
		text?: string;
		logoUrl?: string;
		logoName?: string;
		color?: string;
		bgColor?: string;
		transparent?: boolean;
		invertLogo?: boolean;
	} = $props();

	let qrSrc = $state('');
	// The card's checkerboard / background must track the *displayed* image, not the
	// live props. The QR is an async render that lands ~150ms after a toggle, so
	// styling the card off the prop makes the checkerboard flash on/off out of sync
	// with the image. These mirror the transparency/bg baked into the current qrSrc.
	let shownTransparent = $state(false);
	// Seeded with the default bg; the first render commits the real value (see below).
	let shownBg = $state('#ffffff');

	function hexToRgb(hex: string) {
		const m = hex.replace('#', '');
		const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
		return {
			r: parseInt(full.slice(0, 2), 16),
			g: parseInt(full.slice(2, 4), 16),
			b: parseInt(full.slice(4, 6), 16)
		};
	}

	// Perceived luminance (0-1). Light colors would vanish on the QR's white logo
	// backdrop, so above 0.5 we invert the logo to keep it readable.
	function luminance({ r, g, b }: { r: number; g: number; b: number }) {
		return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
	}

	function loadImage(url: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = url;
		});
	}

	// Recolor the logo so it matches the chosen QR color while keeping its shape.
	// The source logo is black-on-white; by default its dark pixels become the
	// fill color and the light background fades to transparent (original luminance
	// drives alpha for smooth edges). When `invert` is set the tones are flipped
	// first — white becomes black and black becomes white — so a light QR color
	// paints the background and knocks the mark out instead of vanishing on white.
	async function tintLogo(
		url: string,
		fill: { r: number; g: number; b: number },
		invert: boolean,
		markFraction = 0.8,
		preserveFrame = false
	): Promise<string> {
		const img = await loadImage(url);
		const w = img.naturalWidth || 600;
		const h = img.naturalHeight || 600;
		const scan = document.createElement('canvas');
		scan.width = w;
		scan.height = h;
		const sctx = scan.getContext('2d');
		if (!sctx) return url;
		sctx.drawImage(img, 0, 0, w, h);
		const sd = sctx.getImageData(0, 0, w, h).data;

		// Find the tight bounding box of the dark mark, ignoring the PNG's built-in
		// whitespace, and build a recolored mark (fg where dark, transparent else).
		// `preserveFrame` logos opt out: we keep the full source canvas so the logo's
		// native aspect ratio and spacing survive (tight-cropping a non-square mark
		// otherwise makes it fill the square tile and look rectangular).
		let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
		if (!preserveFrame) {
			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					const i = (y * w + x) * 4;
					if (sd[i + 3] < 128) continue;
					if (luminance({ r: sd[i], g: sd[i + 1], b: sd[i + 2] }) < 0.5) {
						if (x < minX) minX = x;
						if (x > maxX) maxX = x;
						if (y < minY) minY = y;
						if (y > maxY) maxY = y;
						found = true;
					}
				}
			}
		}
		if (!found) {
			minX = 0;
			minY = 0;
			maxX = w - 1;
			maxY = h - 1;
		}
		const bw = maxX - minX + 1;
		const bh = maxY - minY + 1;
		const mark = document.createElement('canvas');
		mark.width = bw;
		mark.height = bh;
		const mctx = mark.getContext('2d');
		if (!mctx) return url;
		const markData = mctx.createImageData(bw, bh);
		const m = markData.data;
		for (let y = 0; y < bh; y++) {
			for (let x = 0; x < bw; x++) {
				const si = ((minY + y) * w + (minX + x)) * 4;
				const di = (y * bw + x) * 4;
				const coverage = 1 - luminance({ r: sd[si], g: sd[si + 1], b: sd[si + 2] });
				m[di] = fill.r;
				m[di + 1] = fill.g;
				m[di + 2] = fill.b;
				m[di + 3] = Math.round(coverage * sd[si + 3]);
			}
		}
		mctx.putImageData(markData, 0, 0);

		// Place the mark into a square tile at the requested fraction (leaving the
		// margin), then either keep it (normal) or knock it out of a filled tile.
		const OUT = 600;
		const out = document.createElement('canvas');
		out.width = OUT;
		out.height = OUT;
		const octx = out.getContext('2d');
		if (!octx) return url;
		const scale = (markFraction * OUT) / Math.max(bw, bh);
		const dw = bw * scale;
		const dh = bh * scale;
		const dx = (OUT - dw) / 2;
		const dy = (OUT - dh) / 2;
		if (invert) {
			octx.fillStyle = `rgb(${fill.r},${fill.g},${fill.b})`;
			octx.fillRect(0, 0, OUT, OUT);
			octx.globalCompositeOperation = 'destination-out';
			octx.drawImage(mark, dx, dy, dw, dh);
		} else {
			octx.drawImage(mark, dx, dy, dw, dh);
		}
		return out.toDataURL('image/png');
	}

	// awesome-qr's package "main" pulls in node-canvas; the prebuilt browser
	// bundle ships a self-contained canvas shim, so load that one client-side.
	let AwesomeQR: typeof AwesomeQRClass | null = null;

	onMount(async () => {
		// @ts-ignore: the prebuilt browser bundle ships no type declarations
		const mod = await import('awesome-qr/dist/awesome-qr.js');
		AwesomeQR = mod.AwesomeQR ?? mod.default?.AwesomeQR ?? mod.default;
		scheduleGenerate([text, logoUrl, logoName, transparent, color, bgColor, invertLogo]);
	});

	const SIZE = 1024;
	const LOGO_FRACTION = 0.3; // logo spans ~30% of the QR
	// Per-logo gap (in QR modules) between the mark and the surrounding modules.
	const LOGO_MARGIN_MODULES: Record<string, number> = { 'logo2.png': 0 };
	const DEFAULT_LOGO_MARGIN = 1;
	// Logos that carry their own framing/whitespace: keep the full source canvas
	// instead of tight-cropping, so their native aspect ratio is respected.
	const LOGO_PRESERVE_FRAME = new Set(['logo2.png']);

	// Sentinel background for transparent mode — must be far from the QR colour
	// (raw and washed forms) so stripping it can't affect the dark modules.
	function pickSentinel(fgHex: string): string {
		const fg = hexToRgb(fgHex);
		const candidates = ['#00ff01', '#ff00fe', '#01ffff'];
		for (const s of candidates) {
			const raw = hexToRgb(s);
			const washed = { r: raw.r * 0.4 + 153, g: raw.g * 0.4 + 153, b: raw.b * 0.4 + 153 };
			const dist = (a: typeof fg) => (fg.r - a.r) ** 2 + (fg.g - a.g) ** 2 + (fg.b - a.b) ** 2;
			if (dist(raw) > 60 ** 2 && dist(washed) > 60 ** 2) return s;
		}
		return candidates[0];
	}

	// A tiny solid-colour data URL used as the QR background image.
	function solidColor(hex: string): string {
		const c = document.createElement('canvas');
		c.width = 16;
		c.height = 16;
		const ctx = c.getContext('2d');
		if (ctx) {
			ctx.fillStyle = hex;
			ctx.fillRect(0, 0, 16, 16);
		}
		return c.toDataURL('image/png');
	}

	// awesome-qr unconditionally washes light modules with rgba(255,255,255,0.6)
	// (invisible on white, a two-tone artifact on coloured backgrounds). Undo it.
	// Opaque mode: map pixels matching the washed background back to the exact
	// background. Transparent mode: the render used a solid sentinel background,
	// and the true output is fg-at-varying-alpha — so unmix every pixel as a blend
	// of fg over a background variant and keep only the fg contribution.
	async function normalizeColors(
		dataUrl: string,
		fgHex: string,
		bgHex: string,
		tr: boolean,
		size: number
	): Promise<string> {
		const img = await loadImage(dataUrl);
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d');
		if (!ctx) return dataUrl;
		ctx.drawImage(img, 0, 0, size, size);
		const id = ctx.getImageData(0, 0, size, size);
		const d = id.data;
		const bg = hexToRgb(bgHex);
		// Background as-is, plus one and two passes of the 0.6-white wash.
		const variants = [
			bg,
			{ r: bg.r * 0.4 + 153, g: bg.g * 0.4 + 153, b: bg.b * 0.4 + 153 },
			{ r: bg.r * 0.16 + 214.2, g: bg.g * 0.16 + 214.2, b: bg.b * 0.16 + 214.2 }
		];

		if (tr) {
			const fg = hexToRgb(fgHex);
			// A pixel matching the (washed) sentinel background is a light module and
			// must go fully transparent. This guard is essential when fg is light: the
			// library's white wash pushes light modules along the bg→white line, which
			// is collinear with bg→fg, so the projection below can't tell a washed
			// background from ~60%-opaque foreground and would leave a white tint.
			const nearBg = (
				p: { r: number; g: number; b: number },
				v: { r: number; g: number; b: number }
			) => Math.abs(p.r - v.r) <= 16 && Math.abs(p.g - v.g) <= 16 && Math.abs(p.b - v.b) <= 16;
			for (let i = 0; i < d.length; i += 4) {
				if (d[i + 3] === 0) continue;
				const p = { r: d[i], g: d[i + 1], b: d[i + 2] };
				if (nearBg(p, variants[0]) || nearBg(p, variants[1]) || nearBg(p, variants[2])) {
					d[i + 3] = 0;
					continue;
				}
				// Project p onto the line S→fg for each background variant; keep the
				// best fit's blend factor t as the pixel's alpha.
				let bestT = 1;
				let bestRes = Infinity;
				for (const S of variants) {
					const vr = fg.r - S.r,
						vg = fg.g - S.g,
						vb = fg.b - S.b;
					const len2 = vr * vr + vg * vg + vb * vb;
					if (len2 < 1) continue;
					let t = ((p.r - S.r) * vr + (p.g - S.g) * vg + (p.b - S.b) * vb) / len2;
					t = Math.max(0, Math.min(1, t));
					const er = p.r - (S.r + vr * t),
						eg = p.g - (S.g + vg * t),
						eb = p.b - (S.b + vb * t);
					const res = er * er + eg * eg + eb * eb;
					if (res < bestRes) {
						bestRes = res;
						bestT = t;
					}
				}
				d[i] = fg.r;
				d[i + 1] = fg.g;
				d[i + 2] = fg.b;
				d[i + 3] = Math.round(bestT * d[i + 3]);
			}
		} else {
			const near = (px: number, target: number) => Math.abs(px - target) <= 8;
			const matches = (i: number, v: { r: number; g: number; b: number }) =>
				near(d[i], v.r) && near(d[i + 1], v.g) && near(d[i + 2], v.b);
			for (let i = 0; i < d.length; i += 4) {
				if (d[i + 3] === 0) continue;
				if (matches(i, variants[1]) || matches(i, variants[2])) {
					d[i] = bg.r;
					d[i + 1] = bg.g;
					d[i + 2] = bg.b;
				}
			}
		}
		ctx.putImageData(id, 0, 0);
		return canvas.toDataURL('image/png');
	}

	// Module count depends only on the text, so cache it and skip the measure
	// render when just colours/logo change.
	let cachedContent: string | null = null;
	let cachedModuleCount = 0;

	type GenArgs = [string, string | undefined, string, boolean, string, string, boolean];

	// Serialize renders: overlapping awesome-qr draws corrupt its shared encoder
	// state (the stray-colour artifacts). Coalesce to the latest requested args.
	let running = false;
	let pendingArgs: GenArgs | null = null;

	function scheduleGenerate(a: GenArgs) {
		pendingArgs = a;
		if (running) return;
		runQueue();
	}
	async function runQueue() {
		running = true;
		try {
			while (pendingArgs) {
				const a = pendingArgs;
				pendingArgs = null;
				await generate(...a);
			}
		} finally {
			running = false;
		}
	}

	async function generate(
		t: string,
		lUrl: string | undefined,
		lName: string,
		tr: boolean,
		c: string,
		bg: string,
		inv: boolean
	) {
		const QR = AwesomeQR;
		if (!QR) return;
		const content = t || 'mrrow mrrp meow';
		// Transparent mode renders on a sentinel colour that normalizeColors()
		// later strips to true transparency — avoids the library's translucent
		// light modules leaking into the output. Pick one far from the QR colour
		// so normalization can't swallow dark modules.
		const bgEffective = tr ? pickSentinel(c) : bg;
		// No outer quiet zone so the module grid starts at the image edge — that
		// keeps grid detection simple and the QR fills the preview card.
		const commonOpts = {
			text: content,
			margin: 0,
			correctLevel: QR.CorrectLevel.H,
			colorDark: c,
			colorLight: 'rgba(0,0,0,0)',
			backgroundImage: solidColor(bgEffective),
			autoColor: false,
			whiteMargin: false,
			// The default cornerAlignment "protector" paints rgba(255,255,255,0.6)
			// blobs — invisible on white but visible on coloured backgrounds.
			components: {
				data: { scale: 1 },
				timing: { scale: 1, protectors: false },
				alignment: { scale: 1, protectors: false },
				cornerAlignment: { scale: 1, protectors: false }
			}
		};
		try {
			// Measure the module grid once per text (cached), so colour/logo changes
			// are a single render.
			let moduleCount = cachedModuleCount;
			if (content !== cachedContent || moduleCount <= 0) {
				const measured = await new QR({ ...commonOpts, size: SIZE }).draw();
				if (typeof measured !== 'string') return;
				moduleCount = await detectModuleCount(measured, c, bgEffective, false);
				cachedContent = content;
				cachedModuleCount = moduleCount;
			}

			// Render at an exact integer multiple of the module count so every module
			// is a whole number of pixels — no fractional-boundary seams.
			const cellPx = Math.max(1, Math.floor(SIZE / moduleCount));
			const renderSize = cellPx * moduleCount;
			const opts: Record<string, unknown> = { ...commonOpts, size: renderSize };

			if (lUrl) {
				let tileModules = Math.round(moduleCount * LOGO_FRACTION);
				if (tileModules % 2 === 0) tileModules += 1; // odd → stays centred
				// Gap to surrounding modules; per-logo (logo2 fills the tile fully).
				const marginModules = LOGO_MARGIN_MODULES[lName] ?? DEFAULT_LOGO_MARGIN;
				const markFraction = (tileModules - 2 * marginModules) / tileModules;
				const preserveFrame = LOGO_PRESERVE_FRAME.has(lName);
				opts.logoImage = await tintLogo(lUrl, hexToRgb(c), inv, markFraction, preserveFrame);
				opts.logoScale = tileModules / moduleCount;
				opts.logoMargin = 0;
				opts.logoCornerRadius = 0;
			}

			const result = await new QR(opts).draw();
			if (typeof result === 'string') {
				qrSrc = await normalizeColors(result, c, bgEffective, tr, renderSize);
				// Commit the card styling together with the image so they never disagree.
				shownTransparent = tr;
				shownBg = bg;
			}
		} catch (err) {
			console.error('QR generation failed', err);
		}
	}

	// Infer the QR's module count from a rendered data URL by measuring the width
	// of the top-left finder pattern (a 7-module run at the top edge).
	async function detectModuleCount(
		dataUrl: string,
		fgHex: string,
		bgHex: string,
		tr: boolean
	): Promise<number> {
		const img = await loadImage(dataUrl);
		const canvas = document.createElement('canvas');
		canvas.width = SIZE;
		canvas.height = SIZE;
		const ctx = canvas.getContext('2d');
		if (!ctx) return 25;
		ctx.drawImage(img, 0, 0, SIZE, SIZE);
		const fg = hexToRgb(fgHex);
		const bg = hexToRgb(bgHex);
		const y = Math.max(1, Math.round(SIZE * 0.01));
		const row = ctx.getImageData(0, y, SIZE, 1).data;
		const isFg = (x: number) => {
			const i = x * 4;
			if (row[i + 3] < 128) return false;
			if (tr) return true;
			const dF = (row[i] - fg.r) ** 2 + (row[i + 1] - fg.g) ** 2 + (row[i + 2] - fg.b) ** 2;
			const dB = (row[i] - bg.r) ** 2 + (row[i + 1] - bg.g) ** 2 + (row[i + 2] - bg.b) ** 2;
			return dF <= dB;
		};
		let run = 0;
		while (run < SIZE && isFg(run)) run++;
		if (run < 4) return 25;
		let mc = Math.round((SIZE / run) * 7);
		mc = Math.round((mc - 21) / 4) * 4 + 21; // snap to a valid QR size
		return Math.max(21, Math.min(177, mc));
	}

	// Regenerate whenever any input changes. Only text typing is debounced —
	// discrete controls (toggles, colour, logo) fire immediately so the QR keeps
	// pace with the control's own animation instead of lagging ~150ms behind.
	let prevText = '';
	$effect(() => {
		const a: GenArgs = [text, logoUrl, logoName, transparent, color, bgColor, invertLogo];
		if (!AwesomeQR) return;
		const delay = text !== prevText ? 150 : 0;
		prevText = text;
		const id = setTimeout(() => scheduleGenerate(a), delay);
		return () => clearTimeout(id);
	});

	async function copyImage() {
		if (!qrSrc) return;
		try {
			const blob = await (await fetch(qrSrc)).blob();
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
		} catch (err) {
			console.error('Copy failed', err);
		}
	}

	function downloadImage() {
		if (!qrSrc) return;
		const a = document.createElement('a');
		a.href = qrSrc;
		a.download = 'qr.png';
		a.click();
	}
</script>

<section class="preview">
	<div class="qr-card" class:checker={shownTransparent} style={shownTransparent ? undefined : `background:${shownBg}`}>
		<div class="qr">
			{#if qrSrc}
				<img src={qrSrc} alt="Generated QR code" />
			{/if}
		</div>
	</div>
	<div class="actions-card">
		<div class="preview-actions">
			<button type="button" class="icon-btn" aria-label="Copy QR code" onclick={copyImage}>
				<span class="icon" style:--icon={`url("${copyIcon}")`}></span>
			</button>
			<button type="button" class="icon-btn" aria-label="Download QR code" onclick={downloadImage}>
				<span class="icon" style:--icon={`url("${downloadIcon}")`}></span>
			</button>
		</div>
	</div>
</section>

<style>
	.preview {
		width: 385px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.qr-card,
	.actions-card {
		width: 100%;
		background: #fff;
		border: 2px solid #000;
		padding: 12px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		overflow: clip;
	}
	/* Transparent mode: show a checkerboard behind the QR so the transparency reads.
	   Mid-tone greys (not white/light-grey) so the QR stays visible whether its
	   modules are dark (light mode) or white (dark mode); fine 8px squares average
	   to a neutral grey behind each module instead of half-hiding it. */
	.qr-card.checker {
		background-color: #b8b8b8;
		background-image:
			linear-gradient(45deg, #8c8c8c 25%, transparent 25%),
			linear-gradient(-45deg, #8c8c8c 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #8c8c8c 75%),
			linear-gradient(-45deg, transparent 75%, #8c8c8c 75%);
		background-size: 8px 8px;
		background-position: 0 0, 0 4px, 4px -4px, -4px 0;
	}
	.qr {
		position: relative;
		width: 100%;
		aspect-ratio: 357 / 356;
	}
	.qr img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
		/* The source PNG has crisp integer-pixel modules, but it's downscaled to the
		   fixed card width (e.g. 1008px → ~714 device px) by a non-integer factor.
		   With smooth resampling the module edges land mid-device-pixel and get
		   averaged into grey seams ("subpixel offsets"). Force nearest-neighbour so
		   each device pixel samples one source pixel — halves the grey edge pixels
		   and keeps the grid sharp. Fallbacks first; `pixelated` wins where supported. */
		image-rendering: -webkit-optimize-contrast;
		image-rendering: crisp-edges;
		image-rendering: pixelated;
	}

	.preview-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.icon-btn {
		width: 24px;
		height: 24px;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	/* Stroke SVGs used as alpha masks so we can recolor them (accent on hover:
	   purple in light mode, yellow in dark mode). */
	.icon-btn .icon {
		width: 24px;
		height: 24px;
		display: block;
		background: #000;
		-webkit-mask: var(--icon) center / contain no-repeat;
		mask: var(--icon) center / contain no-repeat;
		transition: background-color 0.15s linear;
	}
	.icon-btn:hover .icon {
		background: var(--accent);
	}
</style>
