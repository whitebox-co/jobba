# Jobba

Jobba the Hub, a job scheduler and runner.

## Description

[Jobba](https://github.com/whitebox-co/jobba) is a wrapper around [Bull](https://github.com/OptimalBits/bull), which makes it a lot easier to work with (at least for our uses).
It is written in [TypeScript](https://typescriptlang.org/) and used internally by [Whitebox](https://whitebox.co/).
It has an exposed HTTP API built upon [Yawk](https://github.com/rosshadden/yawk), a great HTTP router and server.
It also serves a simple management interface, ([our fork](https://github.com/whitebox-co/arena) of) [Arena](https://github.com/bee-queue/arena).

### Terminology

- `Jobba`: The job hub itself, which is what you register and schedule `Task`s with.
	- `Jobba#register` returns a `Task`.
- `Task`: Handlers that you register, which can be scheduled to run (creating a `Job`).
	- `Task#schedule` schedules the run of a `Task`.
	- Upon run, a `Job` is created and passed to the `Task`'s handler.
- `Job`: A scheduled `Task`, which can be a one-off run of its handler or a recurring run.

## Usage

### Setup

```typescript
import Jobba, { Job, JobbaConfig } from 'jobba';

const config: JobbaConfig = {
	yawk: {
		port: 5000
	}
};

function registrar(jobba: Jobba) {
	jobba.register({
		id: 'some-task',
		handler: async (job: Job) => {
			await job.log('The params passed to this job:', job.params);
			return 'some response';
		}
	});
}

const jobba = new Jobba(config, registrar);
jobba.start();
```

> NOTE: The `Job` and `JobbaConfig` type annotations are not needed, but are shown for clarity.

There are three ways to interact with Jobba:

1. the Node.js module
2. the HTTP API
3. the front-end

### Module

```typescript
// one-off run
jobba.schedule('some-task', { some: 'params' });

// recurring run
jobba.schedule('some-task', { some: 'params' }, {
	repeat: { cron: '0 * * * *' }
});
```

### HTTP API

The API is served at `/api`.
`GET /api/routes` returns a list of endpoints and in some cases their descriptions or expected input and output schemas.

The most important endpoint is `POST /api/tasks/${taskId}/schedule`, which supports passing optional `params` and `options` like in this example:

```json
{
	"options": {
		"repeat": {
			"cron": "0 * * * *"
		}
	},
	"params": {
		"some": "params"
	}
}
```

### Front-end

The front-end is served at `/`.
In its current state it is quite simplistic, and is mostly read-only for now.
You cannot yet schedule tasks, though you can see details about completed/failed tasks as well as cancel scheduled ones.


## Features

### Returns

Tasks do not need to return anything.
Their return values are indeed reflected in the front-end, but in practice most of our tasks don't return anything.

### Errors

Any errors thrown are captured and reflected in the front-end as well, with their error message and stack trace.

```typescript
jobba.register({
	id: 'some-task',
	handler: (job: Job) => {
		throw new Error('uh oh...');
	}
});
```

### Logging

Logs are recorded with their log level, a timestamp, and their contents.

```typescript
jobba.register({
	id: 'some-task',
	handler: async (job: Job) => {
		await job.log('Logging can be convenient.');
		await job.info('Logging can be informative.');
		await job.debug('Logging can be introspective.');
		await job.warn('Logging can be dangerous.');
		await job.error('Logging can be unfortunate.');

		await job.log('logs', 'support', 'infinite', 'arguments');
		await job.log('logs', 'support', [ 'various' ], { types: true });
	}
});
```

### Misc

```typescript
jobba.register({
	id: 'some-task',
	handler: async (job: Job) => {
		// you can set progress
		await job.progress(40)
	}
});
```
