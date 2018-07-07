import Server, { Method } from 'yawk';

export default function(server: Server) {
	server.register('/', Method.Get, (ctx) => {
		return true;
	}, { description: 'Status check.' });

	server.register('/routes', Method.Get, (ctx) => {
		return server.routes.filter((route) => !route.private);
	}, { description: 'Route info.' });

	server.register('/tasks', Method.Get, (ctx) => {
		return ctx.jobba.list();
	});

	server.register('/tasks/:id', Method.Get, async (ctx) => {
		ctx.task = ctx.jobba.get(ctx.params.id);
		return true;
	}, { private: true });

	server.register('/tasks/:id/*', Method.All, (ctx, next) => {
		ctx.task = ctx.jobba.get(ctx.params.id);
		return next();
	});

	server.register('/tasks/:id/schedule', Method.Post, (ctx) => {
		const { data, options } = ctx.request.body;
		return ctx.jobba.schedule(ctx.params.id, data, options);
	});

	server.register('/tasks/:id/pause', Method.Post, (ctx) => {
		return ctx.jobba.pause(ctx.params.id);
	});

	server.register('/tasks/:id/resume', Method.Get, (ctx) => {
		return ctx.jobba.resume(ctx.params.id);
	});

	server.register('/tasks/:id/count', Method.Get, (ctx) => {
		return ctx.jobba.count(ctx.params.id);
	});

	server.register('/tasks/:id/empty', Method.Post, (ctx) => {
		return ctx.jobba.empty(ctx.params.id);
	});

	server.register('/tasks/:id/close', Method.Post, (ctx) => {
		return ctx.jobba.close(ctx.params.id);
	});

	server.register('/tasks/:id/getJob', Method.Get, (ctx) => {
		const { jobId } = ctx.request.query;
		return ctx.jobba.getJob(ctx.params.id, jobId);
	});

	server.register('/tasks/:id/getJobs', Method.Get, (ctx) => {
		const { types, start, end, asc } = ctx.request.query;
		return ctx.task.queue.getJobs(types, start, end, asc);
	});
}
