import { customElement } from 'lit/decorators.js';
import { css, html } from 'lit';
import { TailwindElement } from '@/mixins';

@customElement('wl-icon-check')
export class WlIconCheck extends TailwindElement {
  static styles = [
    ...TailwindElement.styles,
    css`
      :host {
        display: inline-block;
      }
    `,
  ];

  render() {
    return html`
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        class="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="currentColor"
          d="M9.55 18.2 3.65 12.3 5.275 10.675 9.55 14.95 18.725 5.775 20.35 7.4Z"
        />
      </svg>
    `;
  }
}
