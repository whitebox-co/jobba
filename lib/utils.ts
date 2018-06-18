import * as Koa from 'koa';

export enum Method {
	All = 'all',
	Del = 'del',
	Delete = 'delete',
	Get = 'get',
	Patch = 'patch',
	Post = 'post',
	Put = 'put',
}

export interface Route {
	path: string;
	method: Method;
	handler: (ctx: Koa.Context, next?: () => void) => any;
}
