import { customElement } from 'lit/decorators.js';
import { css, html } from 'lit';
import { TailwindElement } from '@/mixins';

@customElement('wl-icon-user')
export class WlIconUser extends TailwindElement {
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
        class="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M0 0h24v24H0z" fill="none" />
        <path
          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
        />
      </svg>
    `;
  }
}
