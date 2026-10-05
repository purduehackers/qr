<script lang="ts">
	let {
		value = $bindable(0.5),
		min = 0,
		max = 1,
		step = 0.01,
		label = ''
	}: { value?: number; min?: number; max?: number; step?: number; label?: string } = $props();

	// Fill/knob position as a percentage of the track.
	const pct = $derived(Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)));
</script>

<!-- Matches the Toggle/ColorSwatch look: a bordered track with an accent fill and a
     draggable knob. A transparent native range input overlays it for interaction. -->
<label class="flex w-full cursor-pointer items-center gap-2">
	<span class="relative block h-[22px] w-20 overflow-clip border border-ink bg-track">
		<span class="pointer-events-none absolute inset-y-0 left-0 bg-accent" style:width={`${pct}%`}
		></span>
		<!-- 6px marker bar, centred on the value (edges clip at the extremes). -->
		<span
			class="pointer-events-none absolute top-0 h-full w-[6px] border-x border-ink bg-surface"
			style:left={`calc(${pct}% - 3px)`}
		></span>
		<input
			type="range"
			bind:value
			{min}
			{max}
			{step}
			aria-label={label}
			class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
		/>
	</span>
	<span class="font-neutral text-xs text-ink">{label}</span>
</label>
