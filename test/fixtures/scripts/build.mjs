import { parse } from 'node:url';

export const host = parse(process.argv[2]).host;
