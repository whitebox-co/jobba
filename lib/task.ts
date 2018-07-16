import * as Bull from 'bull';
import * as _ from 'lodash';
import Job from './job';
import { toPromise } from './utils';

type JobHandler = (job: Job) => Promise<any> | void;

export interface TaskParams {
	id: string;
	handler: JobHandler;
	name?: string;
	description?: string;
	options?: Bull.QueueOptions;
}

export default class Task implements TaskParams {
	public id: string;
	public handler: JobHandler;
	public name: string;
	public description: string;

	private queue: Bull.Queue;

	constructor(params: TaskParams) {
		this.id = params.id;
		this.handler = params.handler;
		this.name = params.name || _.capitalize(_.words(this.id).join(' '));
		this.description = params.description;

		this.queue = new Bull(this.id, params.options);
		this.queue.process(async (bullJob: Bull.Job) => {
			const job = new Job(bullJob);
			await job.update();
			return this.handler(job);
		});
	}

	public getQueue(): Bull.Queue {
		return this.queue;
	}

	public getJob(jobId): Promise<Bull.Job> {
		return toPromise(this.queue.getJob(jobId));
	}

	public getJobs(
		types: Array<string>,
		start?: number,
		end?: number,
		asc?: boolean
	): Promise<Array<Bull.Job>> {
		return toPromise((this.queue as any).getJobs(types, start, end, asc));
	}

	public schedule(params?: object, options?: Bull.JobOptions) {
		return toPromise(this.queue.add(params, options));
	}

	public pause() { return toPromise(this.queue.pause()); }
	public resume() { return toPromise(this.queue.resume()); }
	public count() { return toPromise(this.queue.count()); }
	public empty() { return toPromise(this.queue.empty()); }
	public close() { return toPromise(this.queue.close()); }
}
