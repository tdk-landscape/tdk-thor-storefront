import { expect, test } from 'bun:test';
import { preflight } from './thor-preflight';
test('offline report does not validate missing URL and propagates preview exit',()=>{const calls:any[]=[];const spawn=((args:any,opts:any)=>{calls.push([args,opts]);return {exitCode:7};}) as typeof Bun.spawnSync;expect(preflight(['--dry-run'],{},spawn)).toBe(7);expect(calls[0][0]).toEqual(['tdk','up','store','--dry-run']);expect(calls[0][1].env).toEqual({});});
test('ordinary preflight with a missing URL cannot invoke TDK',()=>{let invoked=false;const spawn=(()=>{invoked=true;return {exitCode:0};}) as typeof Bun.spawnSync;expect(preflight([],{},spawn)).toBe(1);expect(invoked).toBe(false);});
test('successful preview remains report-only with missing config',()=>{const spawn=(()=>({exitCode:0})) as typeof Bun.spawnSync;expect(preflight(['--dry-run'],{},spawn)).toBe(0);});
