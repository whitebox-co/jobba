import * as Arena from 'bull-arena';
import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import * as Queue from 'bull';
import * as express from 'koa-express';
import * as koaBody from 'koa-bodyparser';
import * as koaStatic from 'koa-static';
import * as path from 'path';
import Jobba, { Task } from './jobba';
import routes from '../src/routes';

export enum Method {
	All = 'ALL',
	Del = 'DEL',
	Delete = 'DELETE',
	Get = 'GET',
	Patch = 'PATCH',
	Post = 'POST',
	Put = 'PUT',
}

export type Handler = (ctx: Koa.Context, next?: () => void) => any;
export type Registrar = (server: Server) => any;

export interface Route {
	path: string;
	method: Method;
	private?: boolean;
	description?: string;
	handler: Handler;
}

interface RouteOptions {
	private?: boolean;
	description?: string;
}

export interface Config {
	port: number;
}

export default class Server {
	app: Koa;
	router: KoaRouter;
	jobba: Jobba;

	public routes: Array<Route>;

	private tasks: Array<Task>;

	constructor(private config: Config, tasks: Array<Task>) {
		this.app = new Koa();
		this.router = new KoaRouter({ prefix: '/api' });
		this.jobba = new Jobba();

		this.routes = [];
		this.tasks = [];

		this.init(routes, tasks);
	}

	public register(
		path: Route | string,
		method: Method = Method.Get,
		handler: Handler = () => {},
		options: RouteOptions = {}
	) {
		let route: Route;

		if (typeof path === 'string') {
			route = {
				path,
				handler,
				method,
				private: options.private,
				description: options.description,
			};
		}

		handler = route.handler;
		method = route.method;
		path = route.path;

		this.routes.push(route);
		this.router[method.toLowerCase()](path, handler);
	}

	public start() {
		console.log('Listening on port:', this.config.port);
		this.app.listen(this.config.port);
	}

	private init(registrar: Registrar, tasks: Array<Task>) {
		console.log('Initializing server...');

		console.log('Registering routes...');
		registrar(this);

		console.log('Registering tasks...');
		for (const task of tasks) {
			this.tasks.push(task);
			this.jobba.register(task);
		}

		console.log('Registering UI...');
		const arena = Arena({
			queues: this.tasks.map((task) => (
				{ name: task.id, hostId: task.name }
			)),
		}, {
			disableListen: true,
			useCdn: false,
		});

		console.log('Registering API...');
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
}
