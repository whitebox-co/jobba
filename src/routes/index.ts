import { Method } from '../../lib/server';

export default [
	{
		path: '/',
		method: Method.Get,
		handler: (ctx) => {
			ctx.body = {
				time: new Date()
			};
		}
	}, {
		path: '/schedule/:id',
		method: Method.Post,
		handler: (ctx) => {
			const { data, options } = ctx.request.body;
			ctx.body = ctx.jobba.schedule(ctx.params.id, data, options);
		}
	},
];
