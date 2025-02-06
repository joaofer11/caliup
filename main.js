function date_is_in_range(date, range)
{
	const date_ms = date.getTime();
	const start_ms = range.start.getTime();
	const end_ms = range.end.getTime();

	return date_ms >= start_ms &&
	       date_ms <= end_ms;
}

function exercise_performance_metrics(sessions, query)
{
	const result = {};
	const metrics = new Map();

	result.from = query.session_start;
	result.to = query.session_end;
	result.metrics = metrics;

	for (const session of sessions) {
		if (!date_is_in_range(session.performed_at, {
			start: query.session_start,
		    end: query.session_end
		}))
			continue;

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

	return result;
}
