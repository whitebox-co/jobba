import * as Koa from 'koa';

export enum Method {
	All = 'ALL',
	Del = 'DEL',
	Delete = 'DELETE',
	Get = 'GET',
	Patch = 'PATCH',
	Post = 'POST',
	Put = 'PUT',
}

export type Handler = (ctx: Koa.Context, next?: () => void) => any;

export interface Route {
	path: string;
	method: Method;
	description?: string;
	handler: Handler;
}
