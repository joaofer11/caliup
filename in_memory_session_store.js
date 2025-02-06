import { Readable } from "node:stream";

export class InMemorySessionStore {
	sessions = [];

	find_streaming(query)
	{
		const sessions = this.sessions;
		let idx = 0;

		if (query.sort_by_date)
			sessions.sort((a, b) => a.performed_at.getTime() - b.performed_at.getTime());


		return new Readable({
			objectMode: true,
			read()
			{
				if (idx === sessions.length) {
					this.push(null);
					return;
				}

				const session = sessions[idx++];

				if (query.filter.session_start) {
					if (session.performed_at.getTime() < query.filter.session_start.getTime())
						return
				}

				if (query.filter.session_end) {
					if (session.performed_at.getTime() > query.filter.session_end.getTime()) {
						if (query.sort_by_date) {
							this.push(null);
							return;
						}
						return;
					}
				}

				const ret_session = { ...session };
				if (query.filter.exercise_names) {
					ret_session.exercises = session.exercises.filter(e =>
						exercise_names.some(name => e.name == name));
				}
				this.push(ret_session);
			}
		});
	}
}
