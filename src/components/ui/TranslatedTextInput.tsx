import { TextInput as NativeTextInput, type TextInputProps } from 'react-native';

import { translateText, useLocale } from '@/src/lib/i18n';

export function TextInput({ placeholder, ...props }: TextInputProps) {
  const { locale } = useLocale();
  const translatedPlaceholder =
    typeof placeholder === 'string' ? translateText(placeholder, locale) : placeholder;

  return <NativeTextInput {...props} placeholder={translatedPlaceholder} />;
}
