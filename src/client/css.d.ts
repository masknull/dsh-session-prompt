/** 构建期把 .css 作为文本内联的产物类型声明。 */
declare module '*.css' {
  const text: string
  export default text
}