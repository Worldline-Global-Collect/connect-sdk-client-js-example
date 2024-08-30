import { customElement } from 'lit/decorators.js';
import { css, html } from 'lit';
import { TailwindElement } from '@/mixins';

@customElement('wl-icon-calendar')
export class WlIconCalendar extends TailwindElement {
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
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="currentColor"
          d="M9 44q-1.2 0-2.1-.9Q6 42.2 6 41V10q0-1.2.9-2.1Q7.8 7 9 7h3.25V4h3.25v3h17V4h3.25v3H39q1.2 0 2.1.9.9.9.9 2.1v31q0 1.2-.9 2.1-.9.9-2.1.9Zm0-3h30V19.5H9V41Z"
        />
      </svg>
    `;
  }
}
