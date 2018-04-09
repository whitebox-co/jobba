import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import * as Queue from 'bull';
import * as koaBody from 'koa-bodyparser';
import Jobba, { Task } from '../lib/jobba';

export enum Method {
	All = 'all',
	Del = 'del',
	Delete = 'delete',
	Get = 'get',
	Patch = 'patch',
	Post = 'post',
	Put = 'put',
}

export interface Route {
	path: string;
	method: Method;
	handler: (ctx: Koa.Context, next?: () => void) => any;
}

export default class Server {
	app: Koa;
	router: KoaRouter;
	port: number;
	jobba: Jobba;

	constructor(routes: Array<Route>, tasks: Array<Task>) {
		this.app = new Koa();
		this.router = new KoaRouter();
		this.port = 3000;
		this.jobba = new Jobba();

		this.init(routes, tasks);
	}

	public start() {
		console.log('Listening on port:', this.port);
		this.app.listen(this.port);
	}

	private init(routes: Array<Route>, tasks: Array<Task>) {
		console.log('Initializing server...');
		this.routes(routes);
		this.tasks(tasks);

		this.app.use(koaBody());
		this.app.use((ctx, next) => {
			ctx.server = this;
			ctx.jobba = this.jobba;
			return next();
		});
		this.app.use(this.router.routes());
		this.app.use(this.router.allowedMethods());
	}

	private routes(routes: Array<Route>) {
		console.log('Registering routes...');
		for (const route of routes) {
			this.router[route.method](route.path, route.handler);
		}
	}

	private tasks(tasks: Array<Task>) {
		console.log('Registering tasks...');
		for (const task of tasks) {
			this.jobba.register(task.id, task.handler, task.options);
		}
	}
}
