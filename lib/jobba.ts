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

	register(id: string, fn: JobHandler, options?: Queue.QueueOptions) {
		if (this.queues.has(id)) throw new Error('Job already registered.');

		const queue = new Queue(id, options);
		this.queues.set(id, queue);
		queue.process(fn);
		return queue;
	}

	schedule(id: string, data: any, options?: Queue.JobOptions) {
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
