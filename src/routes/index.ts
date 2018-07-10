import Server from 'yawk';
import taskRoutes from './tasks';

export default function(server: Server) {
	server.register({
		path: '/',
		description: 'Status check.',
		handler: (ctx) => true,
	});

	taskRoutes(server);
}
