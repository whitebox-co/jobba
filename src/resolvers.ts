import * as _ from 'lodash';
import { JobbaContext } from '../lib';
import { combineResolvers } from 'graphql-resolvers';

// Add task to the context based on the taskId argument.
const taskResolver = (parent, { taskId }: any, ctx: JobbaContext) => {
	ctx.task = ctx.jobba.getTask(taskId);
};

interface JobsQueryOptions {
	statuses?: Array<string>;
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
			async (parent, args: any, ctx: JobbaContext) => {
				const options: JobsQueryOptions = args.options || {};
				let results = await ctx.task.getJobs(options.statuses);

				// sort
				results = _.sortBy(results, 'id');
				if (options.sort === 'descending') results.reverse();

				// limit
				results = results.slice(0, options.limit);

				// filter
				if (options.filter) results = _.filter(results, options.filter);

				// annotate jobs with current status
				// TODO: only fill status if `status` field requested
				for (const result of results) {
					await result.fillStatus();
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
