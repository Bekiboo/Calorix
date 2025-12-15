<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
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
	import {
		loadSettings,
		getTodayTotals,
		addEntry,
		addActivity,
		addWeight,
		getTodayWeight,
		migrateOldEntries,
		type Settings,
		type DailyTotals
	} from '$lib/storage';
	import {
		Plus,
		Activity,
		History,
		TrendingUp,
		Scale,
		Settings as SettingsIcon,
		Drumstick
	} from '@lucide/svelte';
	import MainStatCard from './MainStatCard.svelte';
	import SettingsDialog from './SettingsDialog.svelte';

	let settings = $state<Settings | null>(null);
	let totals = $state<DailyTotals>({
		consumed: 0,
		burned: 0,
		net: 0,
		daily_goal: 0,
		daily_max: undefined,
		remaining: 0
	});
	let todayWeight = $state<number | null>(null);
	let loading = $state(true);

	let calorieInput = $state('');
	let activityInput = $state('');
	let weightInput = $state('');
	let addCaloriesOpen = $state(false);
	let addActivityOpen = $state(false);
	let addWeightOpen = $state(false);
	let editSettingsOpen = $state(false);

	const todayDate = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	async function loadData() {
		// Run migration first (TODO: remove in future versions)
		await migrateOldEntries();

		const s = await loadSettings();
		if (!s) {
			goto('/setup');
			return;
		}
		settings = s;
		totals = await getTodayTotals();
		todayWeight = await getTodayWeight();
		loading = false;
	}

	async function handleAddCalories() {
		const calories = parseInt(calorieInput);
		if (!calories) return;

		// Allow negative values only if total won't go negative
		if (calories < 0 && totals.consumed + calories < 0) {
			return;
		}

		await addEntry(calories);
		totals = await getTodayTotals();
		calorieInput = '';
		addCaloriesOpen = false;
	}

	async function handleAddActivity() {
		const calories = parseInt(activityInput);
		if (!calories) return;

		// Allow negative values only if total won't go negative
		if (calories < 0 && totals.burned + calories < 0) {
			return;
		}

		await addActivity(calories);
		totals = await getTodayTotals();
		activityInput = '';
		addActivityOpen = false;
	}

	async function handleAddWeight() {
		const weight = parseFloat(weightInput);
		if (!weight || weight <= 0) return;

		await addWeight(weight);
		todayWeight = weight;
		weightInput = '';
		addWeightOpen = false;
	}

	async function handleSettingsUpdate() {
		settings = await loadSettings();
	}

	onMount(() => {
		loadData();
	});
</script>

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<p class="text-lg text-muted-foreground">Loading...</p>
	</div>
{:else if settings}
	<div class="min-h-screen p-4 pb-20 dark:from-blue-950/30 dark:to-gray-950">
		<div class="mx-auto max-w-2xl space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between pt-6">
				<div></div>
				<div class="text-center">
					<h1 class="text-3xl font-bold text-foreground">Calorix</h1>
					<p class="mt-1 text-sm text-muted-foreground">{todayDate}</p>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onclick={() => {
						editSettingsOpen = true;
					}}
				>
					<SettingsIcon class="h-5 w-5" />
				</Button>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<Dialog bind:open={addCaloriesOpen}>
					<DialogTrigger>
						<Button class="h-20 w-full text-lg">
							<Drumstick class="h-8! w-8!" />
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
							<Activity class="h-8! w-8!" />
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

			<!-- Main Stats Card -->
			<MainStatCard {settings} {totals} {todayWeight} />

			<!-- Action Buttons -->
			<div class="grid grid-cols-2 gap-4">
				<Dialog bind:open={addWeightOpen}>
					<DialogTrigger>
						<Button variant="outline" class="col-span-2 h-20 w-full text-lg">
							<Scale class="h-8! w-8!" />
							{todayWeight ? 'Update' : 'Add'} Weight
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{todayWeight ? 'Update' : 'Add'} Weight</DialogTitle>
							<DialogDescription>Enter your weight in kilograms</DialogDescription>
						</DialogHeader>
						<form
							onsubmit={(e) => {
								e.preventDefault();
								handleAddWeight();
							}}
							class="space-y-4"
						>
							<div class="space-y-2">
								<Label for="weight">Weight (kg)</Label>
								<Input
									id="weight"
									type="number"
									step="0.1"
									placeholder="e.g., 70.5"
									bind:value={weightInput}
									autofocus
								/>
							</div>
							<Button type="submit" class="w-full">{todayWeight ? 'Update' : 'Add'}</Button>
						</form>
					</DialogContent>
				</Dialog>
				<!-- Navigation -->
				<div class="grid grid-rows-2 gap-2">
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

			<!-- Settings Dialog -->
			<SettingsDialog
				bind:open={editSettingsOpen}
				{settings}
				onClose={() => (editSettingsOpen = false)}
				onUpdate={handleSettingsUpdate}
			/>
		</div>
	</div>
{/if}
