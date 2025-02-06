export async function* fetch_exercise_performance_metrics(sessions, query)
{
	const result = {};

	// TODO: Faça com que essa função retorne, no máximo, as métricas
	// de UM mês. Por isso que essa função já está como uma generator.
	result.from = query.session_start;
	result.to = query.session_end;
	result.metrics = new Map();

	const sessions_stream = sessions.stream_in_date_range({
		session_start: query.from,
		session_end: query.to,
		exercise_names: query.exercise_names
	});

	for await (const session of sessions_stream) {
		for (const exercise of session.exercises) {
			if (!result.metrics.has(exercise.name)) {
				result.metrics.set(exercise.name, {
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

			const exercise_metrics = result.metrics.get(exercise.name);
			const cur_max_reps = exercise_metrics.new_max_reps;
			const cur_max_weight = exercise_metrics.new_max_weight;
			const reps_diff = exercise.max_reps - cur_max_reps;
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
