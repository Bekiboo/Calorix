<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { saveSettings, type Settings } from '$lib/storage';

	interface Props {
		open: boolean;
		settings: Settings | null;
		onClose: () => void;
		onUpdate: () => void;
	}

	let { open = $bindable(), settings, onClose, onUpdate }: Props = $props();

	let goalInput = $state('');
	let maxInput = $state('');

	async function handleUpdateSettings() {
		if (!settings) return;

		const goal = parseInt(goalInput);
		const max = maxInput ? parseInt(maxInput) : undefined;

		if (!goal || goal <= 0) return;
		if (max && max <= goal) return;

		await saveSettings({
			daily_goal: goal,
			daily_max: max,
			created_at: settings.created_at
		});

		goalInput = '';
		maxInput = '';
		onUpdate();
		onClose();
	}

	$effect(() => {
		if (open && settings) {
			goalInput = settings.daily_goal.toString();
			maxInput = settings.daily_max?.toString() || '';
		}
	});
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Edit Settings</DialogTitle>
			<DialogDescription>Update your daily calorie goals</DialogDescription>
		</DialogHeader>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleUpdateSettings();
			}}
			class="space-y-4"
		>
			<div class="space-y-2">
				<Label for="edit-goal">Daily Calorie Goal *</Label>
				<Input
					id="edit-goal"
					type="number"
					placeholder="e.g., 2000"
					bind:value={goalInput}
					autofocus
				/>
			</div>

			<div class="space-y-2">
				<Label for="edit-max">Daily Maximum (optional)</Label>
				<Input id="edit-max" type="number" placeholder="e.g., 2500" bind:value={maxInput} />
				<p class="text-sm text-muted-foreground">Leave empty to remove the maximum limit</p>
			</div>

			<Button type="submit" class="w-full">Update Settings</Button>
		</form>
	</DialogContent>
</Dialog>
