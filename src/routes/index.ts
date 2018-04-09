import { Method } from '../../lib/server';

export default [
	{
		path: '/',
		method: Method.Get,
		handler: (ctx) => {
			ctx.body = { time: new Date() };
		}
	}, {
		path: '/queue/:id/add',
		method: Method.Post,
		handler: async (ctx) => {
			const { data, options } = ctx.request.body;
			ctx.body = await ctx.jobba.schedule(ctx.params.id, data, options);
		}
	}, {
		path: '/queue/:id/pause',
		method: Method.Post,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.pause(ctx.params.id);
		}
	}, {
		path: '/queue/:id/resume',
		method: Method.Post,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.resume(ctx.params.id);
		}
	}, {
		path: '/queue/:id/count',
		method: Method.Get,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.count(ctx.params.id);
		}
	}, {
		path: '/queue/:id/empty',
		method: Method.Post,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.empty(ctx.params.id);
		}
	}, {
		path: '/queue/:id/close',
		method: Method.Post,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.close(ctx.params.id);
		}
	}, {
		path: '/queue/:id/getJob',
		method: Method.Post,
		handler: async (ctx) => {
			ctx.body = await ctx.jobba.getJob(ctx.params.id, ctx.request.body.jobId);
		}
	},
];
