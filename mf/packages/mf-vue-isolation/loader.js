/**
 * 仅对带 ?mf 的 Vue 文件生效（由 ModuleFederationComponentPlugin 为 expose 的组件打标）。
 * 将 template 根节点和 render 根节点包裹在 <section class="wrapperClassName"> 中，
 * 便于宿主通过 .wrapperClassName 做 CSS 隔离或命名空间。
 */
export default function (source) {
  const wrapperClassName = this.getOptions()?.wrapperClassName || 'mf-container'

  let processedSource = source

  processedSource = processedSource.replace(
    /(<template[^>]*>)([\s\S]*?)(<\/template>)/,
    (_match, startTag, templateContent, endTag) =>
      `${startTag}\n  <section class="${wrapperClassName}">\n    ${templateContent.trim()}\n  </section>\n${endTag}`
  )

  processedSource = processedSource.replace(
    /(render\s*\(\s*h\s*\)\s*\{[\s\S]*?return\s+h\()([^)]+)(\)[\s\S]*?\})/g,
    (_match, beforeReturn, hCall, afterReturn) =>
      `${beforeReturn}h('section', { class: '${wrapperClassName}' }, [${hCall}])${afterReturn}`
  )

  processedSource = processedSource.replace(
    /(return\s*\(\s*\)\s*=>\s*h\()([^)]+)(\))/g,
    (_match, beforeH, hCall, afterH) =>
      `${beforeH}h('section', { class: '${wrapperClassName}' }, [${hCall}])${afterH}`
  )

  return processedSource
}
