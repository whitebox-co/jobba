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
	},
];
