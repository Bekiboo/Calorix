<script lang="ts">
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Scale } from 'lucide-svelte';
	import type { Settings, DailyTotals } from '$lib/storage';

	interface Props {
		settings: Settings;
		totals: DailyTotals;
		todayWeight: number | null;
	}

	let { settings, totals, todayWeight }: Props = $props();

	function getRemainingCalories(): number {
		return settings.daily_goal - totals.net;
	}

	function getAdjustedGoal(): number {
		// Goal + calories burned = total you can safely consume
		return settings.daily_goal + totals.burned;
	}

	function getAdjustedMax(): number | undefined {
		// Max + calories burned = total max you can safely consume
		if (!settings.daily_max) return undefined;
		return settings.daily_max + totals.burned;
	}

	function isOverMax(): boolean {
		if (!settings.daily_max) return false;
		return totals.consumed > settings.daily_max;
	}
</script>

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
				<span class="font-medium">{totals.consumed} cal</span>
			</div>

			<!-- Custom Progress Bar -->
			<div class="relative h-3 overflow-hidden rounded-full bg-muted">
				<!-- Goal section (neutral background) -->
				{#if getAdjustedMax()}
					<div
						class="absolute inset-y-0 left-0 bg-gray-200 dark:bg-gray-700"
						style="width: {(getAdjustedGoal() / getAdjustedMax()!) * 100}%"
					></div>
					<!-- Max section (yellow background) -->
					<div
						class="absolute inset-y-0 bg-red-400"
						style="left: {(getAdjustedGoal() / getAdjustedMax()!) * 100}%; right: 0"
					></div>
				{:else}
					<!-- Fallback when no max is set -->
					<div class="absolute inset-y-0 right-0 left-0 bg-gray-200 dark:bg-gray-700"></div>
				{/if}

				<!-- Actual progress (consumed calories) -->
				<div
					class="bg- absolute inset-y-0 left-0 bg-blue-400 transition-all"
					style="width: {getAdjustedMax()
						? Math.min((totals.consumed / getAdjustedMax()!) * 100, 100)
						: Math.min((totals.consumed / getAdjustedGoal()) * 100, 100)}%"
				></div>
			</div>

			<!-- Labels below progress bar -->
			<div class="flex justify-between text-xs text-muted-foreground">
				<span>Adjusted Goal: {getAdjustedGoal()}</span>
				{#if getAdjustedMax()}
					<span>Adjusted Max: {getAdjustedMax()}</span>
				{/if}
			</div>
		</div>

		<!-- Stats Grid -->
		<div class="grid grid-cols-3 gap-4 pt-4">
			<div class="text-center">
				<p class="text-2xl font-bold text-blue-400">{totals.consumed}</p>
				<p class="mt-1 text-xs text-muted-foreground">Consumed</p>
			</div>
			<div class="text-center">
				<p class="text-2xl font-bold text-green-400">{totals.burned}</p>
				<p class="mt-1 text-xs text-muted-foreground">Burned</p>
			</div>
			<div class="text-center">
				<p
					class="text-2xl font-bold {getRemainingCalories() >= 0 ? 'text-500-900' : 'text-red-600'}"
				>
					{getRemainingCalories()}
				</p>
				<p class="mt-1 text-xs text-muted-foreground">Remaining</p>
			</div>
		</div>

		<!-- Weight Display -->
		{#if todayWeight}
			<div class="flex items-center justify-center gap-2 rounded-lg border bg-muted/50 p-3">
				<Scale class="h-4 w-4 text-muted-foreground" />
				<span class="text-sm font-medium">{todayWeight} kg</span>
			</div>
		{/if}

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
