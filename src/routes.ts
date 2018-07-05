import Server, { Method } from '../lib/server';

export default function(server: Server) {
	server.register('/', Method.Get, (ctx) => {
		ctx.body = true;
	}, { description: 'Status check.' });

	server.register('/routes', Method.Get, (ctx) => {
		ctx.body = server.routes.filter((route) => !route.private);
	}, { description: 'Route info.' });

	server.register('/tasks', Method.Get, (ctx) => {
		ctx.body = ctx.jobba.list();
	});

	server.register('/tasks/:id', Method.Get, async (ctx) => {
		ctx.task = ctx.jobba.get(ctx.params.id);
		ctx.body = true;
	}, { private: true });

	server.register('/tasks/:id/*', Method.All, (ctx, next) => {
		ctx.task = ctx.jobba.get(ctx.params.id);
		return next();
	});

	server.register('/tasks/:id/schedule', Method.Post, async (ctx) => {
		const { data, options } = ctx.request.body;
		ctx.body = await ctx.jobba.schedule(ctx.params.id, data, options);
	});

	server.register('/tasks/:id/pause', Method.Post, async (ctx) => {
		ctx.body = await ctx.jobba.pause(ctx.params.id);
	});

	server.register('/tasks/:id/resume', Method.Get, async (ctx) => {
		ctx.body = await ctx.jobba.resume(ctx.params.id);
	});

	server.register('/tasks/:id/count', Method.Get, async (ctx) => {
		ctx.body = await ctx.jobba.count(ctx.params.id);
	});

	server.register('/tasks/:id/empty', Method.Post, async (ctx) => {
		ctx.body = await ctx.jobba.empty(ctx.params.id);
	});

	server.register('/tasks/:id/close', Method.Post, async (ctx) => {
		ctx.body = await ctx.jobba.close(ctx.params.id);
	});

	server.register('/tasks/:id/getJob', Method.Get, async (ctx) => {
		const { jobId } = ctx.request.query;
		ctx.body = await ctx.jobba.getJob(ctx.params.id, jobId);
	});

	server.register('/tasks/:id/getJobs', Method.Get, async (ctx) => {
		const { types, start, end, asc } = ctx.request.query;
		ctx.body = await ctx.task.queue.getJobs(types, start, end, asc);
	});
}
