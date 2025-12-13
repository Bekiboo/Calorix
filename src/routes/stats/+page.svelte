<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { getDailyTotals } from '$lib/storage';
	import { Chart, registerables } from 'chart.js';
	import { ArrowLeft } from '@lucide/svelte/icons';

	Chart.register(...registerables);

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;
	let loading = $state(true);

	async function loadStats() {
		const dailyTotals = await getDailyTotals();
		const dates = Object.keys(dailyTotals).sort((a, b) => a.localeCompare(b));

		if (dates.length === 0) {
			loading = false;
			return;
		}

		const labels = dates.map((date) => {
			const d = new Date(date + 'T00:00:00');
			return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		});

		const consumedData = dates.map((date) => dailyTotals[date].consumed);
		const burnedData = dates.map((date) => dailyTotals[date].burned);
		const netData = dates.map((date) => dailyTotals[date].net);

		// Destroy existing chart if it exists
		if (chart) {
			chart.destroy();
		}

		// Create new chart
		chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Net Calories',
						data: netData,
						borderColor: 'rgb(59, 130, 246)',
						backgroundColor: 'rgba(59, 130, 246, 0.1)',
						tension: 0.3,
						fill: true
					},
					{
						label: 'Consumed',
						data: consumedData,
						borderColor: 'rgb(239, 68, 68)',
						backgroundColor: 'rgba(239, 68, 68, 0.1)',
						tension: 0.3,
						fill: false
					},
					{
						label: 'Burned',
						data: burnedData,
						borderColor: 'rgb(34, 197, 94)',
						backgroundColor: 'rgba(34, 197, 94, 0.1)',
						tension: 0.3,
						fill: false
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				plugins: {
					legend: {
						position: 'bottom'
					},
					title: {
						display: false
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: 'Calories'
						}
					}
				}
			}
		});

		loading = false;
	}

	onMount(() => {
		loadStats();

		return () => {
			if (chart) {
				chart.destroy();
			}
		};
	});
</script>

<div class="min-h-screen p-4 pb-20 dark:from-blue-950/30 dark:to-gray-950">
	<div class="mx-auto max-w-2xl space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between pt-6">
			<Button variant="ghost" onclick={() => goto('/')}>
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back
			</Button>
			<h1 class="text-2xl font-bold">Stats</h1>
			<div class="w-20"></div>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<p class="text-lg text-muted-foreground">Loading...</p>
			</div>
		{:else}
			<Card>
				<CardHeader>
					<CardTitle>Daily Calorie Trends</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="w-full">
						<canvas bind:this={canvas}></canvas>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>About Your Stats</CardTitle>
				</CardHeader>
				<CardContent class="space-y-2 text-sm text-muted-foreground">
					<p>
						<span class="font-medium text-blue-600">Net Calories:</span> Shows your daily calorie balance
						(consumed - burned)
					</p>
					<p>
						<span class="font-medium text-red-600">Consumed:</span> Total calories eaten each day
					</p>
					<p>
						<span class="font-medium text-green-600">Burned:</span> Total calories burned through activities
					</p>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>
