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
	const today = getTodayDate();

	// Find existing entry for today
	const existingIndex = entries.findIndex((e) => e.date === today);

	if (existingIndex >= 0) {
		// Update existing entry
		entries[existingIndex].calories += calories;
		entries[existingIndex].timestamp = Date.now();
	} else {
		// Create new entry for today
		const newEntry: Entry = {
			id: generateId(),
			date: today,
			calories,
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
	const existingIndex = entries.findIndex((e) => e.date === date);

	if (existingIndex >= 0) {
		entries[existingIndex].calories = calories;
		entries[existingIndex].timestamp = Date.now();
	} else {
		const newEntry: Entry = {
			id: generateId(),
			date,
			calories,
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

	const todayEntry = entries.find((e) => e.date === today);
	const todayActivity = activities.find((a) => a.date === today);

	const consumed = todayEntry ? todayEntry.calories : 0;
	const burned = todayActivity ? todayActivity.calories_burned : 0;

	return {
		consumed,
		burned,
		net: consumed - burned
	};
}

// Get totals grouped by date
export async function getDailyTotals(): Promise<
	Record<string, { consumed: number; burned: number; net: number }>
> {
	const entries = await getAllEntries();
	const activities = await getAllActivities();

	const totals: Record<string, { consumed: number; burned: number; net: number }> = {};

	// Process entries (one per day)
	entries.forEach((entry) => {
		totals[entry.date] = {
			consumed: entry.calories,
			burned: 0,
			net: 0
		};
	});

	// Process activities (one per day)
	activities.forEach((activity) => {
		if (!totals[activity.date]) {
			totals[activity.date] = { consumed: 0, burned: 0, net: 0 };
		}
		totals[activity.date].burned = activity.calories_burned;
	});

	// Calculate net for each date
	Object.keys(totals).forEach((date) => {
		totals[date].net = totals[date].consumed - totals[date].burned;
	});

	return totals;
}
