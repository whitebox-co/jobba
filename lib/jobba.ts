import * as Queue from 'bull';
import * as _ from 'lodash';

interface JobbaConfig {}

type JobHandler = (job: Queue.Job) => Promise<any> | void;

export class Task {
	public name;
	public queue: Queue.Queue;

	constructor(public id: string, public handler: JobHandler, public options?: Queue.QueueOptions) {
		this.name = _.capitalize(_.words(id).join(' '));
	}
}

export default class Jobba {
	private config: JobbaConfig;
	private tasks: Map<string, Task>;

	constructor(config = {}) {
		this.config = config;
		this.tasks = new Map();
	}

	public register(task: Task) {
		if (this.tasks.has(task.id)) throw new Error('Job already registered.');

		const queue = new Queue(task.id, task.options);
		task.queue = queue;
		this.tasks.set(task.id, task);
		queue.process(task.handler);
		return queue;
	}

	public schedule(id: string, data: any, options?: Queue.JobOptions) {
		return this.tasks.get(id).queue.add(data, options);
	}

	public pause(id) {
		return this.getQueue(id).pause();
	}
	async pauseAll() { for (const [ id, queue ] of this.tasks) await this.pause(id); }

	public resume(id) {
		return this.getQueue(id).resume();
	}
	async resumeAll() { for (const [ id, queue ] of this.tasks) await this.resume(id); }

	public count(id) {
		return this.getQueue(id).count();
	}

	public empty(id) {
		return this.getQueue(id).empty();
	}
	public async emptyAll() { for (const [ id, queue ] of this.tasks) await this.empty(id); }

	public close(id) {
		return this.getQueue(id).close();
	}
	public async closeAll() { for (const [ id, queue ] of this.tasks) await this.close(id); }

	public getJob(id, jobId) {
		return this.getQueue(id).getJob(jobId);
	}

	public get(id) { return this.tasks.get(id); }
	public getQueue(id) { return this.get(id).queue; }

	public list() { return Array.from(this.tasks.keys()); }
}
