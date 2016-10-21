interface MVPModel {
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
interface MVPEquatable<T> {
    equals(other: T): boolean;
    hash(): number;
}

namespace dcore.plugins.mvp {
    "use strict";

    /**
     *  Creates a collection of unique items.
     *  @class spaMVP.HashSet
     *  @property {Number} size  
     */
    export class HashSet<T extends MVPEquatable<T>> {
        private items: Object = {};
        public size: number = 0;

        /**
         *  Determines whether an item is in the set.
         *  @returns {Boolean}
         */
        contains(item: T): boolean {
            let hashCode = item.hash();
            if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                return false;
            }

            let hashedItems = this.items[hashCode];
            if (!Array.isArray(hashedItems)) {
                return hashedItems.equals(item);
            }

            for (let i = 0, len = hashedItems.length; i < len; i++) {
                if (hashedItems[i].equals(item)) {
                    return true;
                }
            }

            return false;
        }

        /**
         *  Adds a new item to the set.
         *  @returns {Boolean}
         */
        add(item: T): boolean {
            if (item === null ||
                typeof item === "undefined" ||
                this.contains(item)) {
                return false;
            }

            let hashCode = item.hash();

            // the first item with this hash
            if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                this.items[hashCode] = item;
            } else if (!Array.isArray(this.items[hashCode])) {
                // the second item with this hash
                this.items[hashCode] = [this.items[hashCode], item];
            } else {
                // there are already two or more items with this hash
                this.items[hashCode].push(item);
            }

            this.size++;
            return true;
        }

        /**
         *  Removes an item from the set.
         *  @returns {Boolean}
         */
        remove(item: T): boolean {
            if (!this.contains(item)) {
                return false;
            }

            let hashCode = item.hash();

            if (Array.isArray(this.items[hashCode])) {
                let hashCodeItems = this.items[hashCode];
                for (let i = 0, len = hashCodeItems.length; i < len; i++) {
                    if (hashCodeItems[i].equals(item)) {
                        hashCodeItems[i] = hashCodeItems[len - 1];
                        hashCodeItems.length--;
                        break;
                    }
                }
            } else {
                delete this.items[hashCode];
            }

            this.size--;
            return true;
        }

        /**
         *  Removes all items from the set.
         *  @returns {Boolean}
         */
        clear(): boolean {
            if (this.size <= 0) {
                return false;
            }

            this.items = {};
            this.size = 0;
            return true;
        }

        /**
         *  Performs a an action on each item in the set.
         *  @param {Function} action
         *  @param {Object} [context] The action's context.
         */
        forEach(action: (item: T, index: number) => void, context?: Object): void {
            let index = 0;
            let hashes = Object.keys(this.items);
            for (let i = 0, len = hashes.length; i < len; i++) {
                let hashIndexItem = this.items[hashes[i]];
                if (!Array.isArray(hashIndexItem)) {
                    action.call(context, hashIndexItem, index);
                    index++;
                    continue;
                }

                for (let j = 0, hashLength = hashIndexItem.length; j < hashLength; j++) {
                    action.call(context, hashIndexItem[j], index);
                    index++;
                }
            }
        }

        /**
         *  Converts the set to Array.
         *  @returns {Array}
         */
        toArray(): T[] {
            let result = new Array(this.size);
            let index = 0;
            let hashes = Object.keys(this.items);
            for (let i = 0, hashesLen = hashes.length; i < hashesLen; i++) {
                let hashIndexItem = this.items[hashes[i]];
                if (!Array.isArray(hashIndexItem)) {
                    result[index] = hashIndexItem;
                    index++;
                    continue;
                }

                for (let j = 0, len = hashIndexItem.length; j < len; j++) {
                    result[index] = hashIndexItem[j];
                    index++;
                }
            }

            return result;
        }
    }

}
namespace dcore.plugins.mvp {
    "use strict";

    export const CollectionEvents = {
        AddedItems: "added-items",
        DeletedItems: "deleted-items",
        UpdatedItem: "updated-item"
    };

    function onItemChange(item): void {
        this.notify(CollectionEvents.UpdatedItem, item);
    }

    function onItemDestroy(item): void {
        this.removeRange([item]);
    }

    /**
     *  Composite pattern on spaMVP.Model.
     *  It is usefull when you want to listen for collection of models.
     *  @class spaMVP.Collection
     *  @augments spaMVP.Model
     */
    export class Collection<TModel extends Model & MVPEquatable<TModel>> extends Model {
        private models: HashSet<TModel> = new HashSet<TModel>();

        constructor() {
            super();
        }

        get size(): number {
            return this.models.size;
        }

        equals(other: TModel): boolean {
            return false;
        }

        hash(): number {
            return this.size ^ 17;
        }

        /**
         *  Adds new model to the set.
         *  @returns {Boolean}
         */
        add(model: TModel): boolean {
            return this.addRange([model]);
        }

        /**
         *  Adds range of models to the set.
         *  @returns {Boolean}
         */
        addRange(models: TModel[]): boolean {
            let added = [];
            for (let i = 0, len = models.length; i < len; i++) {
                let model = models[i];
                if (!this.models.add(model)) {
                    continue;
                }

                model.on(ModelEvents.Change, onItemChange, this);
                model.on(ModelEvents.Destroy, onItemDestroy, this);
                added.push(model);
            }

            let isModified = added.length > 0;
            if (isModified) {
                this.notify(CollectionEvents.AddedItems, added);
            }

            return isModified;
        }

        /**
         *  Removes a model from the set.
         *  @returns {Boolean}
         */
        remove(model: TModel): boolean {
            return this.removeRange([model]);
        }

        /**
         *  Removes range of models.
         *  @returns {Boolean}
         */
        removeRange(models: TModel[]): boolean {
            let deleted = [];
            for (let i = 0, len = models.length; i < len; i++) {
                let model = models[i];
                if (!this.models.remove(model)) {
                    continue;
                }

                model.off(ModelEvents.Change, onItemChange, this);
                model.off(ModelEvents.Destroy, onItemDestroy, this);
                deleted.push(model);
            }

            let isModified = deleted.length > 0;
            if (isModified) {
                this.notify(CollectionEvents.DeletedItems, deleted);
            }

            return isModified;
        }

        /**
         *  Removes all models from the set.
         *  @returns {Boolean}
         */
        clear(): boolean {
            return this.removeRange(this.toArray());
        }

        /**
         *  Determines whether a model is in the collection.
         *  @returns {Boolean}
         */
        contains(model: TModel): boolean {
            return this.models.contains(model);
        }

        /**
         *  Determines whether the collection is not empty.
         *  @returns {Boolean}
         */
        any(): boolean {
            return this.size > 0;
        }

        /**
         *  Returns the models as Array.
         *  @returns {Array}
         */
        toArray(): TModel[] {
            return this.models.toArray();
        }

        /**
         *  Performs an action on each model in the set.
         */
        forEach(action: (item: TModel, index: number) => void, context: Object): void {
            this.models.forEach(action, context);
        }
    }
}
interface Element {
    trigger(): boolean;
    hasEvent(name: string): boolean;
    detach(): boolean;
    events: boolean;
}

namespace dcore.plugins.mvp {
    "use strict";

    /**
     *  Author: Martin Chaov
     *  github: https://github.com/mchaov/JSEventsManager
     *  Smart events managing by altering the properties of a HTML element
     */

    // 'use strict'; -> issues with iOS Safari on tablet devices: 09.11.2015

    Element.prototype.trigger = function () { return false; }
    Element.prototype.hasEvent = function () { return false; }
    Element.prototype.detach = function () { return false; }
    Element.prototype.events = false;

    function removeEvent(name) {
        var ev, type, handler, useCapture;
        ev = this.events[name];
        useCapture = ev.useCapture;
        type = ev.eventType;
        handler = ev.handler;
        this.removeEventListener(type, handler, useCapture);
        delete this.eventsList[name];
    }

    function detachEvent(name) {
        var i;

        if (name === undefined || name === '') {

            for (i in this.eventsList) {
                removeEvent.call(this, i);
            }
            this.eventsList = {};
        }
        else if (this.hasEvent(name)) {
            removeEvent.call(this, name);
        }

        return this.eventsList;
    }

    function hasEvent(name) {
        return typeof this.eventsList[name] === 'object' ? this.eventsList[name] : false;
    }

    function triggerEvent(name) {
        var evt = this.hasEvent(name);
        if (typeof evt.handler === 'function') {
            return evt.handler();
        }
        return false;
    }

    export function UIEvent(config): void {
        if (!(this instanceof UIEvent)) {
            return new UIEvent(config);
        }

        this.htmlElement = config.htmlElement;

        this.eventConfig = {
            name: config.name,
            eventType: config.eventType,
            handler: config.handler === undefined ? false : config.handler,
            useCapture: config.useCapture === undefined ? false : config.useCapture,
            context: config.context === undefined ? null : config.context
        };

        this.init();
    }

    UIEvent.prototype.init = function () {
        if (this.htmlElement.eventsList === undefined) {
            Object.defineProperties(this.htmlElement, {
                'eventsList': {
                    writable: true,
                    enumerable: false,
                    configurable: false,
                    value: {}
                },
                'events': {
                    enumerable: false,
                    configurable: false,
                    get: function () {
                        return this.eventsList;
                    },
                    set: function (e) {
                        return this.eventsList[e.name] = e;
                    }
                },
                'trigger': {
                    writable: false,
                    enumerable: false,
                    configurable: false,
                    value: triggerEvent
                },
                'hasEvent': {
                    writable: false,
                    enumerable: false,
                    configurable: false,
                    value: hasEvent
                },
                'detach': {
                    writable: false,
                    enumerable: false,
                    configurable: false,
                    value: detachEvent
                }
            });
        }
        else if (this.htmlElement.hasEvent(this.eventConfig.name)) {
            return false;
        }

        this.eventConfig.handler = this.eventConfig.handler.bind(this.eventConfig.context || this);
        this.htmlElement.addEventListener(this.eventConfig.eventType, this.eventConfig.handler, this.eventConfig.useCapture);
        this.htmlElement.events = this.eventConfig;
    };

    Object.defineProperties(UIEvent.prototype, {
        'detach': {
            writable: false,
            enumerable: false,
            configurable: false,
            value: function (name) {
                return detachEvent.call(this.htmlElement, name);
            }
        },
        'trigger': {
            writable: false,
            enumerable: false,
            configurable: false,
            value: function (name) {
                return triggerEvent.call(this.htmlElement, name || this.eventConfig.name);
            }
        }

    });
}
interface MVPView {
    render(model: any): HTMLElement;
    destroy(): void;
}

namespace dcore.plugins.mvp {
    "use strict";

    function eventHandler(ev: Event): void {
        let target = <HTMLElement>ev.target;
        let dataset = target.dataset;
        if (!dataset.hasOwnProperty(ev.type)) {
            return;
        }

        let callbackName = dataset[ev.type];
        if (typeof this[callbackName] === "function") {
            this[callbackName](ev);
            return;
        }
    }

    /**
     *  @class spaMVP.View
     *  @param {HTMLElement} domNode The view's html element.
     *  @param {Function} [template] A function which renders view's html element.
     *  @property {HTMLElement} domNode
     */
    export class View implements MVPView {
        private _domNode: HTMLElement;
        private template: (model: any) => string;

        constructor(domNode: HTMLElement, template?: (model: any) => string) {
            if (!domNode) {
                throw new Error("Dom node cannot be null.");
            }

            this._domNode = domNode;
            this.template = template;
        }

        get domNode(): HTMLElement {
            return this._domNode;
        }

        /**
         *  Maps a view action to given ui event disptached from html element.
         *  Mapping works by using the dataset - e.g data-click="handleClick" maps to handleClick.
         * @param eventType
         * @param useCapture
         * @param selector
         */
        map(eventType: string, useCapture: boolean = false, selector?: string): this {
            UIEvent({
                name: eventType,
                htmlElement: !selector ? this.domNode : this.domNode.querySelector(selector),
                handler: eventHandler,
                eventType: eventType,
                context: this,
                useCapture: useCapture
            });

            return this;
        }

        /**
         *  Renders the view.
         *  @returns {HTMLElement}
         */
        render(model: any): HTMLElement {
            if (this.template) {
                this.domNode.innerHTML = this.template.call(this, model);
            }

            return this.domNode;
        }

        /**
         *  Removes all elements and mapped events.
         */
        destroy(): this {
            if (typeof this.domNode.detach === "function") {
                this.domNode.detach();
            }

            this.removeAllElements();
            this._domNode = null;
            return this;
        }

        /**
         *  Finds an element by given selector.
         *  @param {String} selector
         *  @returns {Element}
         */
        query(selector: string): Element {
            return this.domNode.querySelector(selector);
        }

        /**
         *  Removes an element by given selector.
         *  @param {String} selector
         */
        removeElement(selector: string): this {
            let element = this.query(selector);
            if (element) {
                element.parentElement.removeChild(element);
            }

            return this;
        }

        /**
         *  Removes all elements.
         *  @returns {spaMVP.View}
         */
        removeAllElements(): this {
            while (this.domNode.firstElementChild) {
                this.domNode.removeChild(this.domNode.firstElementChild);
            }

            return this;
        }
    }
}
namespace dcore.plugins.mvp {
    "use strict";

    /**
     *  @class spaMVP.Presenter
     */
    export class Presenter<TView extends MVPView, TModel extends MVPModel> {
        private _view: TView = null;
        private _model: TModel = null;
        private _modelHandlers: Object = {};

        get view(): TView {
            return this._view;
        }

        set view(value: TView) {
            if (this.view === value) {
                return;
            }

            if (this.view) {
                this.view.destroy();
            }

            this._view = value;
        }

        get model(): TModel {
            return this._model;
        }

        set model(model: TModel) {
            if (this._model === model) {
                return;
            }

            Object.keys(this._modelHandlers).forEach(type => {
                let eventHandler = this._modelHandlers[type];
                if (this._model) {
                    this._model.off(type, eventHandler, this);
                }

                if (model) {
                    model.on(type, eventHandler, this);
                }
            });

            this._model = model;
            this.render();
        }

        /**
         *  Determins which events to handle when model notifies. 
         */
        onModel(eventType: string, handler: (data?: any) => void): this {
            if (eventType && handler) {
                this._modelHandlers[eventType] = handler;
            }

            return this;
        }

        /**
         *  Renders its view.
         */
        render(): HTMLElement {
            if (this.view) {
                return this.view.render(this.model);
            }

            return null;
        }

        /**
         *  Destroys its view and model.
         */
        destroy(): void {
            this.view = null;
            this.model = null;
        }
    }

}
interface DCore {
    useMVP(): void;
    mvp: MVPPlugin;
}

interface DSandbox {
    asMVPModel<T>(target: T): T & dcore.plugins.mvp.Model;
}

interface MVPPlugin {
    Model: typeof dcore.plugins.mvp.Model;
    asMVPModel<T>(target: T): T & MVPModel;
    ModelEvents: {
        Change: string,
        Destroy: string
    };
    Collection: typeof dcore.plugins.mvp.Collection;
    CollectionEvents: {
        AddedItems: string,
        DeletedItems: string,
        UpdatedItem: string
    };
    View: typeof dcore.plugins.mvp.View;
    Presenter: typeof dcore.plugins.mvp.Presenter;
}

namespace dcore {
    "use strict";

    import mvp = plugins.mvp;

    export interface Instance {
        useMVP(): void;
        mvp: MVPPlugin;
    }

    export interface DefaultSandbox {
        asMVPModel<T>(target: T): T & MVPModel;
    }

    Instance.prototype.useMVP = function (): void {
        let that = <DCore>this;
        if (that.mvp) {
            return;
        }

        that.mvp = {
            Model: mvp.Model,
            asMVPModel: mvp.asModel,
            ModelEvents: mvp.ModelEvents,
            Collection: mvp.Collection,
            CollectionEvents: mvp.CollectionEvents,
            View: mvp.View,
            Presenter: mvp.Presenter,
        };
    };
}