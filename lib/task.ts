import * as Bull from 'bull';
import * as _ from 'lodash';
import Job from './job';
import { toPromise } from './utils';

type JobHandler = (job: Job) => Promise<any> | void;

export default class Task {
	public name;

	private queue: Bull.Queue;

	constructor(public id: string, public handler: JobHandler, private options?: Bull.QueueOptions) {
		this.name = _.capitalize(_.words(id).join(' '));
		this.queue = new Bull(this.id, this.options);
		this.queue.process((bullJob: Bull.Job) => {
			this.handler(new Job(bullJob));
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

	public schedule(params: any, options?: Bull.JobOptions) {
		return toPromise(this.queue.add(params, options));
	}

	public pause() {
		return toPromise(this.queue.pause());
	}

	public resume() {
		return toPromise(this.queue.resume());
	}

	public count() {
		return toPromise(this.queue.count());
	}

	public empty() {
		return toPromise(this.queue.empty());
	}

	public close() {
		return toPromise(this.queue.close());
	}
}
