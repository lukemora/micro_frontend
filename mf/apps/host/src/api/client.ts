/**
 * 与框架无关的 API 客户端：供任意子应用（Vue/React）通过 MF 使用。
 * 使用 fetch，避免在共享模块中强依赖 axios；Vue 侧仍可在自己的代码里单独用 axios。
 */

const BASE = typeof window !== 'undefined' ? '' : ''

export interface User {
  id: number
  name: string
}

export async function getUser(id: number): Promise<User> {
  const res = await fetch(`${BASE}/api/users/${id}`).then((r) =>
    r.ok ? r.json() : Promise.reject(new Error('fetch failed'))
  )
  return res as User
}

/** 示例：列表接口，可替换为真实后端 */
export async function getList(): Promise<{ items: string[] }> {
  return { items: ['A', 'B', 'C'] }
}
