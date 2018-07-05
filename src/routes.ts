import { Method } from './utils';

export default [
	{
		path: '/',
		method: Method.Get,
		description: 'Status check.',
		handler: (ctx) => {
			ctx.body = { time: new Date() };
		}
	}, {
		path: '/tasks',
		method: Method.Get,
		handler: (ctx) => {
			ctx.body = ctx.jobba.list();
		}
	}, {
		path: '/tasks/:id',
		method: Method.Get,
		handler: async (ctx) => {
			ctx.task = ctx.jobba.get(ctx.params.id);
			ctx.body = true;
		}
	}, {
		path: '/tasks/:id/*',
		method: Method.All,
		private: true,
		handler: (ctx, next) => {
			ctx.task = ctx.jobba.get(ctx.params.id);
			return next();
		}
	}, {
		path: '/tasks/:id/schedule',
		method: Method.Post,
		handler: async (ctx) => {
			const { data, options } = ctx.request.body;
			ctx.body = await ctx.jobba.schedule(ctx.params.id, data, options);
		}
	}, {
		path: '/tasks/:id/pause',
		method: Method.Post,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.pause(ctx.params.id);
		}
	}, {
		path: '/tasks/:id/resume',
		method: Method.Post,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.resume(ctx.params.id);
		}
	}, {
		path: '/tasks/:id/count',
		method: Method.Get,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.count(ctx.params.id);
		}
	}, {
		path: '/tasks/:id/empty',
		method: Method.Post,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.empty(ctx.params.id);
		}
	}, {
		path: '/tasks/:id/close',
		method: Method.Post,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.close(ctx.params.id);
		}
	}, {
		path: '/tasks/:id/getJob',
		method: Method.Get,
		handler: async (ctx) => {
			const { jobId } = ctx.request.query;
			ctx.body = await ctx.jobba.getJob(ctx.params.id, jobId);
		}
	}, {
		path: '/tasks/:id/getJobs',
		method: Method.Get,
		handler: async (ctx) => {
			const { types, start, end, asc } = ctx.request.query;
			ctx.body = await ctx.task.queue.getJobs(types, start, end, asc);
		}
	},
];
