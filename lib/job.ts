import * as Bull from 'bull';
import * as _ from 'lodash';
import * as moment from 'moment';
import Jobba from './jobba';
import Task from './task';
import chalk from 'chalk';
import { toPromise } from './utils';

type LogLevel = 'debug' | 'error' | 'info' | 'log' | 'warn';
interface Log {
	level: LogLevel;
	time: Date;
	values: Array<any>;
}

const formats = {
	debug: chalk.bold.white,
	error: chalk.bold.red,
	info: chalk.bold.blue,
	log: chalk.bold.green,
	warn: chalk.bold.keyword('orange'),
};

function errorToJson() {
	return { name: this.name, message: this.message, stack: this.stack };
}

export default class Job {
	static isJobData(value: any) {
		return typeof value.name === 'string'
			&& typeof value.params === 'object'
			&& Array.isArray(value.history)
			&& Array.isArray(value.logs)
		;
	}

	public jobba: Jobba;
	public params: any;
	public state: any;
	public status: any;

	protected id: string;

	private data: {
		name: string;
		params: any;
		state: any;
		logs: Array<Log>;
		history: Array<any>;
	};

	constructor(protected task: Task, protected job: Bull.Job) {
		this.id = task.id;
		this.params = job.data;

		this.data = {
			name: moment().format('llll'),
			params: null,
			state: undefined,
			logs: [],
			history: [],
		};

		// Store data from previous failed runs, and unroll params
		if (Job.isJobData(this.params)) {
			this.state = this.data.state = this.params.state;

			this.data.logs = this.params.logs;
			delete this.params.logs;

			this.data.history = [ ...this.params.history, this.params ];
			delete this.params.history;

			this.params = this.params.params;
		}

		this.data.params = _.cloneDeep(this.params);
	}

	public init(): any {}

	public process(): any {
		return this.throw('Job must implement method: process');
	}

	public save(value?: any) {
		if (arguments.length) this.state = value;
		this.data.state = this.state;
		return toPromise(this.job.update(this.data));
	}

	public async logger(level: LogLevel, ...values) {
		const log: Log = {
			level,
			time: new Date(),
			values: values.map((value) => {
				if (value instanceof Error) (value as any).toJSON = errorToJson;
				return value;
			})
		};
		const levelText = formats[log.level](`[${log.level.toUpperCase()}]`);
		const hash = chalk.bold(`${this.task.id}:${this.job.id}`);
		console[log.level](levelText, hash, ...log.values);
		this.data.logs.push(log);
		await this.save();
	}

	public debug(...values) { return this.logger('debug', ...values); }
	public error(...values) { return this.logger('error', ...values); }
	public info(...values) { return this.logger('info', ...values); }
	public log(...values) { return this.logger('log', ...values); }
	public warn(...values) { return this.logger('warn', ...values); }

	public async throw(ex) {
		await this.error(ex);
		throw ex;
	}

	public async fillStatus() {
		this.status = await this.getStatus();
	}

	// Proxies
	public getStatus() { return toPromise(this.job.getState()); }
	protected progress(value: number) { return toPromise(this.job.progress(value)); }
	protected remove() { return toPromise(this.job.remove()); }
	protected retry() { return toPromise(this.job.retry()); }
	protected discard() { return toPromise((this.job as any).discard()); }
	protected promote() { return toPromise(this.job.promote()); }
	protected finished() { return toPromise(this.job.finished()); }
}
