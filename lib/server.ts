import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import * as Queue from 'bull';
import * as koaBody from 'koa-bodyparser';
import Jobba, { Task } from './jobba';
import routes from './routes';
import { Method, Route } from './utils';

type Endpoint = (ctx: Koa.Context, next?: () => void) => any;

export default class Server {
	app: Koa;
	router: KoaRouter;
	port: number;
	jobba: Jobba;

	constructor(tasks: Array<Task>) {
		this.app = new Koa();
		this.router = new KoaRouter();
		this.port = 3000;
		this.jobba = new Jobba();

		this.init(tasks);
	}

	public register(method: Method, path: string, fn: Endpoint) {
		this.router[method](path, fn);
	}

	public start() {
		console.log('Listening on port:', this.port);
		this.app.listen(this.port);
	}

	private init(tasks: Array<Task>) {
		console.log('Initializing server...');
		this.initRoutes(routes);
		this.initTasks(tasks);

		this.app.use(koaBody());
		this.app.use((ctx, next) => {
			ctx.server = this;
			ctx.jobba = this.jobba;
			return next();
		});
		this.app.use(this.router.routes());
		this.app.use(this.router.allowedMethods());
	}

	private initRoutes(routes: Array<Route>) {
		console.log('Registering routes...');
		for (const route of routes) {
			this.router[route.method](route.path, route.handler);
		}
	}

	private initTasks(tasks: Array<Task>) {
		console.log('Registering tasks...');
		for (const task of tasks) {
			this.jobba.register(task);
		}
	}
}
