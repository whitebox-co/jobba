import * as Arena from 'bull-arena';
import * as Bluebird from 'bluebird';
import * as Queue from 'bull';
import * as _ from 'lodash';
import * as express from 'koa-express';
import * as koaStatic from 'koa-static';
import * as path from 'path';
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

type JobHandler = (job: Queue.Job) => Promise<any> | void;

export class Task {
	public name;
	public queue: Queue.Queue;

	constructor(public id: string, public handler: JobHandler, public options?: Queue.QueueOptions) {
		this.name = _.capitalize(_.words(id).join(' '));
	}
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

	public get(id) { return this.tasks.get(id); }
	public getQueue(id) { return this.get(id).queue; }
	public getJob(id, jobId) { return this.getQueue(id).getJob(jobId); }

	public start() {
		this.yawk.start();
	}

	public register(task: Task) {
		if (this.tasks.has(task.id)) throw new Error('Job already registered.');

		const queue = new Queue(task.id, task.options);
		task.queue = queue;
		this.tasks.set(task.id, task);
		queue.process(task.handler);
		return queue;
	}

	public schedule(id: string, data: any, options?: Queue.JobOptions) {
		return this.tasks.get(id).queue.add(data, options);
	}

	public pause(id) {
		return this.getQueue(id).pause();
	}
	async pauseAll() { for (const [ id, queue ] of this.tasks) await this.pause(id); }

	public resume(id) {
		return this.getQueue(id).resume();
	}
	async resumeAll() { for (const [ id, queue ] of this.tasks) await this.resume(id); }

	public count(id) {
		return this.getQueue(id).count();
	}

	public empty(id) {
		return this.getQueue(id).empty();
	}
	public async emptyAll() { for (const [ id, queue ] of this.tasks) await this.empty(id); }

	public close(id) {
		return this.getQueue(id).close();
	}
	public async closeAll() { for (const [ id, queue ] of this.tasks) await this.close(id); }

	public list() { return Array.from(this.tasks.keys()); }

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
