import { Readable } from "node:stream";

export class InMemorySessionStore {
	sessions = [];

	stream_in_date_range(query)
	{
		const sessions = this.sessions;
		let idx = 0;

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

				if (query.session_start) {
					if (session.performed_at.getTime() < query.session_start.getTime())
						return;
				}

				if (query.session_end) {
					if (session.performed_at.getTime() > query.session_end.getTime()) {
						this.push(null);
						return;
					}
				}

				const ret_session = { ...session };
				if (query.exercise_names) {
					ret_session.exercises = session.exercises.filter(e =>
						exercise_names.some(name => e.name === name));
				}
				this.push(ret_session);
			}
		});
	}
}
