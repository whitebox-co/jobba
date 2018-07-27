import * as Bull from 'bull';
import * as _ from 'lodash';
import Task from './task';
import chalk from 'chalk';
import { toPromise } from './utils';

type LogLevel = 'debug' | 'error' | 'info' | 'log' | 'warn';
interface Log {
	level: LogLevel;
	time: Date;
	body: Array<any>;
}

const formats = {
	debug: chalk.bold.white,
	error: chalk.bold.red,
	info: chalk.bold.blue,
	log: chalk.bold.green,
	warn: chalk.bold.keyword('orange'),
};

class JobError extends Error {
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			stack: this.stack,
		};
	}
}

export default class Job {
	public params: any;
	public state: any;

	private data: {
		name: string;
		params: any;
		state: any;
		logs: Array<Log>;
	};

	constructor(protected task: Task, protected job: Bull.Job) {
		this.params = job.data;

		this.data = {
			name: (new Date()).toLocaleString(),
			params: _.cloneDeep(this.params),
			state: undefined,
			logs: [],
		};
	}

	public init(): any {
		// Initialize data
		return this.update();
	}

	public process(): any {
		return this.throw('Job must implement method: process');
	}

	public logger(level: LogLevel, ...body) {
		const log: Log = {
			level,
			time: new Date(),
			body,
		};
		const levelText = formats[log.level](`[${log.level.toUpperCase()}]`);
		const hash = chalk.bold(`${this.task.id}:${this.job.id}`);
		console[log.level](levelText, hash, ...log.body);
		this.data.logs.push(log);
		return this.update();
	}

	public debug(...body) { return this.logger('debug', ...body); }
	public error(...body) { return this.logger('error', ...body); }
	public info(...body) { return this.logger('info', ...body); }
	public log(...body) { return this.logger('log', ...body); }
	public warn(...body) { return this.logger('warn', ...body); }

	public async throw(ex) {
		if (typeof ex !== 'object') ex = new JobError(ex);
		await this.error(ex);
		throw ex;
	}

	protected update(value?: any) {
		if (arguments.length) this.state = value;
		this.data.state = this.state;
		return toPromise(this.job.update(this.data));
	}

	// Proxies
	protected progress(value: number) { return toPromise(this.job.progress(value)); }
	protected getState() { return toPromise(this.job.getState()); }
	protected remove() { return toPromise(this.job.remove()); }
	protected retry() { return toPromise(this.job.retry()); }
	protected discard() { return toPromise((this.job as any).discard()); }
	protected promote() { return toPromise(this.job.promote()); }
	protected finished() { return toPromise(this.job.finished()); }
}
