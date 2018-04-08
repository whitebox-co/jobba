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
		path: '/schedule',
		method: Method.Post,
		handler: (ctx) => {
			const { jobba } = ctx;
			console.log(jobba);
			ctx.body = ctx.request.body;
		}
	},
];
