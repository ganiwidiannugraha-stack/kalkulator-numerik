import React from 'react';
import katex from 'katex';

export function LatexBlock({ tex, block = false }: { tex: string, block?: boolean }) {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: block,
        throwOnError: false,
        strict: false
      });
    } catch (e) {
      return tex; // Fallback
    }
  }, [tex, block]);

  return (
    <span 
      dangerouslySetInnerHTML={{ __html: html }} 
      className={block ? 'my-4 text-center block overflow-x-auto overflow-y-hidden' : ''}
    />
  );
}
