import type { CSSResultArray } from 'lit';
import type { Constructor } from '@/types';

import { unsafeCSS, LitElement } from 'lit';
import style from '@/tailwind.css?inline';

const tailwindStyle = unsafeCSS(style);

/**
 * This mixin adds tailwind styles to the shadow root
 *
 * @example
 * ```ts
 * class MyElement extends TailwindMixin(LitElement) {
 *   // ...
 * }
 * ```
 */
export const TailwindMixin = <T extends Constructor<LitElement>>(
  superclass: T,
) => {
  class TailwindMixinClass extends superclass {
    static styles: CSSResultArray = [tailwindStyle];
  }
  return TailwindMixinClass;
};

export const TailwindElement = TailwindMixin(LitElement);
