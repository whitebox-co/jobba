interface JobbaConfig {
	port: number;
}

export default class Jobba {
	config: JobbaConfig;

	constructor(config) {
		this.config = config;
	}

	start() {
		console.log('start');
	}
}
