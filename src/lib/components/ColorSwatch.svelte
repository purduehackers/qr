<script lang="ts">
	let {
		value = $bindable('#000000'),
		label = '',
		disabled = false
	}: { value?: string; label?: string; disabled?: boolean } = $props();
</script>

<!-- Styled to sit alongside the PH Checkbox: same 1px foreground border, label
     leading and disabled treatment. Disabled (e.g. background color while
     transparent bg is on) also crosses the swatch out with diagonal hatch marks. -->
<label
	class={[
		'inline-flex items-center gap-2 leading-[1.35]',
		disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
	]}
>
	<span class="relative flex h-4 w-8 shrink-0 border border-foreground bg-background p-px">
		{#if disabled}
			<span class="hatch pointer-events-none absolute inset-0"></span>
		{:else}
			<span class="h-full grow" style:background-color={value}></span>
		{/if}
		<input
			type="color"
			bind:value
			{disabled}
			class={[
				'absolute inset-0 h-full w-full border-none p-0 opacity-0',
				disabled ? 'pointer-events-none' : 'cursor-pointer'
			]}
		/>
	</span>
	{label}
</label>
