import { get, set } from 'idb-keyval';

export interface Settings {
	daily_goal: number;
	daily_max?: number;
	created_at: string;
}

export interface Entry {
	id: string;
	date: string; // YYYY-MM-DD
	calories: number;
	daily_goal: number;
	daily_max?: number;
	timestamp: number;
}

export interface Activity {
	id: string;
	date: string; // YYYY-MM-DD
	calories_burned: number;
	timestamp: number;
}

export interface WeightEntry {
	id: string;
	date: string; // YYYY-MM-DD
	weight: number; // in kg or lbs
	timestamp: number;
}

export interface DailyTotals {
	consumed: number;
	burned: number;
	net: number;
	daily_goal: number;
	daily_max?: number;
	remaining: number;
}

// Generate a simple unique ID
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
	const now = new Date();
	return now.toISOString().split('T')[0];
}

// Settings
export async function saveSettings(settings: Settings): Promise<void> {
	await set('settings', settings);
}

export async function loadSettings(): Promise<Settings | null> {
	const settings = await get<Settings>('settings');
	return settings || null;
}

// Entries
export async function addEntry(calories: number): Promise<void> {
	const entries = (await get<Entry[]>('entries')) || [];
	const settings = await loadSettings();
	const today = getTodayDate();

	if (!settings) return;

	// Find existing entry for today
	const existingIndex = entries.findIndex((e) => e.date === today);

	if (existingIndex >= 0) {
		// Update existing entry
		entries[existingIndex].calories += calories;
		entries[existingIndex].daily_goal = settings.daily_goal;
		entries[existingIndex].daily_max = settings.daily_max;
		entries[existingIndex].timestamp = Date.now();
	} else {
		// Create new entry for today
		const newEntry: Entry = {
			id: generateId(),
			date: today,
			calories,
			daily_goal: settings.daily_goal,
			daily_max: settings.daily_max,
			timestamp: Date.now()
		};
		entries.push(newEntry);
	}

	await set('entries', entries);
}

export async function getAllEntries(): Promise<Entry[]> {
	return (await get<Entry[]>('entries')) || [];
}

export async function updateEntry(date: string, calories: number): Promise<void> {
	const entries = (await get<Entry[]>('entries')) || [];
	const settings = await loadSettings();
	const existingIndex = entries.findIndex((e) => e.date === date);

	if (existingIndex >= 0) {
		entries[existingIndex].calories = calories;
		entries[existingIndex].timestamp = Date.now();
		// Preserve existing goals if entry already has them
		if (!entries[existingIndex].daily_goal && settings) {
			entries[existingIndex].daily_goal = settings.daily_goal;
			entries[existingIndex].daily_max = settings.daily_max;
		}
	} else if (settings) {
		const newEntry: Entry = {
			id: generateId(),
			date,
			calories,
			daily_goal: settings.daily_goal,
			daily_max: settings.daily_max,
			timestamp: Date.now()
		};
		entries.push(newEntry);
	}

	await set('entries', entries);
}

// Activities
export async function addActivity(calories_burned: number): Promise<void> {
	const activities = (await get<Activity[]>('activities')) || [];
	const today = getTodayDate();

	// Find existing activity for today
	const existingIndex = activities.findIndex((a) => a.date === today);

	if (existingIndex >= 0) {
		// Update existing activity
		activities[existingIndex].calories_burned += calories_burned;
		activities[existingIndex].timestamp = Date.now();
	} else {
		// Create new activity for today
		const newActivity: Activity = {
			id: generateId(),
			date: today,
			calories_burned,
			timestamp: Date.now()
		};
		activities.push(newActivity);
	}

	await set('activities', activities);
}

export async function getAllActivities(): Promise<Activity[]> {
	return (await get<Activity[]>('activities')) || [];
}

export async function updateActivity(date: string, calories_burned: number): Promise<void> {
	const activities = (await get<Activity[]>('activities')) || [];
	const existingIndex = activities.findIndex((a) => a.date === date);

	if (existingIndex >= 0) {
		activities[existingIndex].calories_burned = calories_burned;
		activities[existingIndex].timestamp = Date.now();
	} else {
		const newActivity: Activity = {
			id: generateId(),
			date,
			calories_burned,
			timestamp: Date.now()
		};
		activities.push(newActivity);
	}

	await set('activities', activities);
}

// Weight entries
export async function addWeight(weight: number): Promise<void> {
	const weights = (await get<WeightEntry[]>('weights')) || [];
	const today = getTodayDate();

	// Find existing weight for today
	const existingIndex = weights.findIndex((w) => w.date === today);

	if (existingIndex >= 0) {
		// Update existing weight
		weights[existingIndex].weight = weight;
		weights[existingIndex].timestamp = Date.now();
	} else {
		// Create new weight for today
		const newWeight: WeightEntry = {
			id: generateId(),
			date: today,
			weight,
			timestamp: Date.now()
		};
		weights.push(newWeight);
	}

	await set('weights', weights);
}

export async function getAllWeights(): Promise<WeightEntry[]> {
	return (await get<WeightEntry[]>('weights')) || [];
}

export async function getTodayWeight(): Promise<number | null> {
	const today = getTodayDate();
	const weights = await getAllWeights();
	const todayWeight = weights.find((w) => w.date === today);
	return todayWeight ? todayWeight.weight : null;
}

// Get today's totals
export async function getTodayTotals(): Promise<DailyTotals> {
	const today = getTodayDate();
	const entries = await getAllEntries();
	const activities = await getAllActivities();
	const settings = await loadSettings();

	const todayEntry = entries.find((e) => e.date === today);
	const todayActivity = activities.find((a) => a.date === today);

	const consumed = todayEntry ? todayEntry.calories : 0;
	const burned = todayActivity ? todayActivity.calories_burned : 0;
	const daily_goal = todayEntry?.daily_goal || settings?.daily_goal || 0;
	const daily_max = todayEntry?.daily_max || settings?.daily_max;

	return {
		consumed,
		burned,
		net: consumed - burned,
		daily_goal,
		daily_max,
		remaining: daily_goal + burned - consumed
	};
}

// Get totals grouped by date
export async function getDailyTotals(): Promise<Record<string, DailyTotals>> {
	const entries = await getAllEntries();
	const activities = await getAllActivities();
	const settings = await loadSettings();

	const totals: Record<string, DailyTotals> = {};

	// Process entries (one per day)
	entries.forEach((entry) => {
		totals[entry.date] = {
			consumed: entry.calories,
			burned: 0,
			net: 0,
			daily_goal: entry.daily_goal || settings?.daily_goal || 0,
			daily_max: entry.daily_max || settings?.daily_max,
			remaining: 0
		};
	});

	// Process activities (one per day)
	activities.forEach((activity) => {
		if (!totals[activity.date]) {
			totals[activity.date] = {
				consumed: 0,
				burned: 0,
				net: 0,
				daily_goal: settings?.daily_goal || 0,
				daily_max: settings?.daily_max,
				remaining: 0
			};
		}
		totals[activity.date].burned = activity.calories_burned;
	});

	// Calculate net and remaining for each date
	Object.keys(totals).forEach((date) => {
		totals[date].net = totals[date].consumed - totals[date].burned;
		const targetLimit = totals[date].daily_max || totals[date].daily_goal;
		totals[date].remaining = targetLimit - totals[date].consumed + totals[date].burned;
	});

	return totals;
}

// Migration: Backfill daily_goal and daily_max for old entries
// TODO: Remove this in future versions once all users have migrated
export async function migrateOldEntries(): Promise<void> {
	const entries = await getAllEntries();
	const settings = await loadSettings();

	if (!settings) return;

	let needsUpdate = false;

	entries.forEach((entry) => {
		// Check if entry is missing goal/max fields (old format)
		if (!entry.daily_goal) {
			entry.daily_goal = settings.daily_goal;
			entry.daily_max = settings.daily_max;
			needsUpdate = true;
		}
	});

	if (needsUpdate) {
		await set('entries', entries);
		console.log('Migrated old entries with current settings');
	}
}
