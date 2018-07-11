import * as Bull from 'bull';
import { toPromise } from './utils';

export default class Job {
	constructor(private job: Bull.Job) {
	}

	// Proxies
	public progress(value: number) { return toPromise(this.job.progress(value)); }
	public getState() { return toPromise(this.job.getState()); }
	public remove() { return toPromise(this.job.remove()); }
	public retry() { return toPromise(this.job.retry()); }
	public discard() { return toPromise((this.job as any).discard()); }
	public promote() { return toPromise(this.job.promote()); }
	public finished() { return toPromise(this.job.finished()); }
	public update(state?: any) { return toPromise(this.job.update(state)); }
}
