import * as Queue from 'bull';
import * as _ from 'lodash';

type JobHandler = (job: Queue.Job) => Promise<any> | void;

export default class Task {
	public name;
	public queue: Queue.Queue;

	constructor(public id: string, public handler: JobHandler, public options?: Queue.QueueOptions) {
		this.name = _.capitalize(_.words(id).join(' '));
		this.queue = new Queue(this.id, this.options);
		this.queue.process(this.handler);
	}

	public getJob(jobId): Promise<Queue.Job> {
		return toPromise(this.queue.getJob(jobId));
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

function toPromise(promish) {
	return Promise.resolve(promish);
}
