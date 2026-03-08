/**
 * 子应用入口 URL（开发时各子应用独立端口，生产可改为同源路径）
 */
const dev = import.meta.env.DEV
export const REMOTE1_BASE = dev ? 'http://localhost:4001' : '/remote1'
export const REMOTE2_BASE = dev ? 'http://localhost:4002' : '/remote2'
export const REMOTE3_BASE = dev ? 'http://localhost:4003' : '/remote3'
