import './App.css'
import { useHostStore } from './hooks/useHostStore'
import { useGlobalModal } from './hooks/useGlobalModal'

export default function App() {
  const { count, userName, ready, increment, setUserName } = useHostStore()
  const { openModal } = useGlobalModal()

  return (
    <div className="remote3-app">
      <h1>Remote3（React）- Wujie 子应用</h1>
      <p>通过 Wujie 以 URL 加载的 React 子应用，运行在 iframe 中。下方使用 Host Pinia（通过 bus）并可打开全局弹窗。</p>
      <ul className="tech-list">
        <li>框架：React 18</li>
        <li>构建：Vite</li>
        <li>与 MF 对比：无远程模块共享，子应用为独立整页</li>
      </ul>

      {ready && (
        <section className="demo-section">
          <h3>Host Pinia（通过 bus 同步）</h3>
          <p>count: {count}，userName: {userName}</p>
          <button type="button" onClick={increment}>
            count +1
          </button>
          <button type="button" onClick={() => setUserName('Remote3 改名的用户')}>
            改 userName
          </button>
        </section>
      )}

      <section className="demo-section">
        <h3>全局弹窗（可传 styleOptions）</h3>
        <button type="button" onClick={() => openModal('来自 Remote3 (React)', '默认样式。')}>
          默认弹窗
        </button>
        <button
          type="button"
          onClick={() =>
            openModal('Remote3 深色 + 宽度', 'theme: dark, width: 400px。', {
              theme: 'dark',
              width: '400px',
            })
          }
        >
          深色窄弹窗
        </button>
      </section>
    </div>
  )
}
