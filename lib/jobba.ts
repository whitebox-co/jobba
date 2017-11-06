import * as Bull from 'bull';

interface JobbaConfig {}

type JobHandler = (job: Bull.Job) => Promise<any>;

export default class Jobba {
	config: JobbaConfig;
	queues: Map<string, Bull.Queue>;

	constructor(config) {
		this.config = config;
		this.queues = new Map();
	}

	register(id: string, fn: JobHandler, options?: Bull.QueueOptions) {
		const queue = new Bull(id, options);
		this.queues.set(id, queue);
		queue.process(fn);
		return queue;
	}

	schedule(id: string, data: any, options?: Bull.JobOptions) {
		this.queues.get(id).add(data, options);
	}

	get(id) { return this.queues.get(id); }

	pause(id) {
		return this.get(id).pause();
	}
	async pauseAll() { for (const [ id, queue ] of this.queues) await this.pause(id); }

	resume(id) {
		return this.get(id).resume();
	}
	async resumeAll() { for (const [ id, queue ] of this.queues) await this.resume(id); }

	empty(id) {
		return this.get(id).empty();
	}
	async emptyAll() { for (const [ id, queue ] of this.queues) await this.empty(id); }

	close(id) {
		return this.get(id).close();
	}
	async closeAll() { for (const [ id, queue ] of this.queues) await this.close(id); }
}
