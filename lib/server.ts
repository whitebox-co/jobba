import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import * as Queue from 'bull';
import * as koaBody from 'koa-bodyparser';
import { Task } from '../lib/jobba';

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

	constructor(routes: Array<Route>) {
		this.app = new Koa();
		this.router = new KoaRouter();
		this.port = 3000;

		this.init(routes);
	}

	public start() {
		this.app.listen(this.port);
	}

	private init(routes: Array<Route>) {
		this.tasks();
		this.routes(routes);

		this.app.use(koaBody());
		this.app.use(this.router.routes());
		this.app.use(this.router.allowedMethods());
	}

	private tasks() {
	}

	private routes(routes: Array<Route>) {
		for (const route of routes) {
			this.router[route.method](route.path, route.handler);
		}
	}
}
