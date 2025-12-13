<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { getDailyTotals, updateEntry, updateActivity } from '$lib/storage';
	import { ArrowLeft, Pencil } from '@lucide/svelte';

	let dailyTotals = $state<Record<string, { consumed: number; burned: number; net: number }>>({});
	let loading = $state(true);
	let editDialogOpen = $state(false);
	let editingDate = $state('');
	let consumedInput = $state('');
	let burnedInput = $state('');

	async function loadHistory() {
		dailyTotals = await getDailyTotals();
		loading = false;
	}

	function openEditDialog(date: string) {
		editingDate = date;
		consumedInput = dailyTotals[date].consumed.toString();
		burnedInput = dailyTotals[date].burned.toString();
		editDialogOpen = true;
	}

	async function handleUpdateDay() {
		const consumed = parseInt(consumedInput);
		const burned = parseInt(burnedInput);

		if (isNaN(consumed) || consumed < 0 || isNaN(burned) || burned < 0) return;

		await updateEntry(editingDate, consumed);
		await updateActivity(editingDate, burned);

		// Reload history
		await loadHistory();

		consumedInput = '';
		burnedInput = '';
		editDialogOpen = false;
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
							<div class="flex items-center justify-between">
								<CardTitle class="text-lg">{formatDate(date)}</CardTitle>
								<Button variant="ghost" size="sm" onclick={() => openEditDialog(date)}>
									<Pencil class="h-4 w-4" />
								</Button>
							</div>
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

		<!-- Edit Dialog -->
		<Dialog bind:open={editDialogOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Day</DialogTitle>
					<DialogDescription>
						{editingDate ? formatDate(editingDate) : ''}
					</DialogDescription>
				</DialogHeader>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleUpdateDay();
					}}
					class="space-y-4"
				>
					<div class="space-y-2">
						<Label for="edit-consumed">Calories Consumed</Label>
						<Input
							id="edit-consumed"
							type="number"
							placeholder="e.g., 2000"
							bind:value={consumedInput}
							autofocus
						/>
					</div>

					<div class="space-y-2">
						<Label for="edit-burned">Calories Burned</Label>
						<Input
							id="edit-burned"
							type="number"
							placeholder="e.g., 300"
							bind:value={burnedInput}
						/>
					</div>

					<Button type="submit" class="w-full">Update</Button>
				</form>
			</DialogContent>
		</Dialog>
	</div>
</div>
