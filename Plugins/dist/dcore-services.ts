interface DServicesPlugin {
    add<T>(id: string, creator: () => T): this;
    get<T>(id: string): T;
}

namespace dcore.plugins.services {
    "use strict";

    interface ServiceList {
        [id: string]: () => any;
    }


    export class ServiceConfig implements DServicesPlugin {
        private services: ServiceList = {};

        /**
         *  Add a service.
         *  @param {String} id
         *  @param {Function} factory - function which provides an instance of the service.
         */
        add<T>(id: string, creator: () => T): this {
            if (typeof id !== "string" || id === "") {
                throw new TypeError(id + " service registration failed: ID must be non empty string.");
            }

            if (typeof creator !== "function") {
                throw new TypeError(id + " service registration failed: creator must be a function.");
            }

            if (this.services[id]) {
                throw new TypeError(id + " service registration failed: a service with such id has been already added.");
            }

            this.services[id] = creator;
            return this;
        }

        /**
         *  Gets a specific service instance by id.
         *  @param {String} id
         *  @returns {*}
         */
        get<T>(id: string): T {
            let creator = this.services[id];
            if (!creator) {
                throw new ReferenceError(id + " service was not found.");
            }

            return creator();
        }
    }
}
interface DCore {
    useServices(): void;
    services: DServicesPlugin;
}

interface DSandbox {
    getService<T>(id: string): T;
}

namespace dcore {
    "use strict";

    import services = plugins.services;
    
    export interface Instance {
        useServices(): void;
        services: DServicesPlugin;
    }

    export interface DefaultSandbox {
        getService<T>(id: string): T;
    }
    
    Instance.prototype.useServices = function (): void {
        let that = <DCore>this;
        if (that.services) {
            return;
        }

        that.services = new services.ServiceConfig();

        /**
         *  Gets a specific service instance by id.
         *  @param {String} id
         *  @returns {*}
         */
        that.Sandbox.prototype.getService = function <T>(id: string): T {
            return this.core.services.get(id);
        };
    };
}