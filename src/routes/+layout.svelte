<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import ModeToggle from '$lib/components/ui/ModeToggle.svelte';

	let { children } = $props();
</script>

<svelte:head><title>Calorix - Calorie Tracker</title><link rel="icon" href={favicon} /></svelte:head
>

<div class="relative min-h-screen bg-background">
	<div class="fixed top-4 right-4 z-50">
		<ModeToggle />
	</div>
	<ModeWatcher />
	{@render children()}
</div>
