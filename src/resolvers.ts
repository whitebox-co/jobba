import { JobbaContext } from '../lib';

export default {
	Query: {
		healthcheck: () => true,

		taskIds: (parent, args, ctx: JobbaContext) => {
			return ctx.jobba.list();
		},

		tasks: (parent, args, ctx: JobbaContext) => {
			return ctx.jobba.tasks.values();
		},
	},
};
