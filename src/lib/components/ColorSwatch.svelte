<script lang="ts">
	let {
		value = $bindable('#000000'),
		label = '',
		disabled = false
	}: { value?: string; label?: string; disabled?: boolean } = $props();
</script>

<label class="option" class:disabled>
	<span class="swatch">
		<span class="swatch-fill" style:background-color={value}></span>
		<input type="color" bind:value {disabled} />
	</span>
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
	/* Disabled (e.g. background color while transparent bg is on): mute the label
	   and cross the swatch out with diagonal hatch marks. */
	.option.disabled {
		cursor: not-allowed;
	}
	.option.disabled .option-label {
		color: var(--muted);
	}
	.option.disabled .swatch input {
		pointer-events: none;
	}
	.option.disabled .swatch-fill {
		display: none;
	}
	.option.disabled .swatch::after {
		content: '';
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(45deg, transparent 0 3px, var(--ink) 3px 4px);
		pointer-events: none;
	}
	.option-label {
		font-family: 'PolySans Neutral', sans-serif;
		font-size: 12px;
		color: var(--ink);
	}
	.swatch {
		position: relative;
		width: 40px;
		height: 22px;
		background: var(--surface);
		border: 1px solid var(--ink);
		padding: 2px;
		display: flex;
		align-items: center;
		overflow: clip;
	}
	.swatch-fill {
		flex: 1 0 0;
		height: 100%;
	}
	.swatch input[type='color'] {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		border: none;
		padding: 0;
		cursor: pointer;
	}
</style>
