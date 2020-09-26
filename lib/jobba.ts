import * as Bull from 'bull';
import * as _ from 'lodash';
import * as path from 'path';
import resolvers from '../src/resolvers';
import { ApolloServer } from 'apollo-server';
import { Context } from 'apollo-server-core';
import { Task, TaskParams } from './task';
import { importSchema } from 'graphql-import';

const schema = importSchema(path.join(__dirname, '../src/schema.graphql'));

export interface JobbaConfig {
	port?: number;
	playground?: boolean;
	introspection?: boolean;
	logFormat?: string;
}

export interface JobbaContext extends Context {
	jobba?: Jobba;
	task?: Task;
}

export type Registrar<T> = (registrar: T) => any;

export class Jobba {
	private static defaultConfig: Partial<JobbaConfig> = {
		port: 4000,
		playground: true,
		introspection: true,
		logFormat: 'console'
	};

	public server: ApolloServer;
	public tasks: Map<string, Task>;

	public config: JobbaConfig;

	constructor(config: JobbaConfig, ...registrars: Array<Registrar<Jobba>>) {
		this.config = _.defaultsDeep(config, Jobba.defaultConfig);
		this.server = new ApolloServer({
			typeDefs: schema,
			resolvers,
			playground: this.config.playground,
			introspection: this.config.introspection,
			context: {
				jobba: this,
			},
		});
		this.tasks = new Map();

		this.init(registrars);
	}

	public getTask(id: string): Task {
		return this.tasks.get(id);
	}

	public async start() {
		const { url } = await this.server.listen({ port: this.config.port });
		console.log(`🚀  Server ready at ${url}`);
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

		console.log('Initializing tasks...');
		for (const registrar of registrars) await registrar(this);
	}
}
