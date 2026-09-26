<script lang="ts">
	let { checked = $bindable(false), label = '' }: { checked?: boolean; label?: string } = $props();
</script>

<label class="option">
	<span class="toggle" class:on={checked}>
		<span class="knob"></span>
	</span>
	<input type="checkbox" bind:checked hidden />
	<span class="option-label">{label}</span>
</label>

<style>
	.option {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		cursor: pointer;
	}
	.option-label {
		font-family: 'PolySans Neutral', sans-serif;
		font-size: 12px;
		color: var(--ink);
	}
	.toggle {
		width: 40px;
		height: 22px;
		background: var(--track);
		border: 1px solid var(--ink);
		padding: 3px;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		overflow: clip;
	}
	.toggle.on {
		justify-content: flex-end;
		background: var(--accent);
	}
	.toggle .knob {
		width: 14px;
		height: 14px;
		background: var(--surface);
		border: 1px solid var(--ink);
	}
</style>
