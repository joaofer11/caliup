import { strict } from "node:assert";
import { describe, it } from "node:test";
import { fetch_exercise_performance_metrics } from "./fetch_exercise_performance_metrics.js";
import { InMemorySessionStore } from "./in_memory_session_store.js";

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

	const sessions_mock_class = new InMemorySessionStore();
	sessions_mock_class.sessions = sessions_mock;

	const { metrics } = (await fetch_exercise_performance_metrics(sessions_mock_class, {
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

	// it("returns the metrics for a specific date range", async () => {
	// 	const { from, to, metrics } = (await fetch_exercise_performance_metrics(sessions_mock_class, {
	// 		session_start: sessions_mock[1].performed_at,
	// 		session_end: sessions_mock[2].performed_at
	// 	}).next()).value;
	//
	// 	const push_up = metrics.get("Push-up");
	// 	const pull_up = metrics.get("Pull-up");
	//
	// 	strict.equal(from.getTime(), sessions_mock[1].performed_at.getTime());
	// 	strict.equal(to.getTime(), sessions_mock[2].performed_at.getTime());
	// 	strict.equal(push_up.new_max_reps, 13);
	// 	strict.equal(pull_up.new_max_reps, 6);
	// });

	// it("contain filtered metrics for a specific exercise", async () => {
	// 	const { metrics } = (await fetch_exercise_performance_metrics(sessions_mock_class, {
	// 		exercise_names: ["Push-up"],
	// 		session_start: sessions_mock[0].performed_at,
	// 		session_end: sessions_mock[sessions_mock.length-1].performed_at
	// 	}).next()).value;
	//
	// 	strict.equal(metrics.size, 1);
	// 	strict.equal(metrics.has("Push-up"), true);
	// });
});
