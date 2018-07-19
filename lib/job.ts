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

export default class Job {
	public params: any;
	public state: any;

	private data: {
		name: string;
		params: any;
		state: any;
		logs: Array<Log>;
	};

	constructor(private task: Task, private job: Bull.Job) {
		this.params = job.data;

		this.data = {
			name: (new Date()).toLocaleString(),
			params: _.cloneDeep(this.params),
			state: undefined,
			logs: [],
		};
	}

	// Proxies
	public progress(value: number) { return toPromise(this.job.progress(value)); }
	public getState() { return toPromise(this.job.getState()); }
	public remove() { return toPromise(this.job.remove()); }
	public retry() { return toPromise(this.job.retry()); }
	public discard() { return toPromise((this.job as any).discard()); }
	public promote() { return toPromise(this.job.promote()); }
	public finished() { return toPromise(this.job.finished()); }

	public update(value?: any) {
		if (arguments.length) this.state = value;
		this.data.state = this.state;
		return toPromise(this.job.update(this.data));
	}

	public logger(level: LogLevel, ...body) {
		const log: Log = {
			level,
			time: new Date(),
			body,
		};
		const levelText = `[${formats[log.level](log.level.toUpperCase())}]`;
		console[log.level](levelText, `${this.task.id}:${this.job.id}`, ...log.body);
		this.data.logs.push(log);
		return this.update();
	}

	public debug(...body) { return this.logger('debug', ...body); }
	public error(...body) { return this.logger('error', ...body); }
	public info(...body) { return this.logger('info', ...body); }
	public log(...body) { return this.logger('log', ...body); }
	public warn(...body) { return this.logger('warn', ...body); }
}
