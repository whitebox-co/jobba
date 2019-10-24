import * as _ from 'lodash';
import { JobbaContext, Status } from '../lib';
import { combineResolvers } from 'graphql-resolvers';

// Add task to the context based on the taskId argument.
function taskResolver(parent, { taskId }: any, ctx: JobbaContext) {
	if (taskId) {
		ctx.task = ctx.jobba.getTask(taskId);
		if (!ctx.task) throw new Error(`Task not found: ${taskId}`);
	}
}

async function findJobs(ctx: JobbaContext, statuses: Array<Status>, options: JobsQueryOptions = {}) {
	let jobs = await ctx.task.getJobs(statuses);

	// sort
	jobs = _.sortBy(jobs, 'id');
	if (options.sort === 'descending') jobs.reverse();

	// limit
	jobs = jobs.slice(0, options.limit);

	// filter
	if (options.filter) jobs = _.filter(jobs, options.filter);

	for (const job of jobs) {
		// annotate jobs with extra data
		// TODO: figure out a better way. I don't like this whole `extra` thing.
		job.extra = {};
		const bullJob: any = job.bullJob;
		if (bullJob.opts && bullJob.opts.repeat) job.extra.cron = bullJob.opts.repeat.cron;
		if (bullJob.delay) job.extra.next = new Date(bullJob.timestamp + bullJob.delay);

		// annotate jobs with current status
		// TODO: only fill status if `status` field requested
		await job.fillStatus();
	}

	return jobs;
}

interface JobsQueryOptions {
	statuses?: Array<Status>;
	begin?: number;
	end?: number;
	sort?: string;
	limit?: number;
	filter?: any;
}

export default {
	Query: {
		healthcheck: () => true,

		taskIds: (parent, args: any, ctx: JobbaContext) => {
			return ctx.jobba.list();
		},

		tasks: (parent, args: any, ctx: JobbaContext) => {
			return ctx.jobba.tasks.values();
		},

		task: (parent, { taskId }: any, ctx: JobbaContext) => {
			return ctx.jobba.getTask(taskId);
		},

		count: combineResolvers(
			taskResolver,
			(parent, args: any, ctx: JobbaContext) => {
				return ctx.task.count();
			}
		),

		jobs: combineResolvers(
			taskResolver,
			(parent, args: any, ctx: JobbaContext) => {
				return findJobs(ctx, args.statuses, args.options);
			}
		),

		jobsByStatus: combineResolvers(
			taskResolver,
			async (parent, { status, taskId }: any, ctx: JobbaContext) => {
				const results = [];

				for (const [ , task ] of ctx.jobba.tasks) {
					if (taskId && task.id !== taskId) continue;

					const jobs = await task.getJobsOfStatus(status);
					for (const job of jobs) {
						job.extra = {};
						const bullJob: any = job.bullJob;
						if (bullJob.opts && bullJob.opts.repeat) job.extra.cron = bullJob.opts.repeat.cron;
						if (bullJob.delay) job.extra.next = new Date(bullJob.timestamp + bullJob.delay);
						results.push(job);
					}
				}

				return results;
			}
		),

		job: combineResolvers(
			taskResolver,
			(parent, { jobId }: any, ctx: JobbaContext) => {
				return ctx.task.getJob(jobId);
			}
		),
	},

	Mutation: {
		schedule: combineResolvers(
			taskResolver,
			(parent, { params, options }: any, ctx: JobbaContext) => {
				return ctx.task.schedule(params, options);
			}
		),

		pause: combineResolvers(
			taskResolver,
			(parent, args: any, ctx: JobbaContext) => {
				return ctx.task.pause();
			}
		),

		resume: combineResolvers(
			taskResolver,
			(parent, args: any, ctx: JobbaContext) => {
				return ctx.task.resume();
			}
		),

		empty: combineResolvers(
			taskResolver,
			(parent, args: any, ctx: JobbaContext) => {
				return ctx.task.empty();
			}
		),

		close: combineResolvers(
			taskResolver,
			(parent, args: any, ctx: JobbaContext) => {
				return ctx.task.close();
			}
		),
	}
};
