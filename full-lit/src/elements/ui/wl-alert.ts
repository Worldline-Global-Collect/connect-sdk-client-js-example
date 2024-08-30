import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { TailwindElement } from '@/mixins';

export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
} as const;
export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];

const severityClasses = new Map([
  [AlertSeverity.INFO, 'bg-blue-50 text-blue-800'],
  [AlertSeverity.WARNING, 'bg-yellow-100 text-yellow-600'],
  [AlertSeverity.ERROR, 'bg-red-100 text-red-600'],
]) satisfies Map<AlertSeverity, string>;

@customElement('wl-alert')
export class WlAlert extends TailwindElement {
  static styles = [
    ...TailwindElement.styles,
    css`
      :host {
        display: block;
      }
    `,
  ];
  @property({ type: String, reflect: true }) severity = AlertSeverity.INFO;

  render() {
    const severityClass = severityClasses.get(this.severity);
    return html`<div class="p-4 text-pretty ${severityClass}">
      <slot></slot>
    </div>`;
  }
}
