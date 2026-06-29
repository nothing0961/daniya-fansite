/**
 * MDX 全局组件映射
 * 在 .mdx 文件中可以直接使用这些组件而无需 import
 * 例如在 MDX 中写 <Callout type="info">提示内容</Callout>
 */
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // 自定义 MDX 组件映射
    // 后续添加: Callout, CodeBlock, CustomImage 等
    ...components,
  };
}
