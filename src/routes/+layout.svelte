<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { seo } from '$lib/seo';

	let { children } = $props();

	// Canonical / og:url need an absolute origin, so they only render once siteUrl is set.
	const url = $derived(seo.siteUrl ? seo.siteUrl + page.url.pathname : '');
	const image = $derived(
		!seo.image || /^https?:\/\//.test(seo.image)
			? seo.image
			: seo.siteUrl
				? seo.siteUrl + seo.image
				: ''
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<!-- Browser UI tint follows the PH theme: cream in light mode, black in dark. -->
	<meta name="theme-color" content="#fbf7ec" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />

	<title>{seo.title}</title>
	<meta property="og:type" content="website" />
	<meta property="og:title" content={seo.title} />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />

	{#if seo.description}
		<meta name="description" content={seo.description} />
		<meta property="og:description" content={seo.description} />
		<meta name="twitter:description" content={seo.description} />
	{/if}
	{#if url}
		<link rel="canonical" href={url} />
		<meta property="og:url" content={url} />
	{/if}
	{#if seo.siteName}
		<meta property="og:site_name" content={seo.siteName} />
	{/if}
	{#if image}
		<meta property="og:image" content={image} />
		<meta name="twitter:image" content={image} />
		{#if seo.imageAlt}
			<meta property="og:image:alt" content={seo.imageAlt} />
			<meta name="twitter:image:alt" content={seo.imageAlt} />
		{/if}
	{/if}
	{#if seo.twitterSite}
		<meta name="twitter:site" content={seo.twitterSite} />
	{/if}
</svelte:head>

{@render children()}
