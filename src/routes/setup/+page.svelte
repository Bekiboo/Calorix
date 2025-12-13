<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { saveSettings } from '$lib/storage';

	let dailyGoal = $state('');
	let dailyMax = $state('');
	let error = $state('');

	async function handleSubmit() {
		const goal = parseInt(dailyGoal);
		const max = dailyMax ? parseInt(dailyMax) : undefined;

		if (!goal || goal <= 0) {
			error = 'Please enter a valid daily calorie goal';
			return;
		}

		if (max && max <= goal) {
			error = 'Daily maximum must be greater than daily goal';
			return;
		}

		await saveSettings({
			daily_goal: goal,
			daily_max: max,
			created_at: new Date().toISOString()
		});

		goto('/');
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-950 p-4"
>
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle class="text-2xl">Welcome to Calorix</CardTitle>
			<CardDescription>Set up your daily calorie tracking goals</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Label for="goal">Daily Calorie Goal *</Label>
					<Input id="goal" type="number" placeholder="e.g., 2000" bind:value={dailyGoal} required />
				</div>

				<div class="space-y-2">
					<Label for="max">Daily Maximum (optional)</Label>
					<Input id="max" type="number" placeholder="e.g., 2500" bind:value={dailyMax} />
					<p class="text-sm text-muted-foreground">We'll warn you if you exceed this amount</p>
				</div>

				{#if error}
					<p class="text-sm text-red-600">{error}</p>
				{/if}

				<Button type="submit" class="w-full">Get Started</Button>
			</form>
		</CardContent>
	</Card>
</div>
