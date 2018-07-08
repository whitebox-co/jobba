import Server, { Method } from 'yawk';

export default function(server: Server) {
	server.register({
		path: '/',
		description: 'Status check.',
		handler: (ctx) => {
			return true;
		},
	});

	server.register({
		path: '/tasks',
		handler: (ctx) => {
			return ctx.jobba.list();
		},
	});

	server.register({
		path: '/tasks/:id',
		private: true,
		handler: async (ctx) => {
			ctx.task = ctx.jobba.get(ctx.params.id);
			return true;
		},
	});

	server.register({
		path: '/tasks/:id/*',
		method: Method.All,
		handler: (ctx, next) => {
			ctx.task = ctx.jobba.get(ctx.params.id);
			return next();
		},
	});

	server.register({
		path: '/tasks/:id/schedule',
		method: Method.Post,
		handler: (ctx) => {
			const { data, options } = ctx.request.body;
			return ctx.jobba.schedule(ctx.params.id, data, options);
		},
	});

	server.register({
		path: '/tasks/:id/pause',
		method: Method.Post,
		handler: (ctx) => {
			return ctx.jobba.pause(ctx.params.id);
		},
	});

	server.register({
		path: '/tasks/:id/resume',
		handler: (ctx) => {
			return ctx.jobba.resume(ctx.params.id);
		},
	});

	server.register({
		path: '/tasks/:id/count',
		handler: (ctx) => {
			return ctx.jobba.count(ctx.params.id);
		},
	});

	server.register({
		path: '/tasks/:id/empty',
		method: Method.Post,
		handler: (ctx) => {
			return ctx.jobba.empty(ctx.params.id);
		},
	});

	server.register({
		path: '/tasks/:id/close',
		method: Method.Post,
		handler: (ctx) => {
			return ctx.jobba.close(ctx.params.id);
		},
	});

	server.register({
		path: '/tasks/:id/getJob',
		handler: (ctx) => {
			const { jobId } = ctx.request.query;
			return ctx.jobba.getJob(ctx.params.id, jobId);
		},
	});

	server.register({
		path: '/tasks/:id/getJobs',
		handler: (ctx) => {
			const { types, start, end, asc } = ctx.request.query;
			return ctx.task.queue.getJobs(types, start, end, asc);
		},
	});
}
