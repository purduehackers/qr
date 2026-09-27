<script lang="ts">
	let {
		value = $bindable('#000000'),
		label = '',
		disabled = false
	}: { value?: string; label?: string; disabled?: boolean } = $props();
</script>

<!-- Disabled (e.g. background color while transparent bg is on): mute the label and
     cross the swatch out with diagonal hatch marks. -->
<label class="flex w-full items-center gap-2 {disabled ? 'cursor-not-allowed' : 'cursor-pointer'}">
	<span class="relative flex h-[22px] w-10 items-center overflow-clip border border-ink bg-surface p-0.5">
		{#if disabled}
			<span class="hatch pointer-events-none absolute inset-0"></span>
		{:else}
			<span class="h-full grow shrink-0 basis-0" style:background-color={value}></span>
		{/if}
		<input
			type="color"
			bind:value
			{disabled}
			class="absolute inset-0 h-full w-full border-none p-0 opacity-0 {disabled
				? 'pointer-events-none'
				: 'cursor-pointer'}"
		/>
	</span>
	<span class="font-neutral text-xs {disabled ? 'text-muted' : 'text-ink'}">{label}</span>
</label>
