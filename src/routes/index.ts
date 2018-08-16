import Yawk from 'yawk';
import taskRoutes from './tasks';

export default function(yawk: Yawk) {
	yawk.register({
		path: '/',
		description: 'Status check.',
		handler: (ctx) => true,
	});

	taskRoutes(yawk);
}
