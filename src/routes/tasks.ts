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
		path: '/tasks/by-type',
		private: true,
		inputSchema: {
			type: joi.string()
				.required()
				.valid('active', 'completed', 'delayed', 'failed', 'paused', 'waiting')
			,
			taskId: joi.string(),
		},
		handler: async (ctx: JobbaContext) => {
			const { type, taskId }  = ctx.request.query;
			const method = `get${type.charAt(0).toUpperCase()}${type.slice(1)}`;
			const result = [];

			for (const [ , task ] of ctx.jobba.tasks) {
				if (taskId && task.id !== taskId) continue;
				const jobs = await task.getQueue()[method]();

				for (const job of jobs) {
					job.extra = {
						taskId: task.id,
						taskName: task.name,
						taskDescription: task.description,
					};
					if (job.opts && job.opts.repeat) job.extra.cron = (job as any).opts.repeat.cron;
					if (job.delay) job.extra.next = new Date((job as any).timestamp + (job as any).delay);
					result.push(job);
				}
			}
			return result;
		},
	});

	yawk.register({
		path: '/tasks/:id',
		private: true,
		handler: async (ctx: JobbaContext) => {
			return !!ctx.jobba.getTask(ctx.params.id);
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
		path: '/tasks/:id/get-jobs',
		inputSchema: {
			types: joi.array().items(joi.string()),
			type: joi.string(),
			start: joi.number(),
			end: joi.number(),
			asc: joi.boolean(),
		},
		handler: (ctx: JobbaContext) => {
			const { asc, end, start, type } = ctx.request.query;
			let { types } = ctx.request.query;
			if (type && !types) types = [ types ];
			return ctx.task.getJobs(types, start, end, asc);
		},
	});

	yawk.register({
		path: '/tasks/:id/get-job',
		inputSchema: {
			jobId: joi.string().required(),
		},
		handler: (ctx: JobbaContext) => {
			const { jobId } = ctx.request.query;
			return ctx.task.getJob(jobId);
		},
	});
}
