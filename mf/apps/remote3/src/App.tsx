import React from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { useHostStateBridge } from './useHostBridge'
import { getHostApi, getHostNavigate } from './hostBridge'
import './App.css'

const queryClient = new QueryClient()

function Remote3Content() {
  const { state, setState, ready } = useHostStateBridge()
  const [navigateReady, setNavigateReady] = React.useState(false)

  React.useEffect(() => {
    getHostNavigate()
      .then(() => setNavigateReady(true))
      .catch(() => setNavigateReady(false))
  }, [])

  const [api, setApi] = React.useState<Awaited<ReturnType<typeof getHostApi>> | null>(null)
  React.useEffect(() => {
    getHostApi().then(setApi).catch(() => setApi(null))
  }, [])
  const { data, isPending } = useQuery({
    queryKey: ['list'],
    queryFn: () => (api ? api.getList() : Promise.reject(new Error('API not ready'))),
    enabled: !!api,
  })

  const goToAbout = () => {
    getHostNavigate().then((navigate) => navigate('/about'))
  }

  return (
    <div className="remote3-app">
      <h1>Remote3（React）</h1>
      <p>通过 Module Federation 使用 Host 的状态桥、API、导航。</p>

      {ready && (
        <section className="demo-section">
          <h3>状态桥（与 Host Pinia 同步）</h3>
          <p>count: {state.count}，userName: {state.userName}</p>
          <button type="button" onClick={() => setState({ count: state.count + 1 })}>
            count +1
          </button>
          <button type="button" onClick={() => setState({ userName: 'Remote3 用户' })}>
            改 userName
          </button>
        </section>
      )}

      <section className="demo-section">
        <h3>React Query + Host API</h3>
        {isPending && <p>加载中…</p>}
        {data && <p>列表: {data.items.join(', ')}</p>}
      </section>

      {navigateReady && (
        <section className="demo-section">
          <h3>导航（Host Vue Router）</h3>
          <button type="button" onClick={goToAbout}>
            跳转 Host About
          </button>
        </section>
      )}

      <ul className="tech-list">
        <li>框架：React 18</li>
        <li>状态：Host 状态桥 ↔ Pinia</li>
        <li>数据：@tanstack/react-query + host/api</li>
        <li>导航：host/navigate</li>
      </ul>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Remote3Content />
    </QueryClientProvider>
  )
}
