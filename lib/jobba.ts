import * as Bluebird from 'bluebird';
import * as Bull from 'bull';
import * as _ from 'lodash';
import * as path from 'path';
import Arena from 'bull-arena';
import Yawk, { Registrar, YawkConfig } from 'yawk';
import express from 'koa-express';
import koaStatic from 'koa-static';
import resolvers from '../src/resolvers';
import { ApolloServer } from 'apollo-server-koa';
import { Context as KoaContext } from 'koa';
import { Context } from 'apollo-server-core';
import { Task, TaskParams } from './task';
import { importSchema } from 'graphql-import';
import { routes } from '../src/routes';

const schema = importSchema(path.join(__dirname, '../src/schema.graphql'));

export interface JobbaConfig {
	yawk?: YawkConfig;
}

export interface JobbaContext extends Context {
	jobba?: Jobba;
	task?: Task;
}

export interface JobbaYawkContext extends KoaContext {
	jobba?: Jobba;
	task?: Task;
}

export class Jobba {
	private static defaultConfig: Partial<JobbaConfig> = {
		yawk: {
			prefix: '/api',
			init: false,
		},
	};

	public server: ApolloServer;
	public yawk: Yawk;
	public tasks: Map<string, Task>;

	private config: JobbaConfig;

	constructor(config: JobbaConfig, ...registrars: Array<Registrar<Jobba>>) {
		this.config = _.defaultsDeep(config, Jobba.defaultConfig);
		this.server = new ApolloServer({
			typeDefs: schema,
			resolvers,
			context: {
				jobba: this,
			},
		});
		this.yawk = new Yawk(this.config.yawk);
		this.tasks = new Map();

		this.init(registrars);
	}

	public getTask(id): Task {
		return this.tasks.get(id);
	}

	public async start() {
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
		task.jobba = this;
		this.tasks.set(task.id, task);
		return task;
	}

	public schedule(id: string, params?: object, options?: Bull.JobOptions) {
		return this.getTask(id).schedule(params, options);
	}

	public list() {
		return Array.from(this.tasks.keys());
	}

	public async closeAll() { for (const [ , task ] of this.tasks) await task.close(); }
	public async emptyAll() { for (const [ , task ] of this.tasks) await task.empty(); }
	public async pauseAll() { for (const [ , task ] of this.tasks) await task.pause(); }
	public async resumeAll() { for (const [ , task ] of this.tasks) await task.resume(); }

	private async init(registrars: Array<Registrar<Jobba>>) {
		console.log('Initializing Jobba...');
		// TODO: make this middleware just for task routes
		this.yawk.app.use((ctx: JobbaYawkContext, next) => {
			ctx.jobba = this;
			return next();
		});
		this.yawk.init([ routes ]);

		console.log('Initializing tasks...');
		for (const registrar of registrars) await registrar(this);

		console.log('Initializing UI...');
		const arena = new Arena({
			queues: [ ...this.tasks.values() ].map((task) => ({ name: task.id, hostId: task.name }))
		}, {
			disableListen: true,
			useCdn: false,
		});

		// Mount graphql server
		this.server.applyMiddleware({ app: this.yawk.app });

		// Make UI work in both normal and linked dev environments, respectively
		this.yawk.app.use(koaStatic(path.join(__dirname, '../../..', 'bull-arena/public').replace('/dist', '')));
		this.yawk.app.use(koaStatic(path.join(__dirname, '..', 'node_modules/bull-arena/public').replace('/dist', '')));
		this.yawk.app.use(express(arena));
	}
}
