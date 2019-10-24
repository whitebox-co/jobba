import * as _ from 'lodash';
import { Job, JobbaContext, Status } from '../lib';
import { combineResolvers } from 'graphql-resolvers';

// Add task to the context based on the taskId argument.
function taskResolver(parent, { taskId }: any, ctx: JobbaContext) {
	if (taskId) {
		ctx.task = ctx.jobba.getTask(taskId);
		if (!ctx.task) throw new Error(`Task not found: ${taskId}`);
	}
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

		task: combineResolvers(
			taskResolver,
			(parent, args: any, ctx: JobbaContext) => {
				return ctx.task;
			}
		),

		count: combineResolvers(
			taskResolver,
			(parent, args: any, ctx: JobbaContext) => {
				return ctx.task.count();
			}
		),

		jobs: combineResolvers(
			taskResolver,
			async (parent, args: any, ctx: JobbaContext, info) => {
				const options: JobsQueryOptions = args.options;
				const statuses: Array<Status> = args.statuses || [];

				const fieldNodes = info.fieldNodes[0].selectionSet.selections;
				const needStatus = fieldNodes.some(({ name }: any) => name.value === 'status');

				let jobs: Array<Job>;

				if (ctx.task) {
					jobs = await ctx.task.getJobs(statuses);
				} else {
					jobs = [];
					for (const [ , task ] of ctx.jobba.tasks) {
						let taskJobs: Array<Job>;
						if (statuses.length === 1) {
							taskJobs = await task.getJobsOfStatus(statuses[0]);
						} else {
							taskJobs = await task.getJobs(statuses);
						}
						jobs.push(...taskJobs);
					}
				}

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
					if (needStatus) await job.fillStatus();
				}

				return jobs;
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
