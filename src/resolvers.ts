import * as _ from 'lodash';
import { JobbaContext } from '../lib';
import { combineResolvers } from 'graphql-resolvers';

// Add task to the context based on the taskId argument.
const taskResolver = (parent, args, ctx: JobbaContext) => {
	ctx.task = ctx.jobba.getTask(args.taskId);
};

interface JobsInput {
	statuses: Array<string>;
	begin: number;
	end: number;
	sort: string;
	limit: number;
	filter: any;
}

export default {
	Query: {
		healthcheck: () => true,

		taskIds: (parent, args, ctx: JobbaContext) => {
			return ctx.jobba.list();
		},

		tasks: (parent, args, ctx: JobbaContext) => {
			return ctx.jobba.tasks.values();
		},

		task: (parent, args, ctx: JobbaContext) => {
			return ctx.jobba.getTask(args.taskId);
		},

		count: combineResolvers(
			taskResolver,
			(parent, args, ctx: JobbaContext) => {
				return ctx.task.count();
			}
		),

		jobs: combineResolvers(
			taskResolver,
			async (parent, args, ctx: JobbaContext) => {
				const input: JobsInput = args.input || {};
				let results = await ctx.task.getJobs(input.statuses);

				// sort
				results = _.sortBy(results, 'id');
				if (input.sort === 'descending') results.reverse();

				// limit
				results = results.slice(0, input.limit);

				// filter
				if (input.filter) results = _.filter(results, input.filter);

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
			(parent, args, ctx: JobbaContext) => {
				return ctx.task.getJob(args.jobId);
			}
		),
	},
};
