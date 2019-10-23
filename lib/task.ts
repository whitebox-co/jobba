import * as _ from 'lodash';
import Bull from 'bull';
import { Job } from './job';
import { Jobba } from './jobba';
import { toPromise } from './utils';

export type Status = 'active' | 'completed' | 'delayed' | 'failed' | 'paused' | 'waiting';

export interface TaskParams {
	id: string;
	Job: typeof Job;
	name?: string;
	description?: string;
	options?: Bull.QueueOptions;
}

export class Task implements TaskParams {
	public id: string;
	public Job: typeof Job;
	public name: string;
	public description: string;
	public jobba: Jobba;

	private queue: Bull.Queue;

	constructor(params: TaskParams) {
		this.id = params.id;
		this.name = params.name || _.capitalize(_.words(this.id).join(' '));
		this.description = params.description;
		this.Job = params.Job || Job;

		this.queue = new Bull(this.id, params.options);
		this.queue.process(async (bullJob: Bull.Job) => {
			const job = new this.Job(this, bullJob);
			job.jobba = this.jobba;
			let result;
			try {
				await job.save();
				await job.init();
				result = await job.process();
			} catch (ex) {
				await job.throw(ex);
			}
			return result;
		});
	}

	public getQueue(): Bull.Queue {
		return this.queue;
	}

	public async getJob(jobId): Promise<Job> {
		const bullJob = await toPromise(this.queue.getJob(jobId));
		return new this.Job(this, bullJob);
	}

	public async getJobs(
		statuses: Array<Status>,
		start?: number,
		end?: number,
		asc?: boolean
	): Promise<Array<Job>> {
		const bullJobs = await toPromise((this.queue as any).getJobs(statuses, start, end, asc));
		return bullJobs.map((bullJob) => new this.Job(this, bullJob));
	}

	public async getJobsOfStatus(status: Status): Promise<Array<Job>> {
		const method = `get${status.charAt(0).toUpperCase()}${status.slice(1)}`;
		const bullJobs = await toPromise(this.queue[method]());
		return bullJobs.map((bullJob: any) => new this.Job(this, bullJob));
	}

	public async schedule(params?: object, options?: Bull.JobOptions) {
		const bullJob = await toPromise(this.queue.add(params, options));
		return this.getJob(bullJob.id);
	}

	public pause() { return toPromise(this.queue.pause()); }
	public resume() { return toPromise(this.queue.resume()); }
	public count() { return toPromise(this.queue.count()); }
	public empty() { return toPromise(this.queue.empty()); }
	public close() { return toPromise(this.queue.close()); }
}
