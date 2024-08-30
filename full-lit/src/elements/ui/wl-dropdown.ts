import type { PropertyValues } from 'lit';

import { css, html, LitElement } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { twMerge } from 'tailwind-merge';
import {
  customElement,
  eventOptions,
  property,
  queryAssignedNodes,
  state,
} from 'lit/decorators.js';

import { TailwindElement } from '@/mixins';

export const DropdownPlacement = {
  Left: 'left',
  Right: 'right',
} as const;
export type DropdownPlacement =
  (typeof DropdownPlacement)[keyof typeof DropdownPlacement];

@customElement('wl-dropdown')
export class WlDropdown extends TailwindElement {
  #textLabel?: string;

  @state() private _isExpanded = false;
  @property({ type: String, attribute: false }) value = '';
  @property({ type: Boolean }) disabled = false;

  @queryAssignedNodes({ slot: '', flatten: true })
  private _assignedNodes?: Node[];

  @queryAssignedNodes({ slot: 'button-label', flatten: true })
  private _assignedNodesButtonLabel?: Node[];

  static styles = [
    ...TailwindElement.styles,
    css`
      .dropdown {
        position: relative;
        z-index: 1;
      }
      .dropdown__btn {
        position: relative;
        z-index: 2;
        color: inherit;
        width: fit-content;
      }

      .dropdown__menu {
        position: absolute;
        z-index: 1;
        inline-size: fit-content;
        overflow: hidden;
        list-style: none;
        user-select: none;
        background-color: white;
        border-radius: 5px;
        box-shadow:
          0 0 0 1px rgb(0 0 0 / 0.1),
          0 4px 8px rgb(0 0 0 / 0.1);

        .dropdown--placement-right & {
          inset-inline-end: 0;
        }

        @media (width >= 768px) {
          max-inline-size: 50vi;
        }
      }

      .dropdown__nav {
        position: relative;
        display: none;
        opacity: 0;
        transform: translateY(-10px);
        transition:
          opacity 0.25s,
          transform 0.25s,
          display 0.25s;
        transition-behavior: allow-discrete;
        transition-timing-function: cubic-bezier(0.645, 0.045, 0.355, 1);
      }

      .dropdown:focus-within .dropdown__nav {
        display: block;
        opacity: 1;
        transform: translateY(0);
      }

      @starting-style {
        .dropdown:focus-within .dropdown__nav {
          opacity: 0;
          transform: translateY(-10px);
        }
      }
    `,
  ];

  /**
   * Close menu when pressing the escape key
   */
  #onKeyDown(e: KeyboardEvent) {
    const isEscape = e.key === 'Escape';
    if (!(isEscape && document.activeElement instanceof HTMLElement)) return;
    document.activeElement.blur();
  }

  /**
   * Update isExpanded state when focus is inside the dropdown
   */
  #onFocusIn = () => (this._isExpanded = true);

  /**
   * Update isExpanded state when focus is outside the dropdown
   */
  #onFocusOut = () => (this._isExpanded = false);

  @eventOptions({ passive: true, capture: true })
  private _onChange(e: Event) {
    const option = e.target as WlDropdownOption;
    this.value = option.value;

    // update selected
    (this._assignedNodes || []).forEach((node) => {
      if (!(node instanceof WlDropdownOption)) return;
      node.selected = node.value === this.value;
    });

    // blur active element to close the nav
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  /**
   * Set selected option and value
   */
  @eventOptions({ passive: true, capture: true })
  private _onSlotChange() {
    const options = (this._assignedNodes || []).filter(
      (node): node is WlDropdownOption => node instanceof WlDropdownOption,
    );
    const selectedNode =
      options.find((option) => option.selected) ?? options[0];
    if (!selectedNode) return;
    selectedNode.selected = true;
    this.value = selectedNode.value;
  }

  #updateButtonLabel() {
    const node = this._assignedNodesButtonLabel?.[0];
    if (!(node && node.textContent && this.#textLabel)) return;
    node.textContent = this.#textLabel.replace('{{value}}', this.value);
  }

  @eventOptions({ passive: true, capture: true })
  private _onSlotChangeButtonLabel() {
    const node = this._assignedNodesButtonLabel?.[0];
    if (!(node && node.textContent)) return;
    this.#textLabel = node.textContent;
    this.#updateButtonLabel();
  }

  protected willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    if (!changedProperties.has('value')) return;
    this.#updateButtonLabel();
  }

  render() {
    return html`<div
      class="dropdown ${classMap({
        'text-gray-300': this.disabled,
        'pointer-events-none': this.disabled,
      })}"
      role="combobox"
      @change=${this._onChange}
      @keydown=${this.#onKeyDown}
      @focusin=${this.#onFocusIn}
      @focusout=${this.#onFocusOut}
    >
      <button
        type="button"
        class="dropdown__btn"
        aria-label="Menu button"
        aria-haspopup="menu"
        aria-expanded="${this._isExpanded ? 'true' : 'false'}"
        aria-controls="dropdown_menu"
      >
        <slot
          name="button-label"
          class="pointer-events-none"
          @slotchange=${this._onSlotChangeButtonLabel}
        >
          ${this.value}
        </slot>
      </button>
      <nav class="dropdown__nav" role="menu" id="dropdown_menu">
        <div class="dropdown__menu">
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
      </nav>
    </div>`;
  }
}

@customElement('wl-dropdown-option')
export class WlDropdownOption extends TailwindElement {
  static formAssociated = true;
  static shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ type: String, reflect: true }) value = '';
  @property({ type: Boolean, reflect: true }) selected = false;

  #dispatchValue() {
    this.dispatchEvent(
      new Event('change', { bubbles: true, composed: true, cancelable: false }),
    );
  }

  #onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Enter') return;
    this.#dispatchValue();
  }

  render() {
    return html`
      <button
        role="option"
        type="button"
        class=${twMerge(
          'text-gray-700 dropdown-menu-item w-full flex gap-2 min-w-[150px] -outline-offset-1 outline-indigo-500 whitespace-nowrap px-4 py-2',
          this.selected
            ? 'font-semibold cursor-default text-inherit'
            : 'bg-transparent hover:bg-gray-100 cursor-pointer',
        )}
        @click=${this.#dispatchValue}
        @keydown=${this.#onKeyDown}
        aria-selected="${this.selected ? 'true' : 'false'}"
      >
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
      </button>
    `;
  }
}
