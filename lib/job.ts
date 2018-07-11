import * as Bull from 'bull';
import { toPromise } from './utils';

type LogLevel = 'debug' | 'error' | 'info' | 'warn';
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

	constructor(private job: Bull.Job) {
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

	public log(level: LogLevel, ...body) {
		this.data.logs.push({
			level,
			time: new Date(),
			body,
		});
		return this.update();
	}
	public debug(...body) { return this.log('debug', ...body); }
	public error(...body) { return this.log('error', ...body); }
	public info(...body) { return this.log('info', ...body); }
	public warn(...body) { return this.log('warn', ...body); }
}
