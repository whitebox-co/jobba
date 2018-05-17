import { Method } from '../../lib/server';

export default [
	{
		path: '/',
		method: Method.Get,
		handler: (ctx) => {
			ctx.body = { time: new Date() };
		}
	}, {
		path: '/queues',
		method: Method.All,
		handler: (ctx) => {
			ctx.body = ctx.jobba.list();
		}
	}, {
		path: '/queues/:id',
		method: Method.Get,
		handler: async (ctx) => {
			ctx.queue = ctx.jobba.get(ctx.params.id);
			ctx.body = true;
		}
	}, {
		path: '/queues/:id/*',
		method: Method.All,
		handler: (ctx, next) => {
			ctx.queue = ctx.jobba.get(ctx.params.id);
			return next();
		}
	}, {
		path: '/queues/:id/schedule',
		method: Method.Post,
		handler: async (ctx) => {
			const { data, options } = ctx.request.body;
			ctx.body = await ctx.jobba.schedule(ctx.params.id, data, options);
		}
	}, {
		path: '/queues/:id/pause',
		method: Method.Post,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.pause(ctx.params.id);
		}
	}, {
		path: '/queues/:id/resume',
		method: Method.Post,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.resume(ctx.params.id);
		}
	}, {
		path: '/queues/:id/count',
		method: Method.Get,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.count(ctx.params.id);
		}
	}, {
		path: '/queues/:id/empty',
		method: Method.Post,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.empty(ctx.params.id);
		}
	}, {
		path: '/queues/:id/close',
		method: Method.Post,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.close(ctx.params.id);
		}
	}, {
		path: '/queues/:id/getJob',
		method: Method.Get,
		handler: async (ctx) => {
			const { jobId } = ctx.request.query;
			ctx.body = await ctx.jobba.getJob(ctx.params.id, jobId);
		}
	}, {
		path: '/queues/:id/getJobs',
		method: Method.Get,
		handler: async (ctx) => {
			const { types, start, end, asc } = ctx.request.query;
			console.log(ctx.queue);
			ctx.body = await ctx.jobba.get(ctx.params.id).getJobs(types, start, end, asc);
		}
	},
];
