import { strict } from "node:assert";
import { describe, it } from "node:test";

function elapsed_one_month(from, to)
{
	const from_ms = from.getTime();
	const to_ms = to.getTime();
	const diff_ms = to_ms - from_ms;

	return (diff_ms / 1000 / 60 / 60 / 24 / 30) >= 1;
}

class SessionStore {
	constructor(sessions)
	{
		this.sessions = sessions;
	}

	async *next(query)
	{
		if (query.sort_by_date) {
			this.sessions.sort((a, b) => a.performed_at.getTime() - b.performed_at.getTime());
		}

		for (const session of this.sessions) {
			if (query.filter.session_start) {
				if (session.performed_at.getTime() < query.filter.session_start.getTime())
					continue;
			}

			if (query.filter.session_end) {
				if (session.performed_at.getTime() > query.filter.session_end.getTime())
					continue;
			}

			const ret_session = { ...session };
			if (query.filter.exercise_names) {
				const exercises = session.exercises.filter(({ name }) =>
					query.filter.exercise_names.some(name2 => name == name2));
				ret_session.exercises = exercises;
			}

			yield ret_session;
		}
	}
}

function date_is_in_range(date, range)
{
	const date_ms = date.getTime();
	const start_ms = range.start.getTime();
	const end_ms = range.end.getTime();

	return date_ms >= start_ms &&
	       date_ms <= end_ms;
}

async function* exercise_performance_metrics(sessions, query)
{
	const result = {};
	const metrics = new Map();

	result.from = new Date(query.session_start);
	result.metrics = metrics;

	for await (const session of sessions.next({
		sort_by_date: true,
		filter: {
			session_start: query.session_start,
			session_end: query.session_end,
			exercise_names: query.exercise_names
		}
	})) {
		if (elapsed_one_month(result.from, session.performed_at)) {
			result.to = new Date(session.performed_at);
			yield result;

			result.from = new Date(session.performed_at);
			result.metrics = new Map();
		}

		for (const exercise of session.exercises) {
			if (query.exercise_names &&
				!query.exercise_names.some(name => exercise.name == name))
				continue;

			if (!metrics.has(exercise.name)) {
				metrics.set(exercise.name, {
					name: exercise.name,
					new_max_reps: exercise.max_reps,
					new_max_weight: exercise.max_weight,
					reps_progressed: 0,
					weight_progressed: 0,
					progressions_in_reps: 0,
					progressions_in_weight: 0,
					plateau_in_reps: 0,
					plateau_in_weight: 0
				});
				continue;
			}

			const exercise_metrics = metrics.get(exercise.name);
			const cur_max_reps = exercise_metrics.new_max_reps;
			const reps_diff = exercise.max_reps - cur_max_reps;
			const cur_max_weight = exercise_metrics.new_max_weight;
			const weight_diff = exercise.max_weight - cur_max_weight;

			if (reps_diff > 0) {
				exercise_metrics.new_max_reps = exercise.max_reps;
				exercise_metrics.reps_progressed += reps_diff;
				exercise_metrics.progressions_in_reps += 1;
			} else {
				exercise_metrics.plateau_in_reps += 1;
			}

			if (weight_diff > 0) {
				exercise_metrics.new_max_weight = exercise.max_weight;
				exercise_metrics.weight_progressed += weight_diff;
				exercise_metrics.progressions_in_weight += 1;
			} else {
				exercise_metrics.plateau_in_weight += 1;
			}
		}
	}

	if (result.metrics.size) {
		result.to = new Date(query.session_end);
		return result;
	}
}

describe("Exercise performance metrics", async () => {
	const sessions_mock = [{
		performed_at: new Date(2025, 0, 1),
		exercises: [{
			name: "Push-up",
			max_reps: 10,
			max_weight: 0
		}, {
			name: "Pull-up",
			max_reps: 6,
			max_weight: 0
		}]
	}, {
		performed_at: new Date(2025, 0, 3),
		exercises: [{
			name: "Push-up",
			max_reps: 12,
			max_weight: 0
		}, {
			name: "Pull-up",
			max_reps: 6,
			max_weight: 0
		}]
	}, {
		performed_at: new Date(2025, 0, 5),
		exercises: [{
			name: "Push-up",
			max_reps: 13,
			max_weight: 0
		}, {
			name: "Pull-up",
			max_reps: 6,
			max_weight: 2.5
		}]
	}, {
		performed_at: new Date(2025, 0, 8),
		exercises: [{
			name: "Push-up",
			max_reps: 12,
			max_weight: 0
		}, {
			name: "Pull-up",
			max_reps: 8,
			max_weight: 0
		}]
	}];

	const sessions_mock_class = new SessionStore(sessions_mock);

	const { metrics } = (await exercise_performance_metrics(sessions_mock_class, {
		session_start: sessions_mock[0].performed_at,
		session_end: sessions_mock[sessions_mock.length-1].performed_at
	}).next()).value;

	const push_up = metrics.get("Push-up");
	const pull_up = metrics.get("Pull-up");

	it("contain the new max of reps that can be performed", () => {
		strict.equal(push_up.new_max_reps, 13);
		strict.equal(pull_up.new_max_reps, 8);
	});

	it("contain the new max of weight that can be lifted", () => {
		strict.equal(push_up.new_max_weight, 0);
		strict.equal(pull_up.new_max_weight, 2.5);
	});

	it("count how many reps was progressed", () => {
		strict.equal(push_up.reps_progressed, 3);
		strict.equal(pull_up.reps_progressed, 2);
	});

	it("count how many weight was progressed", () => {
		strict.equal(push_up.weight_progressed, 0);
		strict.equal(pull_up.weight_progressed, 2.5);
	});

	it("count how many progressions was achieved in reps", () => {
		strict.equal(push_up.progressions_in_reps, 2);
		strict.equal(pull_up.progressions_in_reps, 1);
	});

	it("count how many progressions was achieved in weight", () => {
		strict.equal(push_up.progressions_in_weight, 0);
		strict.equal(pull_up.progressions_in_weight, 1);
	});

	it("count how many plateau was achieved in reps", () => {
		strict.equal(push_up.plateau_in_reps, 1);
		strict.equal(pull_up.plateau_in_reps, 2);
	});

	it("count how many plateau was achieved in weight", () => {
		strict.equal(push_up.plateau_in_weight, 3);
		strict.equal(pull_up.plateau_in_weight, 2);
	});

	it("returns the metrics for a specific date range", async () => {
		const { from, to, metrics } = (await exercise_performance_metrics(sessions_mock_class, {
			session_start: sessions_mock[1].performed_at,
			session_end: sessions_mock[2].performed_at
		}).next()).value;

		const push_up = metrics.get("Push-up");
		const pull_up = metrics.get("Pull-up");

		strict.equal(from.getTime(), sessions_mock[1].performed_at.getTime());
		strict.equal(to.getTime(), sessions_mock[2].performed_at.getTime());
		strict.equal(push_up.new_max_reps, 13);
		strict.equal(pull_up.new_max_reps, 6);
	});

	it("contain filtered metrics for a specific exercise", async () => {
		const { metrics } = (await exercise_performance_metrics(sessions_mock_class, {
			exercise_names: ["Push-up"],
			session_start: sessions_mock[0].performed_at,
			session_end: sessions_mock[sessions_mock.length-1].performed_at
		}).next()).value;

		strict.equal(metrics.size, 1);
		strict.equal(metrics.has("Push-up"), true);
	});
});
