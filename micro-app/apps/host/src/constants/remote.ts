/**
 * 子应用入口 URL（开发时各子应用独立端口，生产可改为同源路径）
 * micro-app 的 url 必须指向子应用的 index.html
 */
const dev = import.meta.env.DEV
export const REMOTE1_BASE = dev ? 'http://localhost:5001' : '/remote1'
export const REMOTE2_BASE = dev ? 'http://localhost:5002' : '/remote2'
export const REMOTE3_BASE = dev ? 'http://localhost:5003' : '/remote3'
