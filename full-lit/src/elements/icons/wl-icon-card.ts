import { customElement } from 'lit/decorators.js';
import { css, html } from 'lit';
import { TailwindElement } from '@/mixins';

@customElement('wl-icon-card')
export class WlIconCard extends TailwindElement {
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
        xmlns="http://www.w3.org/2000/svg"
        class="w-full h-full"
        viewBox="0 -960 960 960"
      >
        <path
          fill="currentColor"
          d="M880-720v480q0 33-23.5 56.5T800-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720Zm-720 80h640v-80H160v80Zm0 160v240h640v-240H160Zm0 240v-480 480Z"
        />
      </svg>
    `;
  }
}
