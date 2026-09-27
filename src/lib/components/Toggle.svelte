<script lang="ts">
	let { checked = $bindable(false), label = '' }: { checked?: boolean; label?: string } = $props();
</script>

<label class="flex w-full cursor-pointer items-center gap-2">
	<span
		class="h-[22px] w-10 overflow-clip border border-ink p-[3px] transition-colors duration-[25ms] ease-linear {checked
			? 'bg-accent'
			: 'bg-track'}"
	>
		<!-- Content box is 32px wide, knob 14px → slides 18px to sit flush right. -->
		<span
			class="block h-[14px] w-[14px] border border-ink bg-surface transition-transform duration-100 ease-out {checked
				? 'translate-x-[18px]'
				: ''}"
		></span>
	</span>
	<input type="checkbox" bind:checked hidden />
	<span class="font-neutral text-xs text-ink">{label}</span>
</label>
