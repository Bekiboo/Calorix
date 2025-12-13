<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
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
	import { Progress } from '$lib/components/ui/progress';
	import {
		loadSettings,
		getTodayTotals,
		addEntry,
		addActivity,
		consolidatePastDays,
		type Settings,
		type DailyTotals
	} from '$lib/storage';
	import { Plus, Activity, History, TrendingUp } from '@lucide/svelte';

	let settings = $state<Settings | null>(null);
	let totals = $state<DailyTotals>({ consumed: 0, burned: 0, net: 0 });
	let loading = $state(true);

	let calorieInput = $state('');
	let activityInput = $state('');
	let addCaloriesOpen = $state(false);
	let addActivityOpen = $state(false);

	const todayDate = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	async function loadData() {
		// Consolidate past days first
		await consolidatePastDays();

		const s = await loadSettings();
		if (!s) {
			goto('/setup');
			return;
		}
		settings = s;
		totals = await getTodayTotals();
		loading = false;
	}

	async function handleAddCalories() {
		const calories = parseInt(calorieInput);
		if (!calories || calories <= 0) return;

		await addEntry(calories);
		totals = await getTodayTotals();
		calorieInput = '';
		addCaloriesOpen = false;
	}

	async function handleAddActivity() {
		const calories = parseInt(activityInput);
		if (!calories || calories <= 0) return;

		await addActivity(calories);
		totals = await getTodayTotals();
		activityInput = '';
		addActivityOpen = false;
	}

	onMount(() => {
		loadData();
	});

	$effect(() => {
		if (settings && totals) {
			// This will trigger reactivity when totals change
		}
	});

	function getProgressPercentage(): number {
		if (!settings) return 0;
		return Math.min((totals.consumed / settings.daily_goal) * 100, 100);
	}

	function getRemainingCalories(): number {
		if (!settings) return 0;
		return settings.daily_goal - totals.net;
	}

	function isOverMax(): boolean {
		if (!settings?.daily_max) return false;
		return totals.consumed > settings.daily_max;
	}
</script>

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<p class="text-lg text-muted-foreground">Loading...</p>
	</div>
{:else if settings}
	<div
		class="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 pb-20 dark:from-blue-950/30 dark:to-gray-950"
	>
		<div class="mx-auto max-w-2xl space-y-6">
			<!-- Header -->
			<div class="pt-6 text-center">
				<h1 class="text-3xl font-bold text-foreground">Calorix</h1>
				<p class="mt-1 text-sm text-muted-foreground">{todayDate}</p>
			</div>

			<!-- Main Stats Card -->
			<Card>
				<CardHeader>
					<CardTitle>Today's Summary</CardTitle>
					<CardDescription>Daily goal: {settings.daily_goal} calories</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<!-- Progress Bar -->
					<div class="space-y-2">
						<div class="flex justify-between text-sm">
							<span>Progress</span>
							<span class="font-medium">{totals.consumed} / {settings.daily_goal} cal</span>
						</div>
						<Progress value={getProgressPercentage()} class="h-3" />
					</div>

					<!-- Stats Grid -->
					<div class="grid grid-cols-3 gap-4 pt-4">
						<div class="text-center">
							<p class="text-2xl font-bold text-blue-600">{totals.consumed}</p>
							<p class="mt-1 text-xs text-muted-foreground">Consumed</p>
						</div>
						<div class="text-center">
							<p class="text-2xl font-bold text-green-600">{totals.burned}</p>
							<p class="mt-1 text-xs text-muted-foreground">Burned</p>
						</div>
						<div class="text-center">
							<p
								class="text-2xl font-bold {getRemainingCalories() >= 0
									? 'text-gray-900'
									: 'text-red-600'}"
							>
								{getRemainingCalories()}
							</p>
							<p class="mt-1 text-xs text-muted-foreground">Remaining</p>
						</div>
					</div>

					<!-- Warning if over max -->
					{#if isOverMax()}
						<div class="rounded-lg border border-red-200 bg-red-50 p-3">
							<p class="text-center text-sm text-red-800">
								⚠️ You've exceeded your daily maximum of {settings.daily_max} calories
							</p>
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Action Buttons -->
			<div class="grid grid-cols-2 gap-4">
				<Dialog bind:open={addCaloriesOpen}>
					<DialogTrigger>
						<Button class="h-20 w-full text-lg">
							<Plus class="mr-2 h-5 w-5" />
							Add Calories
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add Calories</DialogTitle>
							<DialogDescription>Enter the number of calories consumed</DialogDescription>
						</DialogHeader>
						<form
							onsubmit={(e) => {
								e.preventDefault();
								handleAddCalories();
							}}
							class="space-y-4"
						>
							<div class="space-y-2">
								<Label for="calories">Calories</Label>
								<Input
									id="calories"
									type="number"
									placeholder="e.g., 500"
									bind:value={calorieInput}
									autofocus
								/>
							</div>
							<Button type="submit" class="w-full">Add</Button>
						</form>
					</DialogContent>
				</Dialog>

				<Dialog bind:open={addActivityOpen}>
					<DialogTrigger>
						<Button variant="outline" class="h-20 w-full text-lg">
							<Activity class="mr-2 h-5 w-5" />
							Add Activity
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add Activity</DialogTitle>
							<DialogDescription>Enter the number of calories burned</DialogDescription>
						</DialogHeader>
						<form
							onsubmit={(e) => {
								e.preventDefault();
								handleAddActivity();
							}}
							class="space-y-4"
						>
							<div class="space-y-2">
								<Label for="activity">Calories Burned</Label>
								<Input
									id="activity"
									type="number"
									placeholder="e.g., 300"
									bind:value={activityInput}
									autofocus
								/>
							</div>
							<Button type="submit" class="w-full">Add</Button>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<!-- Navigation -->
			<div class="grid grid-cols-2 gap-4">
				<Button variant="outline" onclick={() => goto('/history')}>
					<History class="mr-2 h-4 w-4" />
					View History
				</Button>
				<Button variant="outline" onclick={() => goto('/stats')}>
					<TrendingUp class="mr-2 h-4 w-4" />
					View Stats
				</Button>
			</div>
		</div>
	</div>
{/if}
