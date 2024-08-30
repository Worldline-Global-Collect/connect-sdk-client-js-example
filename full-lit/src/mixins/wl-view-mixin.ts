import type { Constructor } from '@/types';

import { LitElement, type PropertyValues } from 'lit';

import { SessionController } from '@/controllers';
import { RouteViewComponentName } from '@/routes';

/**
 * This mixin is used to redirect to `wl-view-details`
 * when session is not set
 */
export const WlViewMixin = <T extends Constructor<LitElement>>(
  superClass: T,
) => {
  class ContextViewClass extends superClass {
    protected sessionController = new SessionController(this);

    protected createRenderRoot() {
      return this;
    }

    firstUpdated(changedProperties: PropertyValues) {
      super.firstUpdated(changedProperties);
      setTimeout(this.afterContextProviderReady.bind(this), 0);
    }

    /**
     * Custom lifecycle
     * This method is called after the first update is rendered
     * which allows consuming data from the context provider
     */
    protected afterContextProviderReady() {}

    /**
     * Lifecycle provided by @vaadin/router
     * and runs after the page enters the screen
     * (route is successfully resolved)
     *
     * Will redirect to `wl-view-details` if session is not set
     */
    onAfterEnter() {
      if (this.sessionController.context) return;

      const viewUpdateEvent = new CustomEvent('view-update', {
        bubbles: true,
        composed: true,
        detail: { view: RouteViewComponentName.Details },
      });
      this.dispatchEvent(viewUpdateEvent);
    }
  }

  return ContextViewClass;
};
