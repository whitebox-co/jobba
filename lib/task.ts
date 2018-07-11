import * as Queue from 'bull';
import * as _ from 'lodash';

type JobHandler = (job: Queue.Job) => Promise<any> | void;

export default class Task {
	public name;
	public queue: Queue.Queue;

	constructor(public id: string, public handler: JobHandler, public options?: Queue.QueueOptions) {
		this.name = _.capitalize(_.words(id).join(' '));
	}
}
