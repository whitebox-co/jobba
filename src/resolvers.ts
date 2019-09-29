import { JobbaContext } from '../lib';
import { combineResolvers } from 'graphql-resolvers';

// Add task to the context based on the taskId argument.
const taskResolver = (parent, args, ctx: JobbaContext) => {
	ctx.task = ctx.jobba.getTask(args.taskId);
};

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
	},
};
