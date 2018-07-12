import * as joi from 'joi';
import Jobba, { JobbaContext, Task } from '../../lib';
import Yawk, { Method } from 'yawk';

export default function(yawk: Yawk) {
	yawk.register({
		path: '/tasks',
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.list();
		},
	});

	yawk.register({
		path: '/tasks/scheduled',
		private: true,
		handler: async (ctx: JobbaContext) => {
			const result = [];
			for (const [ , task ] of ctx.jobba.tasks) {
				const jobs = await task.getQueue().getDelayed();
				for (const job of jobs) {
					result.push({
						id: task.id,
						name: task.name,
						cron: (job as any).opts.repeat.cron,
						next: new Date((job as any).timestamp + (job as any).delay),
						repeat: (job as any).opts.repeat,
						input: job.data,
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
			ctx.task = ctx.jobba.getTask(ctx.params.id);
			return next();
		},
	});

	yawk.register({
		path: '/tasks/:id/schedule',
		method: Method.Post,
		inputSchema: {
			params: joi.any(),
			options: {
				priority: joi.number(),
				delay: joi.number(),
				attempts: joi.number(),
				repeat: {
					cron: joi.string(),
					tz: joi.string(),
					endDate: joi.any()
						// .concat(joi.date())
						// .concat(joi.string())
						// .concat(joi.number())
					,
					limit: joi.number(),
					every: joi.number(),
				},
				backoff: joi.any()
					// .concat(joi.number())
					// .concat(joi.object({
					// 	type: joi.string(),
					// 	delay: joi.number(),
					// }))
				,
				lifo: joi.boolean(),
				timeout: joi.number(),
				jobId: joi.any()
					// .concat(joi.number())
					// .concat(joi.string())
				,
				removeOnComplete: joi.boolean(),
				removeOnFail: joi.boolean(),
				stackTraceLimit: joi.number(),
			},
		},
		handler: (ctx: JobbaContext) => {
			const { params, options } = ctx.request.body as any;
			return ctx.jobba.schedule(ctx.params.id, params, options);
		},
	});

	yawk.register({
		path: '/tasks/:id/pause',
		method: Method.Post,
		handler: (ctx: JobbaContext) => {
			return ctx.task.pause();
		},
	});

	yawk.register({
		path: '/tasks/:id/resume',
		handler: (ctx: JobbaContext) => {
			return ctx.task.resume();
		},
	});

	yawk.register({
		path: '/tasks/:id/count',
		handler: (ctx: JobbaContext) => {
			return ctx.task.count();
		},
	});

	yawk.register({
		path: '/tasks/:id/empty',
		method: Method.Post,
		handler: (ctx: JobbaContext) => {
			return ctx.task.empty();
		},
	});

	yawk.register({
		path: '/tasks/:id/close',
		method: Method.Post,
		handler: (ctx: JobbaContext) => {
			return ctx.task.close();
		},
	});

	yawk.register({
		path: '/tasks/:id/getJob',
		inputSchema: {
			jobId: joi.string(),
		},
		handler: (ctx: JobbaContext) => {
			const { jobId } = ctx.request.query;
			return ctx.task.getJob(jobId);
		},
	});

	yawk.register({
		path: '/tasks/:id/getJobs',
		inputSchema: {
			types: joi.array().items(joi.string()),
			start: joi.number(),
			end: joi.number(),
			asc: joi.boolean(),
		},
		handler: (ctx: JobbaContext) => {
			const { types, start, end, asc } = ctx.request.query;
			return ctx.task.getJobs(types, start, end, asc);
		},
	});
}
