export type ExercisePerformance = {
	name: string;
	max_reps: number;
	max_weight: number;
};

export type Session = {
	performed_at: Date;
	exercises: ExercisePerformance[];
};

export type ExercisePerformanceMetrics = {
	exercise_name: string;
	new_max_reps: number;
	new_max_weight: number;
	reps_progressed: number;
	weight_progressed: number;
	progressions_in_reps: number;
	progressions_in_weight: number;
	plateau_in_reps: number;
	plateau_in_weight: number;
};
