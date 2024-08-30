import { Router } from '@vaadin/router';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { TailwindElement } from '@/mixins';

@customElement('wl-link')
export class WlLink extends TailwindElement {
  @property({ type: String, reflect: true }) href = '';
  @property({ type: String, reflect: false, attribute: 'class-anchor' }) class =
    '';

  static styles = [
    ...TailwindElement.styles,
    css`
      :host {
        display: inline-flex;
      }
    `,
  ];

  #onClick(e: MouseEvent) {
    e.preventDefault();
    const href = (e.currentTarget as HTMLAnchorElement).href;
    if (!document.startViewTransition) return Router.go(href);
    document.startViewTransition(() => {
      Router.go(href);
    });
  }

  render() {
    return html`
      <a href="${this.href}" @click=${this.#onClick} class="${this.class}">
        <slot></slot>
      </a>
    `;
  }
}
