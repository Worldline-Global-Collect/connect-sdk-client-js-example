import type { PropertyValues } from 'lit';
import type { Coords, Placement } from '@floating-ui/dom';

import { customElement, property } from 'lit/decorators.js';
import { css, html } from 'lit';
import {
  computePosition,
  flip,
  shift,
  offset,
  arrow,
  autoUpdate,
  size,
} from '@floating-ui/dom';

import { TailwindElement } from '@/mixins';

type EventMap = Array<[keyof HTMLElementEventMap, (e: Event) => void]>;

let idx = 0;

@customElement('wl-info-tooltip')
export class WlInfoTooltip extends TailwindElement {
  static styles = [
    ...TailwindElement.styles,
    css`
      [role='tooltip'] {
        transition:
          opacity 0.2s,
          scale 0.2s,
          display 0.2s;
        transition-behavior: allow-discrete;
        transition-timing-function: cubic-bezier(0.645, 0.045, 0.355, 1);

        display: none;
        opacity: 0;
        scale: 0.95;
        background-color: #222;
        border-radius: 10px;
        padding: 1rem;
        color: #fff;
        font-size: 90%;

        /* Float on top of the UI */
        position: absolute;
        z-index: 10;

        /* Avoid layout interference */
        width: max-content;
        top: 0;
        left: 0;
      }
      @media (prefers-reduced-motion) {
        [role='tooltip'] {
          transition: none;
        }
      }
      [role='tooltip'].tooltip--visible {
        display: block;
        opacity: 1;
        scale: 1;
      }
      @starting-style {
        [role='tooltip'].tooltip--visible {
          opacity: 0;
          scale: 0.95;
        }
      }
      [data-tooltip-arrow] {
        position: absolute;
        background-color: inherit;
        width: 8px;
        height: 8px;
        rotate: 45deg;
      }
    `,
  ];

  @property({ type: String }) label = 'More info';
  @property({ type: String, reflect: true }) placement: Placement = 'bottom';
  @property({ type: String, reflect: true }) trigger: 'hover' | 'focus' =
    'focus';

  #id = ++idx;
  #tooltipId = `tooltip-${this.#id}`;
  #tooltipArrowId = `tooltip-arrow-${this.#id}`;
  #buttonId = `button-${this.#id}`;

  #button!: HTMLButtonElement;
  #tooltip!: HTMLDivElement;
  #tooltipArrow!: HTMLDivElement;

  #queryById<T extends Element>(id: string) {
    return this.renderRoot.querySelector<T>(`#${id}`)!;
  }

  #detachListeners() {
    const eventMap: Array<[keyof HTMLElementEventMap, (e: Event) => void]> = [
      ['mouseenter', this.show],
      ['mouseleave', this.hide],
      ['focus', this.show],
      ['blur', this.hide],
      ['click', this.#focus],
    ];
    eventMap.forEach(([event, fn]) =>
      this.#button.removeEventListener(event, fn),
    );
  }

  #attachListeners() {
    const eventMap: EventMap = [
      ['click', this.#focus],
      ['focus', this.show],
      ['blur', this.hide],
      ...(this.trigger === 'hover'
        ? ([
            ['mouseenter', this.show],
            ['mouseleave', this.hide],
          ] as EventMap)
        : []),
    ];
    eventMap.forEach(([event, fn]) => this.#button.addEventListener(event, fn));
  }

  /**
   * assign queried elements and update first position
   * when the component is updated for the first time
   */
  protected firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this.#button = this.#queryById(this.#buttonId);
    this.#tooltip = this.#queryById(this.#tooltipId);
    this.#tooltipArrow = this.#queryById(this.#tooltipArrowId);
    this.#update();
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (!changedProperties.has('trigger')) return;
    this.#detachListeners();
    this.#attachListeners();
  }

  #cleanup?: ReturnType<typeof autoUpdate>;

  #focus = () => {
    this.#button.focus();
  };

  show = () => {
    this.#tooltip.classList.add('tooltip--visible');
    this.#cleanup = autoUpdate(this.#button, this.#tooltip, this.#update);
  };

  hide = () => {
    this.#tooltip.classList.remove('tooltip--visible');
    this.#cleanup?.();
  };

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#detachListeners();
  }

  #update = () => {
    const buttonRadius = this.#button.getBoundingClientRect().width;
    computePosition(this.#button, this.#tooltip, {
      placement: this.placement,
      middleware: [
        offset(8),
        flip(),
        shift({ padding: 5 }),
        arrow({ element: this.#tooltipArrow, padding: 12 }),
        size({
          apply({ availableHeight, availableWidth, elements, placement }) {
            const referenceBoundingClientRect =
              elements.reference.getBoundingClientRect();

            const floatBoundingClientRect =
              elements.floating.getBoundingClientRect();

            const staticSide = {
              top: 'bottom',
              right: 'left',
              bottom: 'top',
              left: 'right',
            }[placement.split('-')[0]] as string;

            const offsetX = ['left', 'right'].includes(staticSide)
              ? staticSide
              : `${
                  (floatBoundingClientRect.x > referenceBoundingClientRect.x
                    ? floatBoundingClientRect.x - referenceBoundingClientRect.x
                    : referenceBoundingClientRect.x -
                      floatBoundingClientRect.x) +
                  buttonRadius / 2
                }px`;

            const offsetY = ['top', 'bottom'].includes(staticSide)
              ? staticSide
              : `${
                  (floatBoundingClientRect.y > referenceBoundingClientRect.y
                    ? floatBoundingClientRect.y - referenceBoundingClientRect.y
                    : referenceBoundingClientRect.y -
                      floatBoundingClientRect.y) +
                  buttonRadius / 2
                }px`;

            Object.assign(elements.floating.style, {
              maxWidth: `${availableWidth - 12}px`,
              maxHeight: `${availableHeight}px`,
              transformOrigin: `${offsetX} ${offsetY}`,
            });
          },
        }),
      ],
    }).then(({ x, y, placement, middlewareData }) => {
      Object.assign(this.#tooltip.style, { left: `${x}px`, top: `${y}px` });

      const { x: arrowX, y: arrowY } = middlewareData.arrow as Coords;
      const staticSide = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      }[placement.split('-')[0]] as string;

      Object.assign(this.#tooltipArrow.style, {
        left: Number.isNaN(arrowX) ? '' : `${arrowX}px`,
        top: Number.isNaN(arrowY) ? '' : `${arrowY}px`,
        right: '',
        bottom: '',
        [staticSide]: '-4px',
      });
    });
  };

  render() {
    return html`
      <button
        type="button"
        aria-describedby="${this.#tooltipId}"
        id="${this.#buttonId}"
        title="${this.label}"
        class="rounded-full text-gray-500 hover:bg-gray-500 hover:text-white focus-visible:ring-2 focus-visible:outline-0 focus-visible:ring-current focus-visible:bg-gray-500 focus-visible:text-white"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6"
        >
          <path
            d="M10.9 17.1H13.1V11H10.9ZM12 9.125Q12.475 9.125 12.8 8.8Q13.125 8.475 13.125 8Q13.125 7.525 12.8 7.2Q12.475 6.875 12 6.875Q11.525 6.875 11.2 7.2Q10.875 7.525 10.875 8Q10.875 8.475 11.2 8.8Q11.525 9.125 12 9.125ZM12 22.2Q9.875 22.2 8.012 21.4Q6.15 20.6 4.775 19.225Q3.4 17.85 2.6 15.988Q1.8 14.125 1.8 12Q1.8 9.875 2.6 8.012Q3.4 6.15 4.775 4.775Q6.15 3.4 8.012 2.6Q9.875 1.8 12 1.8Q14.125 1.8 15.988 2.6Q17.85 3.4 19.225 4.775Q20.6 6.15 21.4 8.012Q22.2 9.875 22.2 12Q22.2 14.125 21.4 15.988Q20.6 17.85 19.225 19.225Q17.85 20.6 15.988 21.4Q14.125 22.2 12 22.2ZM12 12Q12 12 12 12Q12 12 12 12Q12 12 12 12Q12 12 12 12Q12 12 12 12Q12 12 12 12Q12 12 12 12Q12 12 12 12ZM12 19.925Q15.3 19.925 17.613 17.613Q19.925 15.3 19.925 12Q19.925 8.7 17.613 6.387Q15.3 4.075 12 4.075Q8.7 4.075 6.388 6.387Q4.075 8.7 4.075 12Q4.075 15.3 6.388 17.613Q8.7 19.925 12 19.925Z"
          />
        </svg>
        <span class="sr-only">${this.label}</span>
      </button>

      <div id="${this.#tooltipId}" role="tooltip" title="${this.label}">
        <div class="max-w-[48ch]">
          <slot></slot>
        </div>
        <div data-tooltip-arrow id="${this.#tooltipArrowId}"></div>
      </div>
    `;
  }
}
