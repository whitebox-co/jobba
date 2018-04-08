import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import * as Queue from 'bull';
import * as koaBody from 'koa-bodyparser';
import Jobba, { Task } from '../lib/jobba';

export enum Method {
	Get = 'get',
	Put = 'put',
	Post = 'post',
	Patch = 'patch',
	Delete = 'delete',
	Del = 'del',
}

export interface Route {
	path: string;
	method: Method;
	handler: (ctx: Koa.Context) => any;
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
		this.app.listen(this.port);
	}

	private init(routes: Array<Route>, tasks: Array<Task>) {
		this.routes(routes);
		this.tasks(tasks);

		this.app.use(koaBody());
		this.app.use((ctx, next) => {
			ctx.server = this;
			ctx.jobba = this.jobba;
			next();
		});
		this.app.use(this.router.routes());
		this.app.use(this.router.allowedMethods());
	}

	private routes(routes: Array<Route>) {
		for (const route of routes) {
			this.router[route.method](route.path, route.handler);
		}
	}

	private tasks(tasks: Array<Task>) {
		for (const task of tasks) {
			this.jobba.register(task.id, task.handler, task.options);
		}
	}
}
