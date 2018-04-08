#!/usr/bin/env node

import Server from '../lib/server';
import routes from '../src/routes';

const server = new Server(routes);

server.start();
