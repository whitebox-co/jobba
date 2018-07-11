import * as Arena from 'bull-arena';
import * as Bluebird from 'bluebird';
import * as Queue from 'bull';
import * as _ from 'lodash';
import * as express from 'koa-express';
import * as koaStatic from 'koa-static';
import * as path from 'path';
import Task from './task';
import Yawk, { Registrar, YawkConfig } from 'yawk';
import routes from '../src/routes';
import { Context } from 'koa';

interface JobbaConfig {
	api: YawkConfig;
}

export interface JobbaContext extends Context {
	jobba?: Jobba;
	task?: Task;
}

export default class Jobba {
	public yawk: Yawk;
	public tasks: Map<string, Task>;

	constructor(private config: JobbaConfig, ...registrars: Array<Registrar<Jobba>>) {
		config.api.prefix = '/api';
		config.api.init = false;
		this.yawk = new Yawk(config.api);
		this.tasks = new Map();

		this.init(registrars);
	}

	public getTask(id): Task {
		return this.tasks.get(id);
	}

	public start() {
		this.yawk.start();
	}

	public register(task: Task) {
		if (this.tasks.has(task.id)) throw new Error('Job already registered.');
		this.tasks.set(task.id, task);
	}

	public schedule(id: string, data: any, options?: Queue.JobOptions) {
		return this.getTask(id).queue.add(data, options);
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
