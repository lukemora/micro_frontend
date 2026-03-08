import './App.css'
import { useHostStore } from './hooks/useHostStore'

export default function App() {
  const { count, userName, ready, increment, setUserName } = useHostStore()

  return (
    <div className="remote3-app">
      <h1>Remote3（React）- Micro-App 子应用</h1>
      <p>通过 Micro-App 以 URL 加载的 React 子应用。下方使用 Host 的 Pinia（通过 setData/addDataListener 同步）。</p>
      <ul className="tech-list">
        <li>框架：React 18</li>
        <li>构建：Vite</li>
        <li>与 MF 对比：无远程模块共享，子应用为独立整页 HTML 注入</li>
      </ul>

      {ready && (
        <section className="demo-section">
          <h3>Host Pinia（通过 setData 同步，子应用 dispatch host:action 读写）</h3>
          <p>count: {count}，userName: {userName}</p>
          <button type="button" onClick={increment}>
            count +1
          </button>
          <button type="button" onClick={() => setUserName('Remote3 改名的用户')}>
            改 userName
          </button>
        </section>
      )}
    </div>
  )
}
