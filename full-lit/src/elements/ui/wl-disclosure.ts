import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { TailwindElement } from '@/mixins';

@customElement('wl-disclosure')
export class WlDisclosure extends TailwindElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @state() private _openTransitionEnded = false;
  @query('div.grid') private _container!: HTMLDivElement;

  #onTransitionStart = () => {
    this._openTransitionEnded = false;
  };

  #onTransitionEnd = () => {
    if (!this.open) return;
    this._openTransitionEnded = true;
  };

  connectedCallback() {
    super.connectedCallback();
    setTimeout(() => {
      this._container.addEventListener(
        'transitionstart',
        this.#onTransitionStart,
      );
      this._container.addEventListener('transitionend', this.#onTransitionEnd);
    }, 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._container.removeEventListener(
      'transitionstart',
      this.#onTransitionStart,
    );
    this._container.removeEventListener('transitionend', this.#onTransitionEnd);
  }

  render() {
    return html`<div
      class="grid transition-all duration-300 ease-in-out ${this.open
        ? 'grid-rows-[1fr] opacity-100'
        : 'grid-rows-[0fr]'} opacity-0"
    >
      <div
        class="${classMap({ 'overflow-hidden': !this._openTransitionEnded })}"
      >
        <slot></slot>
      </div>
    </div>`;
  }
}
