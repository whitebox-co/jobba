import * as Arena from 'bull-arena';
import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import * as Queue from 'bull';
import * as express from 'koa-express';
import * as koaBody from 'koa-bodyparser';
import * as koaStatic from 'koa-static';
import * as path from 'path';
import Jobba, { Task } from './jobba';
import routes from './routes';
import { Handler, Method, Route } from './utils';

export default class Server {
	app: Koa;
	router: KoaRouter;
	port: number;
	jobba: Jobba;

	tasks: Array<Task>;

	constructor(tasks: Array<Task>) {
		this.app = new Koa();
		this.router = new KoaRouter({ prefix: '/api' });
		this.port = 3000;
		this.jobba = new Jobba();

		this.init(tasks);
	}

	public register(route: Route | string, method: Method = Method.Get, handler: Handler = () => {}) {
		if (typeof route !== 'string') {
			handler = route.handler;
			method = route.method;
			route = route.path;
		}
		this.router[method.toLowerCase()](route, handler);
	}

	public start() {
		console.log('Listening on port:', this.port);
		this.app.listen(this.port);
	}

	private init(tasks: Array<Task>) {
		console.log('Initializing server...');
		this.initRoutes(routes);
		this.initTasks(tasks);

		const arena = Arena({
			queues: this.tasks.map((task) => (
				{ name: task.id, hostId: task.name }
			)),
		}, {
			disableListen: true,
			useCdn: false,
		});

		this.app.use(koaStatic(path.join(__dirname, '..', 'node_modules/bull-arena/public')));
		this.app.use(koaBody());

		this.app.use((ctx, next) => {
			ctx.server = this;
			ctx.jobba = this.jobba;
			return next();
		});
		this.app.use(this.router.routes());
		this.app.use(this.router.allowedMethods());
		this.app.use(express(arena));
	}

	private initRoutes(routes: Array<Route>) {
		console.log('Registering routes...');

		for (const route of routes) this.register(route);

		this.register('/routes', Method.Get, (ctx) => {
			ctx.body = routes.filter((route) => !route.private);
		});
	}

	private initTasks(tasks: Array<Task>) {
		this.tasks = [];

		console.log('Registering tasks...');
		for (const task of tasks) {
			this.tasks.push(task);
			this.jobba.register(task);
		}
	}
}
