var dcore;
(function (dcore) {
    var routing;
    (function (routing) {
        "use strict";
        var routeParamRegex = /{([a-zA-Z]+)}/; // e.g {id}
        /**
         *  Accepts a pattern and split it by / (slash).
         *  It also supports dynamic params - {yourDynamicParam}.
         */
        var Route = (function () {
            function Route(pattern, onStart) {
                this.tokens = [];
                var errorMsg = "Route registration failed:";
                if (typeof pattern !== "string") {
                    throw new TypeError(errorMsg + " pattern should be non empty string.");
                }
                if (typeof onStart !== "function") {
                    throw new TypeError(errorMsg + " callback should be a function.");
                }
                this.pattern = pattern;
                this.callback = onStart;
                this.populateTokens();
            }
            /**
             *  The array of tokens after its pattern is splitted by / (slash).
             */
            Route.prototype.getTokens = function () {
                return this.tokens.slice(0);
            };
            /**
             *  Determines whether it equals UrlHash.
             */
            Route.prototype.equals = function (hashUrl) {
                if (this.tokens.length !== hashUrl.tokens.length) {
                    return false;
                }
                for (var i = 0, len = this.tokens.length; i < len; i++) {
                    var token = this.tokens[i];
                    var urlToken = hashUrl.tokens[i];
                    if (token.isDynamic) {
                        continue;
                    }
                    if (token.name.toLowerCase() !== urlToken.toLowerCase()) {
                        return false;
                    }
                }
                return true;
            };
            /**
             *  Populate the dynamic params from the UrlHash if such exist
             *  and executes the registered callback.
             */
            Route.prototype.start = function (urlHash) {
                this.queryParams = Object.freeze(this.getParamsFromUrl(urlHash));
                if (this.callback) {
                    try {
                        this.callback(this.queryParams, this.pattern);
                    }
                    catch (error) {
                        console.error("Couldn't start " + urlHash.value + " route due to:");
                        console.error(error);
                    }
                }
            };
            Route.prototype.populateTokens = function () {
                var _this = this;
                this.tokens = [];
                this.pattern.split("/").forEach(function (urlFragment) {
                    if (urlFragment !== "") {
                        _this.tokens.push(_this.parseToken(urlFragment));
                    }
                });
            };
            Route.prototype.parseToken = function (urlFragment) {
                var paramMatchGroups = routeParamRegex.exec(urlFragment);
                var isDynamic = !!paramMatchGroups;
                return {
                    name: isDynamic ? paramMatchGroups[1] : urlFragment,
                    isDynamic: isDynamic
                };
            };
            Route.prototype.getParamsFromUrl = function (url) {
                var result = this.getQueryParamsFromUrl(url);
                // route params are with higher priority than query params
                this.tokens.forEach(function (token, index) {
                    if (token.isDynamic) {
                        result[token.name] = url.tokens[index];
                    }
                });
                return result;
            };
            Route.prototype.getQueryParamsFromUrl = function (url) {
                var result = {};
                url.queryParams.forEach(function (param) { return result[param.key] = param.value; });
                return result;
            };
            return Route;
        }());
        routing.Route = Route;
    })(routing = dcore.routing || (dcore.routing = {}));
})(dcore || (dcore = {}));
