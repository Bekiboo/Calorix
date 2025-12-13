<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { getDailyTotals } from '$lib/storage';
	import { ArrowLeft, Calendar } from '@lucide/svelte';

	let dailyTotals = $state<Record<string, { consumed: number; burned: number; net: number }>>({});
	let loading = $state(true);

	async function loadHistory() {
		dailyTotals = await getDailyTotals();
		loading = false;
	}

	onMount(() => {
		loadHistory();
	});

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getSortedDates(): string[] {
		return Object.keys(dailyTotals).sort((a, b) => b.localeCompare(a));
	}
</script>

<div
	class="min-h-screen bg-linear-to-b from-blue-50 to-white p-4 pb-20 dark:from-blue-950/30 dark:to-gray-950"
>
	<div class="mx-auto max-w-2xl space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between pt-6">
			<Button variant="ghost" onclick={() => goto('/')}>
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back
			</Button>
			<h1 class="text-2xl font-bold">History</h1>
			<div class="w-20"></div>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<p class="text-lg text-muted-foreground">Loading...</p>
			</div>
		{:else if getSortedDates().length === 0}
			<Card>
				<CardContent class="pt-6">
					<p class="text-center text-muted-foreground">No history yet. Start tracking today!</p>
				</CardContent>
			</Card>
		{:else}
			<div class="space-y-3">
				{#each getSortedDates() as date}
					<Card>
						<CardHeader class="pb-3">
							<CardTitle class="text-lg">{formatDate(date)}</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="grid grid-cols-3 gap-4">
								<div>
									<p class="text-sm text-muted-foreground">Consumed</p>
									<p class="text-xl font-semibold text-blue-600">{dailyTotals[date].consumed}</p>
								</div>
								<div>
									<p class="text-sm text-muted-foreground">Burned</p>
									<p class="text-xl font-semibold text-green-600">{dailyTotals[date].burned}</p>
								</div>
								<div>
									<p class="text-sm text-muted-foreground">Net</p>
									<p
										class="text-xl font-semibold {dailyTotals[date].net >= 0
											? 'text-foreground'
											: 'text-red-600 dark:text-red-400'}"
									>
										{dailyTotals[date].net}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	</div>
</div>
