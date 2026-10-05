<script lang="ts">
	import { onMount } from 'svelte';
	import type { AwesomeQR as AwesomeQRClass } from 'awesome-qr';
	import copyIcon from '$lib/assets/icon-copy.svg';
	import downloadIcon from '$lib/assets/icon-download.svg';

	let {
		text = '',
		logoUrl = undefined,
		logoName = '',
		logoFraction = 0.3,
		color = '#000000',
		bgColor = '#ffffff',
		transparent = false,
		invertLogo = false
	}: {
		text?: string;
		logoUrl?: string;
		logoName?: string;
		logoFraction?: number;
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

	// The QR is displayed by re-rasterizing qrSrc onto this canvas at the card's exact
	// device-pixel size (see paintCanvas). qrSrc itself stays hi-res for copy/download.
	let qrCanvas: HTMLCanvasElement;
	let qrBox: HTMLDivElement;
	// Cached from the latest render so a resize can repaint without regenerating.
	let srcImage: HTMLImageElement | null = null;
	let srcModuleCount = 0;
	let srcCellPx = 0;
	// Side of the centred logo tile in modules (0 = no logo).
	let srcLogoTileModules = 0;
	// Free-form (line-art) logos are blitted as one smoothly-scaled image; blocky
	// logos are snapped onto the module grid and painted per-module like the QR itself
	// (see paintCanvas). This flag distinguishes the two.
	let srcLogoSmooth = false;

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
		preserveFrame = false,
		snap?: { grid: number; markModules: number; tileModules: number; cellPx: number }
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

		// Grid-snap path: rasterize the mark onto whole QR modules so its blocks line up
		// with the code instead of floating at an arbitrary scale. We read the logo's
		// native grid×grid block pattern (averaging each block's alpha, so the source
		// PNG's anti-aliasing doesn't matter) and paint each "on" block as a solid b×b-
		// module square — awesome-qr later draws this canvas 1:1 over the (module-aligned)
		// logo tile, so the blocks are module-sized and, parity permitting, on module lines.
		if (snap) {
			const { grid, markModules, tileModules, cellPx } = snap;
			const b = markModules / grid;
			const native: boolean[] = [];
			for (let gy = 0; gy < grid; gy++) {
				for (let gx = 0; gx < grid; gx++) {
					const x0 = Math.floor((gx * bw) / grid);
					const x1 = Math.max(x0 + 1, Math.floor(((gx + 1) * bw) / grid));
					const y0 = Math.floor((gy * bh) / grid);
					const y1 = Math.max(y0 + 1, Math.floor(((gy + 1) * bh) / grid));
					let sum = 0;
					let cnt = 0;
					for (let y = y0; y < y1; y++) {
						for (let x = x0; x < x1; x++) {
							sum += m[(y * bw + x) * 4 + 3];
							cnt++;
						}
					}
					native[gy * grid + gx] = cnt > 0 && sum / cnt > 127;
				}
			}
			const OUT = tileModules * cellPx;
			// Centre the mark in the tile. An even mark in an odd tile can't be both
			// centred and on module lines; we take centred — an off-centre logo reads
			// worse than blocks sitting half a module off the grid. cellPx is even, so the
			// half-module shift is still a whole number of pixels and edges stay crisp.
			const off = (OUT - markModules * cellPx) / 2;
			const snapCanvas = document.createElement('canvas');
			snapCanvas.width = OUT;
			snapCanvas.height = OUT;
			const sctx2 = snapCanvas.getContext('2d');
			if (!sctx2) return url;
			sctx2.fillStyle = `rgb(${fill.r},${fill.g},${fill.b})`;
			// invert: solid tile with the mark knocked out; normal: just the mark blocks.
			if (invert) sctx2.fillRect(0, 0, OUT, OUT);
			for (let cj = 0; cj < markModules; cj++) {
				for (let ci = 0; ci < markModules; ci++) {
					if (!native[Math.floor(cj / b) * grid + Math.floor(ci / b)]) continue;
					const px = off + ci * cellPx;
					const py = off + cj * cellPx;
					if (invert) sctx2.clearRect(px, py, cellPx, cellPx);
					else sctx2.fillRect(px, py, cellPx, cellPx);
				}
			}
			return snapCanvas.toDataURL('image/png');
		}

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
		scheduleGenerate([text, logoUrl, logoName, transparent, color, bgColor, invertLogo, logoFraction]);
	});

	// Repaint at the new device-pixel size whenever the card is resized (viewport
	// resize, mobile↔desktop layout switch) so the QR stays crisp at any width.
	$effect(() => {
		const ro = new ResizeObserver(() => schedulePaint());
		ro.observe(qrBox);
		return () => ro.disconnect();
	});

	const SIZE = 1024;
	// Per-logo gap (in QR modules) between the mark and the surrounding modules.
	const LOGO_MARGIN_MODULES: Record<string, number> = { 'logo2.png': 0 };
	const DEFAULT_LOGO_MARGIN = 1;
	// Logos that carry their own framing/whitespace: keep the full source canvas
	// instead of tight-cropping, so their native aspect ratio is respected.
	const LOGO_PRESERVE_FRAME = new Set(['logo2.png']);
	// Blocky logos built on an N×N grid of square cells → snap them onto the QR module
	// grid so each native block is a whole number of modules on module boundaries. The
	// value is the logo's native grid size (the Purdue Hackers mark is a 3×3 arrangement).
	const LOGO_GRID: Record<string, number> = { 'logo1.png': 3 };

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

	type GenArgs = [string, string | undefined, string, boolean, string, string, boolean, number];

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
		inv: boolean,
		frac: number
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
			// The encoder picks the QR version (hence the module count) as soon as the
			// instance is built, so read it straight off the model. Inferring it from a
			// rendered image was fragile: with a light QR colour the library's white wash
			// made light modules read as foreground, the finder run spanned the whole row,
			// and the count collapsed to 21 — so the logo tile and the display grid were
			// sized for the wrong QR (the misalignment, and a logo that never scaled).
			const moduleCount = (new QR(commonOpts) as unknown as { qrCode?: { moduleCount: number } })
				.qrCode?.moduleCount;
			if (!moduleCount || moduleCount <= 0) return;

			// Render at an exact integer multiple of the module count so every module
			// is a whole number of pixels — no fractional-boundary seams. Even, so a
			// half-module offset (tintLogo's snap path) is a whole pixel as well.
			const cellPx = Math.max(2, 2 * Math.floor(SIZE / 2 / moduleCount));
			const renderSize = cellPx * moduleCount;
			const opts: Record<string, unknown> = { ...commonOpts, size: renderSize };

			let tileModules = 0;
			let logoSmooth = false;
			if (lUrl) {
				const marginModules = LOGO_MARGIN_MODULES[lName] ?? DEFAULT_LOGO_MARGIN;
				const grid = LOGO_GRID[lName];
				if (grid) {
					// Blocky logo (the Purdue Hackers mark): snap it onto the module grid so
					// every native block is a whole b×b run of modules on module lines —
					// it reads as part of the QR, not a sticker on top. Block size b tracks
					// the requested fraction, then shrinks so the cleared tile never reaches
					// the finder patterns (which the scanner can't recover if covered).
					const maxTile = moduleCount - 16; // keep all three finders fully clear
					let b = Math.max(1, Math.round((moduleCount * frac) / grid));
					let markModules = grid * b;
					// The tile must be odd so it centres on a whole module (QR sizes are
					// always odd). An even mark then can't be both centred and on module
					// lines; tintLogo centres it with a half-module shift (see its snap path).
					tileModules = markModules + 2 * marginModules;
					if (tileModules % 2 === 0) tileModules += 1;
					while (b > 1 && tileModules > maxTile) {
						b -= 1;
						markModules = grid * b;
						tileModules = markModules + 2 * marginModules;
						if (tileModules % 2 === 0) tileModules += 1;
					}
					opts.logoImage = await tintLogo(lUrl, hexToRgb(c), inv, 1, false, {
						grid,
						markModules,
						tileModules,
						cellPx
					});
					opts.logoScale = tileModules / moduleCount;
					opts.logoMargin = 0;
					opts.logoCornerRadius = 0;
				} else {
					// Free-form art (line drawings): can't map to a module grid, so scale
					// it smoothly and keep its native aspect ratio.
					logoSmooth = true;
					const maxTile = moduleCount - 16; // keep the finder patterns clear
					tileModules = Math.min(maxTile, Math.round(moduleCount * frac));
					if (tileModules % 2 === 0) tileModules -= 1; // odd → stays centred
					tileModules = Math.max(1, tileModules);
					const markFraction = (tileModules - 2 * marginModules) / tileModules;
					const preserveFrame = LOGO_PRESERVE_FRAME.has(lName);
					opts.logoImage = await tintLogo(lUrl, hexToRgb(c), inv, markFraction, preserveFrame);
					opts.logoScale = tileModules / moduleCount;
					opts.logoMargin = 0;
					opts.logoCornerRadius = 0;
				}
			}

			const result = await new QR(opts).draw();
			if (typeof result === 'string') {
				qrSrc = await normalizeColors(result, c, bgEffective, tr, renderSize);
				// Cache the render's module geometry so paintCanvas (and later resizes) can
				// re-rasterize crisply. cellPx is the whole-pixel width of a module in qrSrc.
				srcImage = await loadImage(qrSrc);
				srcModuleCount = moduleCount;
				srcCellPx = cellPx;
				srcLogoTileModules = lUrl ? tileModules : 0;
				srcLogoSmooth = logoSmooth;
				// Commit the card styling together with the image so they never disagree.
				shownTransparent = tr;
				shownBg = bg;
				paintCanvas();
			}
		} catch (err) {
			console.error('QR generation failed', err);
		}
	}

	// Draw the cached QR onto the display canvas at the card's exact device-pixel size.
	// The browser downscaling the raster <img> by a non-integer factor left some modules
	// a pixel wider than others (the visible misalignment). Instead we blit each module
	// into its own rect with rounded, shared boundaries — so every module edge lands on a
	// whole device pixel and widths stay uniform. imageSmoothingEnabled=false keeps the
	// solid modules crisp.
	//
	// Free-form logos (line art) are the exception: they can't map to the module grid, so
	// slicing them per-module and nearest-neighbour scaling each slice chewed up the fine
	// art. For those we skip the logo tile in the per-module loop and blit the whole tile
	// once, smoothly, onto the exact same module boundaries the neighbours use. Blocky
	// logos are module-sized (at worst shifted half a module, see tintLogo) so they ride
	// along per-module like the QR: every cell in a column shares the same destination
	// bounds, so even a mid-cell block edge comes out straight and crisp.
	function paintCanvas() {
		if (!qrCanvas || !qrBox || !srcImage || srcModuleCount <= 0) return;
		const dpr = window.devicePixelRatio || 1;
		const cssW = qrBox.clientWidth;
		const cssH = qrBox.clientHeight;
		if (cssW === 0 || cssH === 0) return;
		const N = srcModuleCount;
		const cp = srcCellPx;
		// Backing store = card size in device pixels (never below one px per module).
		const dw = Math.max(N, Math.round(cssW * dpr));
		const dh = Math.max(N, Math.round(cssH * dpr));
		qrCanvas.width = dw;
		qrCanvas.height = dh;
		const ctx = qrCanvas.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, dw, dh);
		ctx.imageSmoothingEnabled = false;
		// Only free-form logos get the single smooth blit; blocky logos are module-sized
		// hard pixels, so tile = 0 leaves them to the per-module loop.
		// Centred logo tile spans modules [k0, k0 + tile) on both axes (odd N and odd
		// tile → k0 is a whole module, so the tile stays centred and grid-aligned).
		const tile = srcLogoSmooth ? srcLogoTileModules : 0;
		const k0 = (N - tile) / 2;
		for (let j = 0; j < N; j++) {
			const dy0 = Math.round((j * dh) / N);
			const dy1 = Math.round(((j + 1) * dh) / N);
			const jInLogo = tile > 0 && j >= k0 && j < k0 + tile;
			for (let i = 0; i < N; i++) {
				// Skip the logo tile — blitted as one image below so it stays aligned.
				if (jInLogo && i >= k0 && i < k0 + tile) continue;
				const dx0 = Math.round((i * dw) / N);
				const dx1 = Math.round(((i + 1) * dw) / N);
				ctx.drawImage(srcImage, i * cp, j * cp, cp, cp, dx0, dy0, dx1 - dx0, dy1 - dy0);
			}
		}
		if (tile > 0) {
			// Same rounded boundaries as the neighbouring modules, so the tile fills the
			// skipped gap exactly. Smoothing on: the logo is art, not a hard pixel grid.
			const dx0 = Math.round((k0 * dw) / N);
			const dx1 = Math.round(((k0 + tile) * dw) / N);
			const dy0 = Math.round((k0 * dh) / N);
			const dy1 = Math.round(((k0 + tile) * dh) / N);
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(
				srcImage,
				k0 * cp,
				k0 * cp,
				tile * cp,
				tile * cp,
				dx0,
				dy0,
				dx1 - dx0,
				dy1 - dy0
			);
		}
	}

	// Coalesce repaint requests (e.g. rapid ResizeObserver fires) into one per frame.
	let paintScheduled = false;
	function schedulePaint() {
		if (paintScheduled) return;
		paintScheduled = true;
		requestAnimationFrame(() => {
			paintScheduled = false;
			paintCanvas();
		});
	}

	// Regenerate whenever any input changes. Only text typing is debounced —
	// discrete controls (toggles, colour, logo) fire immediately so the QR keeps
	// pace with the control's own animation instead of lagging ~150ms behind.
	let prevText = '';
	$effect(() => {
		const a: GenArgs = [text, logoUrl, logoName, transparent, color, bgColor, invertLogo, logoFraction];
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

<!-- Mobile: fill the stacked column so the QR matches the controls' width. -->
<section class="flex w-[385px] flex-col gap-2 max-[800px]:w-full max-[800px]:max-w-[420px]">
	<!-- Transparent mode shows a checkerboard behind the QR (see the `checker` utility);
	     otherwise the card takes the chosen bg colour. -->
	<div
		class="flex w-full flex-col items-end overflow-clip border-2 border-ink p-3"
		class:checker={shownTransparent}
		style={shownTransparent ? undefined : `background:${shownBg}`}
	>
		<!-- The QR is re-rasterized onto this canvas at the card's exact device-pixel
		     size (see paintCanvas) so module edges stay aligned instead of getting
		     smeared by a non-integer raster downscale. -->
		<div bind:this={qrBox} class="relative aspect-[357/356] w-full">
			<canvas
				bind:this={qrCanvas}
				class="absolute inset-0 block h-full w-full"
				class:invisible={!qrSrc}
			>Generated QR code</canvas>
		</div>
	</div>
	<!-- Icon section: solid card fill (white in light mode, black in dark). -->
	<div class="flex w-full flex-col items-end overflow-clip border-2 border-ink bg-card p-3">
		<div class="flex items-center gap-2">
			<!-- Stroke SVGs used as alpha masks so we can recolor them (accent on hover:
			     purple in light mode, yellow in dark mode). -->
			<button
				type="button"
				class="group flex h-6 w-6 cursor-pointer items-center justify-center border-none bg-transparent p-0"
				aria-label="Copy QR code"
				onclick={copyImage}
			>
				<span
					class="block h-6 w-6 bg-ink transition-colors duration-[50ms] ease-linear group-hover:bg-accent [-webkit-mask:var(--icon)_center/contain_no-repeat] [mask:var(--icon)_center/contain_no-repeat]"
					style:--icon={`url("${copyIcon}")`}
				></span>
			</button>
			<button
				type="button"
				class="group flex h-6 w-6 cursor-pointer items-center justify-center border-none bg-transparent p-0"
				aria-label="Download QR code"
				onclick={downloadImage}
			>
				<span
					class="block h-6 w-6 bg-ink transition-colors duration-[50ms] ease-linear group-hover:bg-accent [-webkit-mask:var(--icon)_center/contain_no-repeat] [mask:var(--icon)_center/contain_no-repeat]"
					style:--icon={`url("${downloadIcon}")`}
				></span>
			</button>
		</div>
	</div>
</section>
