import Jobba, { Task } from '../../lib/jobba';
import Server, { Method } from 'yawk';
import { Context } from 'koa';

interface JobbaContext extends Context {
	jobba?: Jobba;
	task?: Task;
}

export default function(server: Server) {
	server.register({
		path: '/tasks',
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.list();
		},
	});

	server.register({
		path: '/tasks/:id',
		private: true,
		handler: async (ctx: JobbaContext) => {
			ctx.task = ctx.jobba.get(ctx.params.id);
			return true;
		},
	});

	server.register({
		path: '/tasks/:id/*',
		method: Method.All,
		handler: (ctx: JobbaContext, next) => {
			ctx.task = ctx.jobba.get(ctx.params.id);
			return next();
		},
	});

	server.register({
		path: '/tasks/:id/schedule',
		method: Method.Post,
		handler: (ctx: JobbaContext) => {
			const { data, options } = ctx.request.body as any;
			return ctx.jobba.schedule(ctx.params.id, data, options);
		},
	});

	server.register({
		path: '/tasks/:id/pause',
		method: Method.Post,
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.pause(ctx.params.id);
		},
	});

	server.register({
		path: '/tasks/:id/resume',
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.resume(ctx.params.id);
		},
	});

	server.register({
		path: '/tasks/:id/count',
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.count(ctx.params.id);
		},
	});

	server.register({
		path: '/tasks/:id/empty',
		method: Method.Post,
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.empty(ctx.params.id);
		},
	});

	server.register({
		path: '/tasks/:id/close',
		method: Method.Post,
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.close(ctx.params.id);
		},
	});

	server.register({
		path: '/tasks/:id/getJob',
		handler: (ctx: JobbaContext) => {
			const { jobId } = ctx.request.query;
			return ctx.jobba.getJob(ctx.params.id, jobId);
		},
	});

	server.register({
		path: '/tasks/:id/getJobs',
		handler: (ctx: JobbaContext) => {
			const { types, start, end, asc } = ctx.request.query;
			return (ctx.task.queue as any).getJobs(types, start, end, asc);
		},
	});
}
