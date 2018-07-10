import Jobba, { JobbaContext, Task } from '../../lib/jobba';
import Yawk, { Method } from 'yawk';

export default function(yawk: Yawk) {
	yawk.register({
		path: '/tasks',
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.list();
		},
	});

	yawk.register({
		path: '/tasks/repeating',
		private: true,
		handler: async (ctx: JobbaContext) => {
			const result = [];
			for (const [ , task ] of ctx.jobba.tasks) {
				const jobs = await task.queue.getRepeatableJobs();
				for (const job of jobs) {
					result.push({
						id: task.id,
						name: task.name,
						cron: job.cron,
						next: new Date(job.next),
					});
				}
			}
			return result;
		},
	});

	yawk.register({
		path: '/tasks/:id',
		private: true,
		handler: async (ctx: JobbaContext) => {
			return true;
		},
	});

	yawk.register({
		path: '/tasks/:id/*',
		method: Method.All,
		handler: (ctx: JobbaContext, next) => {
			ctx.task = ctx.jobba.get(ctx.params.id);
			return next();
		},
	});

	yawk.register({
		path: '/tasks/:id/schedule',
		method: Method.Post,
		handler: (ctx: JobbaContext) => {
			const { data, options } = ctx.request.body as any;
			return ctx.jobba.schedule(ctx.params.id, data, options);
		},
	});

	yawk.register({
		path: '/tasks/:id/pause',
		method: Method.Post,
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.pause(ctx.params.id);
		},
	});

	yawk.register({
		path: '/tasks/:id/resume',
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.resume(ctx.params.id);
		},
	});

	yawk.register({
		path: '/tasks/:id/count',
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.count(ctx.params.id);
		},
	});

	yawk.register({
		path: '/tasks/:id/empty',
		method: Method.Post,
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.empty(ctx.params.id);
		},
	});

	yawk.register({
		path: '/tasks/:id/close',
		method: Method.Post,
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.close(ctx.params.id);
		},
	});

	yawk.register({
		path: '/tasks/:id/getJob',
		handler: (ctx: JobbaContext) => {
			const { jobId } = ctx.request.query;
			return ctx.jobba.getJob(ctx.params.id, jobId);
		},
	});

	yawk.register({
		path: '/tasks/:id/getJobs',
		handler: (ctx: JobbaContext) => {
			const { types, start, end, asc } = ctx.request.query;
			return (ctx.task.queue as any).getJobs(types, start, end, asc);
		},
	});
}
