import * as Bull from 'bull';
import Task from './task';
import { toPromise } from './utils';

type LogLevel = 'debug' | 'error' | 'info' | 'log' | 'warn';
interface Log {
	level: LogLevel;
	time: Date;
	body: Array<any>;
}

export default class Job {
	private data: {
		input: any;
		output: any;
		logs: Array<Log>;
	};

	constructor(private task: Task, private job: Bull.Job) {
		this.data = {
			input: job.data,
			output: undefined,
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
		if (arguments.length) this.data.output = value;
		return toPromise(this.job.update(this.data));
	}

	public logger(level: LogLevel, ...body) {
		const log: Log = {
			level,
			time: new Date(),
			body,
		};
		console[log.level](this.task.id, this.job.id, ...log.body);
		this.data.logs.push(log);
		return this.update();
	}

	public debug(...body) { return this.logger('debug', ...body); }
	public error(...body) { return this.logger('error', ...body); }
	public info(...body) { return this.logger('info', ...body); }
	public log(...body) { return this.logger('log', ...body); }
	public warn(...body) { return this.logger('warn', ...body); }
}
