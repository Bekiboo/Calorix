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

// Weight entries
export async function addWeight(weight: number): Promise<void> {
	const weights = (await get<WeightEntry[]>('weights')) || [];
	const today = getTodayDate();

	// Remove any existing weight entry for today
	const filteredWeights = weights.filter((w) => w.date !== today);

	const newWeight: WeightEntry = {
		id: generateId(),
		date: today,
		weight,
		timestamp: Date.now()
	};
	filteredWeights.push(newWeight);
	await set('weights', filteredWeights);
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

// Consolidate past days' entries into single entries per day
export async function consolidatePastDays(): Promise<void> {
	const today = getTodayDate();
	const entries = await getAllEntries();
	const activities = await getAllActivities();

	// Group entries by date
	const entriesByDate = new Map<string, Entry[]>();
	entries.forEach((entry) => {
		if (!entriesByDate.has(entry.date)) {
			entriesByDate.set(entry.date, []);
		}
		entriesByDate.get(entry.date)!.push(entry);
	});

	// Group activities by date
	const activitiesByDate = new Map<string, Activity[]>();
	activities.forEach((activity) => {
		if (!activitiesByDate.has(activity.date)) {
			activitiesByDate.set(activity.date, []);
		}
		activitiesByDate.get(activity.date)!.push(activity);
	});

	// Consolidate entries for past days (not today)
	const consolidatedEntries: Entry[] = [];
	for (const [date, dateEntries] of entriesByDate) {
		if (date === today) {
			// Keep all today's entries as-is
			consolidatedEntries.push(...dateEntries);
		} else if (dateEntries.length > 1) {
			// Consolidate multiple entries into one
			const totalCalories = dateEntries.reduce((sum, e) => sum + e.calories, 0);
			consolidatedEntries.push({
				id: generateId(),
				date,
				calories: totalCalories,
				timestamp: Math.min(...dateEntries.map((e) => e.timestamp))
			});
		} else {
			// Already consolidated (single entry)
			consolidatedEntries.push(dateEntries[0]);
		}
	}

	// Consolidate activities for past days (not today)
	const consolidatedActivities: Activity[] = [];
	for (const [date, dateActivities] of activitiesByDate) {
		if (date === today) {
			// Keep all today's activities as-is
			consolidatedActivities.push(...dateActivities);
		} else if (dateActivities.length > 1) {
			// Consolidate multiple activities into one
			const totalBurned = dateActivities.reduce((sum, a) => sum + a.calories_burned, 0);
			consolidatedActivities.push({
				id: generateId(),
				date,
				calories_burned: totalBurned,
				timestamp: Math.min(...dateActivities.map((a) => a.timestamp))
			});
		} else {
			// Already consolidated (single activity)
			consolidatedActivities.push(dateActivities[0]);
		}
	}

	// Save consolidated data
	await set('entries', consolidatedEntries);
	await set('activities', consolidatedActivities);
}
