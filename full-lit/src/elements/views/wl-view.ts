import type { PropertyValueMap } from 'lit';
import type { Context } from '@/context';

import { html, css, LitElement } from 'lit';
import { provide } from '@lit/context';
import { customElement, eventOptions, query, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';

import { context } from '@/context';
import {
  getViewComponentPath,
  navigateToView,
  RouteViewComponentName,
  routes,
} from '@/routes';

@customElement('wl-view')
export class WlView extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  protected createRenderRoot() {
    return this;
  }

  @provide({ context })
  @state()
  context?: Context;

  @query('main') private _main!: HTMLElement;

  /**
   * Event handler for `context`
   * Store context in provider and session storage
   */
  @eventOptions({ passive: false })
  private _onContext(e: CustomEvent) {
    const context = e.detail;
    this.context = context;
    sessionStorage.setItem('context', JSON.stringify(context));
  }

  /**
   * Event handler for `view-update`
   * When a view updates, navigate to the new view
   */
  @eventOptions({ passive: true })
  private _onViewUpdate(e: CustomEvent) {
    const nav = () => {
      const { view, params } = e.detail || {};
      navigateToView(view, params);
    };
    if (!document.startViewTransition) return nav();
    document.startViewTransition(nav);
  }

  /**
   * Set routes once the component is first updated
   */
  firstUpdated(changedProperties: PropertyValueMap<unknown>) {
    super.firstUpdated(changedProperties);
    const router = new Router(this._main);
    const unmatchedRoute = {
      path: '(.*)',
      redirect: getViewComponentPath(
        this.context
          ? RouteViewComponentName.PaymentMethodSelection
          : RouteViewComponentName.Details,
      )!,
    };
    router.setRoutes([...routes, unmatchedRoute]).catch(console.error);
  }

  render() {
    return html`<main
      @context=${this._onContext}
      @view-update=${this._onViewUpdate}
    ></main>`;
  }
}
