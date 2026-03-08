<script setup lang="ts">
/**
 * 全局弹窗：由主应用挂载在 document 层，可覆盖整个页面（含 iframe）。
 * 子应用通过 bus.$emit('global:openModal', payload) 打开；
 * 子应用可传入 styleOptions 定制样式，由主应用在渲染时应用（主应用控制允许的 class/theme/样式键，避免随意注入）。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { bus } from '@/bus'

/** 子应用可传入的样式配置（主应用做白名单/安全过滤后应用） */
export interface GlobalModalStyleOptions {
  /** 额外 class，主应用仅接受约定前缀（如 sub-modal-）避免样式冲突 */
  className?: string
  /** 内置主题：default | dark */
  theme?: 'default' | 'dark'
  /** 弹窗宽度，如 '520px'、'90vw' */
  width?: string
  /** 允许的内联样式（主应用只应用白名单 key） */
  style?: Record<string, string>
}

export interface GlobalModalPayload {
  title: string
  content: string
  /** 子应用对弹窗的样式修改，由主应用合并到弹窗容器 */
  styleOptions?: GlobalModalStyleOptions
}

const ALLOWED_STYLE_KEYS = ['maxWidth', 'width', 'borderRadius', 'borderTop'] as const

function filterStyle(style?: Record<string, string>) {
  if (!style || typeof style !== 'object') return {}
  const out: Record<string, string> = {}
  for (const key of ALLOWED_STYLE_KEYS) {
    const v = style[key]
    if (typeof v === 'string') out[key] = v
  }
  return out
}

/** 只接受 sub-modal- 前缀的 class，防止子应用写全局冲突类名 */
function filterClassName(className?: string) {
  if (!className || typeof className !== 'string') return ''
  return className
    .split(/\s+/)
    .filter((c) => c.startsWith('sub-modal-'))
    .join(' ')
}

const visible = ref(false)
const payload = ref<GlobalModalPayload | null>(null)

const boxClass = computed(() => {
  const p = payload.value
  if (!p?.styleOptions) return 'global-modal-box'
  const { theme, className } = p.styleOptions
  const parts = ['global-modal-box']
  if (theme === 'dark') parts.push('global-modal-box--dark')
  const filtered = filterClassName(className)
  if (filtered) parts.push(filtered)
  return parts.join(' ')
})

const boxStyle = computed(() => {
  const p = payload.value
  if (!p?.styleOptions) return undefined
  const { width, style } = p.styleOptions
  const base: Record<string, string> = {}
  if (width) base.width = width
  Object.assign(base, filterStyle(style))
  return Object.keys(base).length ? base : undefined
})

function open(p: GlobalModalPayload) {
  payload.value = p
  visible.value = true
}

function close() {
  visible.value = false
  payload.value = null
}

function onOpen(p: GlobalModalPayload) {
  open(p)
}

function onClose() {
  close()
}

onMounted(() => {
  bus.$on('global:openModal', onOpen)
  bus.$on('global:closeModal', onClose)
})

onUnmounted(() => {
  bus.$off('global:openModal', onOpen)
  bus.$off('global:closeModal', onClose)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="global-modal-mask" role="dialog" aria-modal="true" :aria-label="payload?.title">
      <div :class="boxClass" :style="boxStyle">
        <div class="global-modal-header">
          <h3 class="global-modal-title">{{ payload?.title }}</h3>
          <button type="button" class="global-modal-close" aria-label="关闭" @click="close">×</button>
        </div>
        <div class="global-modal-body">
          {{ payload?.content }}
        </div>
        <div class="global-modal-footer">
          <button type="button" class="global-modal-btn" @click="close">确定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.global-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.global-modal-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 320px;
  max-width: 480px;
}
/* 子应用通过 styleOptions.theme: 'dark' 使用 */
.global-modal-box--dark {
  background: #1e293b;
  color: #e2e8f0;
}
.global-modal-box--dark .global-modal-header {
  border-bottom-color: #334155;
}
.global-modal-box--dark .global-modal-title {
  color: #f1f5f9;
}
.global-modal-box--dark .global-modal-close {
  color: #94a3b8;
}
.global-modal-box--dark .global-modal-close:hover {
  color: #fff;
}
.global-modal-box--dark .global-modal-body {
  color: #cbd5e1;
}
.global-modal-box--dark .global-modal-footer {
  border-top-color: #334155;
}
.global-modal-box--dark .global-modal-btn {
  background: #475569;
}
.global-modal-box--dark .global-modal-btn:hover {
  background: #64748b;
}
/* 子应用通过 styleOptions.className: 'sub-modal-remote1' 使用（主应用预置或子应用约定） */
.global-modal-box.sub-modal-remote1 .global-modal-header {
  background: #ecfdf5;
  border-bottom-color: #a7f3d0;
}
.global-modal-box.sub-modal-remote1 .global-modal-title {
  color: #047857;
}
.global-modal-box.sub-modal-remote2 .global-modal-header {
  background: #eff6ff;
  border-bottom-color: #bfdbfe;
}
.global-modal-box.sub-modal-remote2 .global-modal-title {
  color: #1d4ed8;
}
.global-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #eee;
}
.global-modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}
.global-modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #666;
  padding: 0 0.25rem;
}
.global-modal-close:hover {
  color: #000;
}
.global-modal-body {
  padding: 1.25rem;
  line-height: 1.6;
}
.global-modal-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #eee;
  text-align: right;
}
.global-modal-btn {
  padding: 0.4rem 1rem;
  cursor: pointer;
  background: #42b883;
  color: #fff;
  border: none;
  border-radius: 6px;
}
.global-modal-btn:hover {
  background: #359268;
}
</style>
