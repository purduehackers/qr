<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';
	import type { IconName } from './icons';

	const variants = {
		solid: 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground',
		outline: 'border border-foreground text-foreground hover:bg-foreground hover:text-background',
		ghost: 'text-foreground hover:bg-foreground/[0.08]'
	};

	const sizes = {
		sm: 'h-8 gap-1.5 px-3 text-[13px]',
		md: 'h-10 gap-2 px-4 text-[15px]',
		lg: 'h-[52px] gap-2.5 px-6 text-xl'
	};

	type Props = {
		children?: Snippet;
		href?: string;
		variant?: keyof typeof variants;
		size?: keyof typeof sizes;
		icon?: IconName;
		iconEnd?: IconName;
		class?: string;
	} & Omit<HTMLAnchorAttributes & HTMLButtonAttributes, 'children' | 'class'>;

	let {
		children,
		href,
		variant = 'solid',
		size = 'md',
		icon,
		iconEnd,
		class: className,
		type = 'button',
		...rest
	}: Props = $props();

	const classes = $derived([
		'inline-flex w-fit shrink-0 cursor-pointer items-center justify-center font-mono font-semibold tracking-wide whitespace-nowrap uppercase no-underline transition-[color,background-color,transform] duration-150 ease-quint active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
		variants[variant],
		sizes[size],
		className
	]);
</script>

{#snippet inner()}
	{#if icon}<Icon name={icon} />{/if}
	{@render children?.()}
	{#if iconEnd}<Icon name={iconEnd} />{/if}
{/snippet}

{#if href}
	<a {href} class={classes} {...rest as HTMLAnchorAttributes}>{@render inner()}</a>
{:else}
	<button {type} class={classes} {...rest as HTMLButtonAttributes}>{@render inner()}</button>
{/if}
