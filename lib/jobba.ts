import * as Arena from 'bull-arena';
import * as Bluebird from 'bluebird';
import * as Bull from 'bull';
import * as express from 'koa-express';
import * as koaStatic from 'koa-static';
import * as path from 'path';
import Task, { TaskParams } from './task';
import Yawk, { Registrar, YawkConfig } from 'yawk';
import defaultsDeep from 'lodash/defaultsDeep';
import routes from '../src/routes';
import { Context } from 'koa';

export interface JobbaConfig {
	yawk: YawkConfig;
}

export interface JobbaContext extends Context {
	jobba?: Jobba;
	task?: Task;
}

export default class Jobba {
	private static defaultConfig: Partial<JobbaConfig> = {
		yawk: {
			prefix: '/api',
			init: false,
		},
	};

	public yawk: Yawk;
	public tasks: Map<string, Task>;

	private config: JobbaConfig;

	constructor(config: JobbaConfig, ...registrars: Array<Registrar<Jobba>>) {
		this.config = defaultsDeep(Jobba.defaultConfig, config);
		this.yawk = new Yawk(this.config.yawk);
		this.tasks = new Map();

		this.init(registrars);
	}

	public getTask(id): Task {
		return this.tasks.get(id);
	}

	public start() {
		this.yawk.start();
	}

	public register(params: Task | TaskParams) {
		if (this.tasks.has(params.id)) throw new Error('Job already registered.');
		let task: Task;
		if (params instanceof Task) {
			task = params;
		} else {
			task = new Task(params);
		}
		this.tasks.set(task.id, task);
	}

	public schedule(id: string, params: any, options?: Bull.JobOptions) {
		return this.getTask(id).schedule(params, options);
	}

	public list() {
		return Array.from(this.tasks.keys());
	}

	public async closeAll() { for (const [ , task ] of this.tasks) await task.close(); }
	public async emptyAll() { for (const [ , task ] of this.tasks) await task.empty(); }
	public async pauseAll() { for (const [ , task ] of this.tasks) await task.pause(); }
	public async resumeAll() { for (const [ , task ] of this.tasks) await task.resume(); }

	private init(registrars: Array<Registrar<Jobba>>) {
		console.log('Initializing Jobba...');
		// TODO: make this middleware just for task routes
		this.yawk.app.use((ctx: JobbaContext, next) => {
			ctx.jobba = this;
			return next();
		});
		this.yawk.init([ routes ]);

		console.log('Initializing tasks...');
		for (const registrar of registrars) registrar(this);

		console.log('Initializing UI...');
		const queues = [];
		for (const task of this.tasks.values()) {
			queues.push({ name: task.id, hostId: task.name });
		}
		const arena = new Arena({
			queues
		}, {
			disableListen: true,
			useCdn: false,
		});
		this.yawk.app.use(koaStatic(path.join(__dirname, '..', 'node_modules/bull-arena/public').replace('/dist', '')));
		this.yawk.app.use(express(arena));
	}
}
