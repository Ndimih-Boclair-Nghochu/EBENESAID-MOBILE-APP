import type { ReactNode } from 'react';
import { Text as NativeText, type TextProps } from 'react-native';

import { translateText, useLocale } from '@/src/lib/i18n';

function translateNode(node: ReactNode, locale: ReturnType<typeof useLocale>['locale']): ReactNode {
  if (typeof node === 'string') {
    return translateText(node, locale);
  }

  if (typeof node === 'number') {
    return node;
  }

  if (Array.isArray(node)) {
    const canJoin = node.every((item) => typeof item === 'string' || typeof item === 'number');

    if (canJoin) {
      return translateText(node.join(''), locale);
    }

    return node.map((item, index) => (
      <TextFragment key={index}>{translateNode(item, locale)}</TextFragment>
    ));
  }

  return node;
}

function TextFragment({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Text({ children, ...props }: TextProps) {
  const { locale } = useLocale();

  return <NativeText {...props}>{translateNode(children, locale)}</NativeText>;
}
