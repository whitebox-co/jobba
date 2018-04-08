#!/usr/bin/env node

import Server from '../lib/server';
import routes from '../src/routes';
import tasks from '../src/tasks';

const server = new Server(routes, tasks);

server.start();
