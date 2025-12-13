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
	const newEntry: Entry = {
		id: generateId(),
		date: getTodayDate(),
		calories,
		timestamp: Date.now()
	};
	entries.push(newEntry);
	await set('entries', entries);
}

export async function getAllEntries(): Promise<Entry[]> {
	return (await get<Entry[]>('entries')) || [];
}

// Activities
export async function addActivity(calories_burned: number): Promise<void> {
	const activities = (await get<Activity[]>('activities')) || [];
	const newActivity: Activity = {
		id: generateId(),
		date: getTodayDate(),
		calories_burned,
		timestamp: Date.now()
	};
	activities.push(newActivity);
	await set('activities', activities);
}

export async function getAllActivities(): Promise<Activity[]> {
	return (await get<Activity[]>('activities')) || [];
}

// Get today's totals
export async function getTodayTotals(): Promise<DailyTotals> {
	const today = getTodayDate();
	const entries = await getAllEntries();
	const activities = await getAllActivities();

	const consumed = entries.filter((e) => e.date === today).reduce((sum, e) => sum + e.calories, 0);

	const burned = activities
		.filter((a) => a.date === today)
		.reduce((sum, a) => sum + a.calories_burned, 0);

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

	// Process entries
	entries.forEach((entry) => {
		if (!totals[entry.date]) {
			totals[entry.date] = { consumed: 0, burned: 0, net: 0 };
		}
		totals[entry.date].consumed += entry.calories;
	});

	// Process activities
	activities.forEach((activity) => {
		if (!totals[activity.date]) {
			totals[activity.date] = { consumed: 0, burned: 0, net: 0 };
		}
		totals[activity.date].burned += activity.calories_burned;
	});

	// Calculate net for each date
	Object.keys(totals).forEach((date) => {
		totals[date].net = totals[date].consumed - totals[date].burned;
	});

	return totals;
}
