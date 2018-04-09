import * as Queue from 'bull';

interface JobbaConfig {}

type JobHandler = (job: Queue.Job) => Promise<any>;

export interface Task {
	id: string;
	handler: JobHandler;
	options?: Queue.QueueOptions;
}

export default class Jobba {
	config: JobbaConfig;
	queues: Map<string, Queue.Queue>;

	constructor(config = {}) {
		this.config = config;
		this.queues = new Map();
	}

	public register(id: string, fn: JobHandler, options?: Queue.QueueOptions) {
		if (this.queues.has(id)) throw new Error('Job already registered.');

		const queue = new Queue(id, options);
		this.queues.set(id, queue);
		queue.process(fn);
		return queue;
	}

	public schedule(id: string, data: any, options?: Queue.JobOptions) {
		return this.queues.get(id).add(data, options);
	}

	public pause(id) {
		return this.get(id).pause();
	}
	async pauseAll() { for (const [ id, queue ] of this.queues) await this.pause(id); }

	public resume(id) {
		return this.get(id).resume();
	}
	async resumeAll() { for (const [ id, queue ] of this.queues) await this.resume(id); }

	public count(id) {
		return this.get(id).count();
	}

	public empty(id) {
		return this.get(id).empty();
	}
	public async emptyAll() { for (const [ id, queue ] of this.queues) await this.empty(id); }

	public close(id) {
		return this.get(id).close();
	}
	public async closeAll() { for (const [ id, queue ] of this.queues) await this.close(id); }

	public getJob(id, jobId) {
		return this.get(id).getJob(jobId);
	}

	protected get(id) { return this.queues.get(id); }
}
