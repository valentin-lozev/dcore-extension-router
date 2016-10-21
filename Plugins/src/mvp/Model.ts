﻿interface MVPModel {
    on(eventType: string, handler: (data?: any) => void, context?: Object): boolean;
    off(eventType: string, handler: (data?: any) => void, context?: Object): boolean;
    notify(type: string, data?: any): void;
    change(): void;
    destroy(): void;
}

namespace dcore.plugins.mvp {
    "use strict";

    export const ModelEvents = {
        Change: "change",
        Destroy: "destroy"
    };

    export function asModel<T>(target: T): T & MVPModel {
        if (typeof target !== "object" || target === null) {
            return null;
        }

        let model = new Model();
        for (let key in model) {
            target[key] = model[key];
        }

        return <T & MVPModel>target;
    }


    /**
     *  @class spaMVP.Model
     */
    export class Model implements MVPModel {
        private listeners: Object = {};

        /**
         *  Attaches an event handler to model raised events.
         *  @param {String} eventType The name of the event.
         *  @param {Function} handler The event's handler.
         *  @param {Object} [context] The Handler's context.
         */
        on(eventType: string, handler: (data?: any) => void, context?: Object): boolean {
            if (!eventType) {
                return false;
            }

            this.listeners[eventType] = this.listeners[eventType] || [];
            this.listeners[eventType].push({
                handler: handler,
                context: context
            });
            return true;
        }

        /**
         *  Detaches an event handler.
         *  @param {String} eventType The name of the event.
         *  @param {Function} handler The handler which must be detached.
         *  @param {Object} [context] The Handler's context.
         */
        off(eventType: string, handler: (data?: any) => void, context?: Object): boolean {
            let listeners = this.listeners[eventType] || [];
            for (let i = 0, len = listeners.length; i < len; i++) {
                let listener = listeners[i];
                if (listener.handler === handler &&
                    listener.context === context) {
                    listener = listeners[len - 1];
                    listeners.length--;
                    return true;
                }
            }

            return false;
        }

        /**
         *  Notifies the listeners attached for specific event.
         */
        notify(type: string, data?: any): void {
            if (!Array.isArray(this.listeners[type])) {
                return;
            }

            this.listeners[type]
                .slice(0)
                .forEach(listener => listener.handler.call(listener.context, data));
        }

        /**
         *  Notifies for change event.
         */
        change(): void {
            this.notify(ModelEvents.Change, this);
        }

        /**
         *  Notifies for destroy event.
         */
        destroy(): void {
            this.notify(ModelEvents.Destroy, this);
        }
    }
}