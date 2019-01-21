import * as _ from 'lodash';
import * as joi from 'joi';
import Jobba, { JobbaContext, Task } from '../lib';
import Yawk, { Method } from 'yawk';

export default function(yawk: Yawk) {
	yawk.register({
		path: '/tasks',
		description: 'List all registered tasks.',
		handler: (ctx: JobbaContext) => {
			return ctx.jobba.list();
		},
	});

	yawk.register({
		path: '/by-type',
		inputSchema: {
			type: joi.string()
				.required()
				.valid('active', 'completed', 'delayed', 'failed', 'paused', 'waiting')
			,
			taskId: joi.string(),
		},
		handler: async (ctx: JobbaContext) => {
			const { type, taskId }  = ctx.input;
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
		path: '/task',
		inputSchema: {
			taskId: joi.string().required(),
		},
		handler: async (ctx: JobbaContext) => {
			return !!ctx.jobba.getTask(ctx.input.taskId);
		},
	});

	yawk.register({
		path: '/task/*',
		method: Method.All,
		inputSchema: {
			taskId: joi.string().required(),
		},
		handler: (ctx: JobbaContext, next) => {
			ctx.task = ctx.jobba.getTask(ctx.input.taskId);
			return next();
		},
	});

	yawk.register({
		path: '/task/schedule',
		method: Method.Post,
		inputSchema: {
			taskId: joi.string().required(),
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
			const { options, params, taskId } = ctx.input as any;
			return ctx.jobba.schedule(taskId, params, options);
		},
	});

	yawk.register({
		path: '/task/pause',
		method: Method.Post,
		inputSchema: {
			taskId: joi.string().required(),
		},
		handler: (ctx: JobbaContext) => {
			return ctx.task.pause();
		},
	});

	yawk.register({
		path: '/task/resume',
		inputSchema: {
			taskId: joi.string().required(),
		},
		handler: (ctx: JobbaContext) => {
			return ctx.task.resume();
		},
	});

	yawk.register({
		path: '/task/count',
		inputSchema: {
			taskId: joi.string().required(),
		},
		handler: (ctx: JobbaContext) => {
			return ctx.task.count();
		},
	});

	yawk.register({
		path: '/task/empty',
		method: Method.Post,
		inputSchema: {
			taskId: joi.string().required(),
		},
		handler: (ctx: JobbaContext) => {
			return ctx.task.empty();
		},
	});

	yawk.register({
		path: '/task/close',
		method: Method.Post,
		inputSchema: {
			taskId: joi.string().required(),
		},
		handler: (ctx: JobbaContext) => {
			return ctx.task.close();
		},
	});

	yawk.register({
		path: '/task/jobs',
		inputSchema: {
			taskId: joi.string().required(),
			types: joi.array().items(joi.string()),
			type: joi.string(),
			begin: joi.number(),
			end: joi.number(),
			asc: joi.boolean(),
			limit: joi.number(),
			filter: joi.object(),
		},
		handler: async (ctx: JobbaContext) => {
			const { begin, end, filter, limit } = ctx.input;
			let { asc, types } = ctx.input;
			asc = (typeof asc !== 'undefined') && ![ false, 'false', 0, '0' ].includes(asc);
			if (ctx.input.type && !types) types = [ ctx.input.type ];

			let results = await ctx.task.getJobs(types, begin, end);

			// sort
			results = _.sortBy(results, 'id');
			if (!asc) results.reverse();

			// limit
			results = results.slice(0, limit);

			// filter
			if (filter) results = _.filter(results, filter);

			return results;
		},
	});

	yawk.register({
		path: '/task/job',
		inputSchema: {
			taskId: joi.string().required(),
			jobId: joi.string().required(),
		},
		handler: (ctx: JobbaContext) => {
			const { jobId } = ctx.input;
			return ctx.task.getJob(jobId);
		},
	});
}
