/**
 * ui base on angularjs
 * Authors: Marshane
 */

    angular.module('ui', ['ui.tpls', 'ui.transition', 'ui.modal','ui.bindHtml',
        'ui.dateparser', 'ui.datepicker','ui.timepicker','ui.collapse',
        'ui.buttons', 'ui.tabs', 'ui.position','ui.dropdown', 'ui.loading','ui.tooltip',
        'ui.tooltip','ui.edit','ui.common']);
    angular.module("ui.tpls", ["templates/modal/backdrop.html",
        "templates/modal/window.html",
        'templates/tabs/tab.html',
        'templates/tabs/tabset-titles.html',
        'templates/tabs/tabset.html',
        'templates/dropdown/select.html',
        'templates/tooltip/tooltip-html-unsafe-popup.html',
        'templates/tooltip/tooltip-popup.html',
        "templates/datepicker/datepicker.html",
        "templates/datepicker/day.html",
        "templates/datepicker/month.html",
        "templates/datepicker/popup.html",
        "templates/datepicker/year.html",
        'templates/timepicker/timepicker.html',
        'templates/tooltip/tooltip-html-unsafe-popup.html',
        'templates/tooltip/tooltip-popup.html'
    ]);
    angular.module('ui.transition', [])
        .factory('$transition', ['$q', '$timeout', '$rootScope', function ($q, $timeout, $rootScope) {
            var $transition = function (element, trigger, options) {
                options = options || {};
                var deferred = $q.defer();
                var endEventName = $transition[options.animation ? "animationEndEventName" : "transitionEndEventName"];
                var transitionEndHandler = function (event) {
                    $rootScope.$apply(function () {
                        element.unbind(endEventName, transitionEndHandler);
                        deferred.resolve(element);
                    });
                };
                if (endEventName) {
                    element.bind(endEventName, transitionEndHandler);
                }
                // Wrap in a timeout to allow the browser time to update the DOM before the transition is to occur
                $timeout(function () {
                    if (angular.isString(trigger)) {
                        element.addClass(trigger);
                    } else if (angular.isFunction(trigger)) {
                        trigger(element);
                    } else if (angular.isObject(trigger)) {
                        element.css(trigger);
                    }
                    //If browser does not support transitions, instantly resolve
                    if (!endEventName) {
                        deferred.resolve(element);
                    }
                });
                // Add our custom cancel function to the promise that is returned
                // We can call this if we are about to run a new transition, which we know will prevent this transition from ending,
                // i.e. it will therefore never raise a transitionEnd event for that transition
                deferred.promise.cancel = function () {
                    if (endEventName) {
                        element.unbind(endEventName, transitionEndHandler);
                    }
                    deferred.reject('Transition cancelled');
                };
                return deferred.promise;
            };
            // Work out the name of the transitionEnd event
            var transElement = document.createElement('trans');
            var transitionEndEventNames = {
                'WebkitTransition': 'webkitTransitionEnd',
                'MozTransition': 'transitionend',
                'OTransition': 'oTransitionEnd',
                'transition': 'transitionend'
            };
            var animationEndEventNames = {
                'WebkitTransition': 'webkitAnimationEnd',
                'MozTransition': 'animationend',
                'OTransition': 'oAnimationEnd',
                'transition': 'animationend'
            };

            function findEndEventName(endEventNames) {
                for (var name in endEventNames) {
                    if (transElement.style[name] !== undefined) {
                        return endEventNames[name];
                    }
                }
            }

            $transition.transitionEndEventName = findEndEventName(transitionEndEventNames);
            $transition.animationEndEventName = findEndEventName(animationEndEventNames);
            return $transition;
        }]);
    angular.module('ui.modal', ['ui.transition'])
        /**
         * A helper, internal data structure that acts as a map but also allows getting / removing
         * elements in the LIFO order
         */
        .factory('$$stackedMap', function () {
            return {
                createNew: function () {
                    var stack = [];
                    return {
                        add: function (key, value) {
                            stack.push({
                                key: key,
                                value: value
                            });
                        },
                        get: function (key) {
                            for (var i = 0; i < stack.length; i++) {
                                if (key == stack[i].key) {
                                    return stack[i];
                                }
                            }
                        },
                        keys: function () {
                            var keys = [];
                            for (var i = 0; i < stack.length; i++) {
                                keys.push(stack[i].key);
                            }
                            return keys;
                        },
                        top: function () {
                            return stack[stack.length - 1];
                        },
                        remove: function (key) {
                            var idx = -1;
                            for (var i = 0; i < stack.length; i++) {
                                if (key == stack[i].key) {
                                    idx = i;
                                    break;
                                }
                            }
                            return stack.splice(idx, 1)[0];
                        },
                        removeTop: function () {
                            return stack.splice(stack.length - 1, 1)[0];
                        },
                        length: function () {
                            return stack.length;
                        }
                    };
                }
            };
        })
        /**
         * A helper directive for the $modal service. It creates a backdrop element.
         */
        .directive('modalBackdrop', ['$timeout', function ($timeout) {
            return {
                restrict: 'EA',
                replace: true,
                templateUrl: 'templates/modal/backdrop.html',
                link: function (scope) {
                    scope.animate = false;
                    //trigger CSS transitions
                    $timeout(function () {
                        scope.animate = true;
                    });
                }
            };
        }])
        .directive('modalWindow', ['$modalStack', '$timeout', '$compile', function ($modalStack, $timeout, $compile) {
            return {
                restrict: 'EA',
                scope: {
                    index: '@',
                    animate: '='
                },
                replace: true,
                transclude: true,
                templateUrl: 'templates/modal/window.html',
                compile: function () {
                    return{
                        post: function (scope, element, attrs) {
                            var modal_close = $compile('<a class="modal-close"><span class="close">×</span></a>')(scope);
                            element.find('.modal-content').prepend(modal_close);
                            scope.windowClass = attrs.windowClass || '';
                            scope.width = attrs.width || '';
                            $timeout(function () {
                                // trigger CSS transitions
                                scope.animate = true;
                                // focus a freshly-opened modal
                                element[0].focus();
                            });
                            scope.close = function (evt) {
                                var modal = $modalStack.getTop();

                                if (modal && modal.value.backdrop && modal.value.backdrop != 'static' && (evt.target === evt.currentTarget)) {
                                    evt.preventDefault();
                                    evt.stopPropagation();
                                    $modalStack.dismiss(modal.key, 'backdrop click');
                                }
                            };
                            modal_close.unbind('click').bind('click', function (evt) {
                                evt.preventDefault();
                                evt.stopPropagation();
                                scope.$apply(function () {
                                    var modal = $modalStack.getTop();
                                    $modalStack.dismiss(modal.key, 'backdrop click');
                                })
                            });
                        }
                    }
                }
            };
        }])
        .factory('$modalStack', ['$transition', '$timeout', '$document', '$compile', '$rootScope', '$$stackedMap',
            function ($transition, $timeout, $document, $compile, $rootScope, $$stackedMap) {
                var OPENED_MODAL_CLASS = 'modal-open';
                var backdropDomEl, backdropScope;
                var openedWindows = $$stackedMap.createNew();
                var $modalStack = {};

                function backdropIndex() {
                    var topBackdropIndex = -1;
                    var opened = openedWindows.keys();
                    for (var i = 0; i < opened.length; i++) {
                        if (openedWindows.get(opened[i]).value.backdrop) {
                            topBackdropIndex = i;
                        }
                    }
                    return topBackdropIndex;
                }

                $rootScope.$watch(backdropIndex, function (newBackdropIndex) {
                    if (backdropScope) {
                        backdropScope.index = newBackdropIndex;
                    }
                });
                function removeModalWindow(modalInstance) {
                    var body = $document.find('body').eq(0);
                    var modalWindow = openedWindows.get(modalInstance).value;
                    //clean up the stack
                    openedWindows.remove(modalInstance);
                    //remove window DOM element
                    removeAfterAnimate(modalWindow.modalDomEl, modalWindow.modalScope, 300, checkRemoveBackdrop);
                    body.toggleClass(OPENED_MODAL_CLASS, openedWindows.length() > 0);
                }

                function checkRemoveBackdrop() {
                    //remove backdrop if no longer needed
                    if (backdropDomEl && backdropIndex() == -1) {
                        var backdropScopeRef = backdropScope;
                        removeAfterAnimate(backdropDomEl, backdropScope, 150, function () {
                            backdropScopeRef.$destroy();
                            backdropScopeRef = null;
                        });
                        backdropDomEl = undefined;
                        backdropScope = undefined;
                    }
                }

                function removeAfterAnimate(domEl, scope, emulateTime, done) {
                    // Closing animation
                    scope.animate = false;
                    var transitionEndEventName = $transition.transitionEndEventName;
                    if (transitionEndEventName) {
                        // transition out
                        var timeout = $timeout(afterAnimating, emulateTime);
                        domEl.bind(transitionEndEventName, function () {
                            $timeout.cancel(timeout);
                            afterAnimating();
                            scope.$apply();
                        });
                    } else {
                        // Ensure this call is async
                        $timeout(afterAnimating, 0);
                    }
                    function afterAnimating() {
                        if (afterAnimating.done) {
                            return;
                        }
                        afterAnimating.done = true;
                        domEl.remove();
                        if (done) {
                            done();
                        }
                    }
                }

                $document.bind('keydown', function (evt) {
                    var modal;
                    if (evt.which === 27) {
                        modal = openedWindows.top();
                        if (modal && modal.value.keyboard) {
                            $rootScope.$apply(function () {
                                $modalStack.dismiss(modal.key);
                            });
                        }
                    }
                });
                $modalStack.open = function (modalInstance, modal) {
                    openedWindows.add(modalInstance, {
                        deferred: modal.deferred,
                        modalScope: modal.scope,
                        backdrop: modal.backdrop,
                        keyboard: modal.keyboard
                    });
                    var body = $document.find('body').eq(0),
                        currBackdropIndex = backdropIndex();
                    if (currBackdropIndex >= 0 && !backdropDomEl) {
                        backdropScope = $rootScope.$new(true);
                        backdropScope.index = currBackdropIndex;
                        backdropDomEl = $compile('<div modal-backdrop></div>')(backdropScope);
                        body.append(backdropDomEl);
                    }
                    var angularDomEl = angular.element('<div modal-window></div>');
                    angularDomEl.attr('window-class', modal.windowClass);
                    angularDomEl.attr('index', openedWindows.length() - 1);
                    angularDomEl.attr('animate', 'animate');
                    angularDomEl.attr('width', modal.width);
                    angularDomEl.html(modal.content);
                    var modalDomEl = $compile(angularDomEl)(modal.scope);
                    openedWindows.top().value.modalDomEl = modalDomEl;
                    body.append(modalDomEl);
                    body.addClass(OPENED_MODAL_CLASS);
                };
                $modalStack.close = function (modalInstance, result) {
                    var modalWindow = openedWindows.get(modalInstance).value;
                    if (modalWindow) {
                        modalWindow.deferred.resolve(result);
                        removeModalWindow(modalInstance);
                    }
                };
                $modalStack.dismiss = function (modalInstance, reason) {
                    var modalWindow = openedWindows.get(modalInstance).value;
                    if (modalWindow) {
                        modalWindow.deferred.reject(reason);
                        removeModalWindow(modalInstance);
                    }
                };
                $modalStack.dismissAll = function (reason) {
                    var topModal = this.getTop();
                    while (topModal) {
                        this.dismiss(topModal.key, reason);
                        topModal = this.getTop();
                    }
                };
                $modalStack.getTop = function () {
                    return openedWindows.top();
                };
                return $modalStack;
            }])
        .provider('$modal', function () {
            var $modalProvider = {
                options: {
                    backdrop: true, //can be also false or 'static'
                    keyboard: true
                },
                $get: ['$injector', '$rootScope', '$q', '$http', '$templateCache', '$controller', '$modalStack',
                    function ($injector, $rootScope, $q, $http, $templateCache, $controller, $modalStack) {
                        var $modal = {};

                        function getTemplatePromise(options) {
                            return options.template ? $q.when(options.template) :
                                $http.get(options.templateUrl, {cache: $templateCache}).then(function (result) {
                                    return result.data;
                                });
                        }

                        function getResolvePromises(resolves) {
                            var promisesArr = [];
                            angular.forEach(resolves, function (value, key) {
                                if (angular.isFunction(value) || angular.isArray(value)) {
                                    promisesArr.push($q.when($injector.invoke(value)));
                                }
                            });
                            return promisesArr;
                        }

                        $modal.open = function (modalOptions) {
                            var modalResultDeferred = $q.defer();
                            var modalOpenedDeferred = $q.defer();
                            //prepare an instance of a modal to be injected into controllers and returned to a caller
                            var modalInstance = {
                                result: modalResultDeferred.promise,
                                opened: modalOpenedDeferred.promise,
                                close: function (result) {
                                    $modalStack.close(modalInstance, result);
                                },
                                dismiss: function (reason) {
                                    $modalStack.dismiss(modalInstance, reason);
                                }
                            };
                            //merge and clean up options
                            modalOptions = angular.extend({}, $modalProvider.options, modalOptions);
                            modalOptions.resolve = modalOptions.resolve || {};
                            //verify options
                            if (!modalOptions.template && !modalOptions.templateUrl) {
                                throw new Error('One of template or templateUrl options is required.');
                            }
                            var templateAndResolvePromise =
                                $q.all([getTemplatePromise(modalOptions)].concat(getResolvePromises(modalOptions.resolve)));
                            templateAndResolvePromise.then(function resolveSuccess(tplAndVars) {
                                var modalScope = (modalOptions.scope || $rootScope).$new();
                                modalScope.$close = modalInstance.close;
                                modalScope.$dismiss = modalInstance.dismiss;
                                var ctrlInstance, ctrlLocals = {};
                                var resolveIter = 1;
                                //controllers
                                if (modalOptions.controller) {
                                    ctrlLocals.$scope = modalScope;
                                    ctrlLocals.$modalInstance = modalInstance;
                                    angular.forEach(modalOptions.resolve, function (value, key) {
                                        ctrlLocals[key] = tplAndVars[resolveIter++];
                                    });
                                    ctrlInstance = $controller(modalOptions.controller, ctrlLocals);
                                }
                                $modalStack.open(modalInstance, {
                                    scope: modalScope,
                                    deferred: modalResultDeferred,
                                    content: tplAndVars[0],
                                    backdrop: modalOptions.backdrop,
                                    keyboard: modalOptions.keyboard,
                                    windowClass: modalOptions.windowClass,
                                    width: modalOptions.width
                                });
                            }, function resolveError(reason) {
                                modalResultDeferred.reject(reason);
                            });
                            templateAndResolvePromise.then(function () {
                                modalOpenedDeferred.resolve(true);
                            }, function () {
                                modalOpenedDeferred.reject(false);
                            });
                            return modalInstance;
                        };

                        return $modal;
                    }]
            };
            return $modalProvider;
        });
    angular.module('ui.dateparser', [])
        .service('dateParser', ['$locale', 'orderByFilter', function ($locale, orderByFilter) {
            this.parsers = {};
            var formatCodeToRegex = {
                'yyyy': {
                    regex: '\\d{4}',
                    apply: function (value) {
                        this.year = +value;
                    }
                },
                'yy': {
                    regex: '\\d{2}',
                    apply: function (value) {
                        this.year = +value + 2000;
                    }
                },
                'y': {
                    regex: '\\d{1,4}',
                    apply: function (value) {
                        this.year = +value;
                    }
                },
                'MMMM': {
                    regex: $locale.DATETIME_FORMATS.MONTH.join('|'),
                    apply: function (value) {
                        this.month = $locale.DATETIME_FORMATS.MONTH.indexOf(value);
                    }
                },
                'MMM': {
                    regex: $locale.DATETIME_FORMATS.SHORTMONTH.join('|'),
                    apply: function (value) {
                        this.month = $locale.DATETIME_FORMATS.SHORTMONTH.indexOf(value);
                    }
                },
                'MM': {
                    regex: '0[1-9]|1[0-2]',
                    apply: function (value) {
                        this.month = value - 1;
                    }
                },
                'M': {
                    regex: '[1-9]|1[0-2]',
                    apply: function (value) {
                        this.month = value - 1;
                    }
                },
                'dd': {
                    regex: '[0-2][0-9]{1}|3[0-1]{1}',
                    apply: function (value) {
                        this.date = +value;
                    }
                },
                'd': {
                    regex: '[1-2]?[0-9]{1}|3[0-1]{1}',
                    apply: function (value) {
                        this.date = +value;
                    }
                },
                'EEEE': {
                    regex: $locale.DATETIME_FORMATS.DAY.join('|')
                },
                'EEE': {
                    regex: $locale.DATETIME_FORMATS.SHORTDAY.join('|')
                }
            };

            this.createParser = function (format) {
                var map = [], regex = format.split('');
                angular.forEach(formatCodeToRegex, function (data, code) {
                    var index = format.indexOf(code);

                    if (index > -1) {
                        format = format.split('');

                        regex[index] = '(' + data.regex + ')';
                        format[index] = '$'; // Custom symbol to define consumed part of format
                        for (var i = index + 1, n = index + code.length; i < n; i++) {
                            regex[i] = '';
                            format[i] = '$';
                        }
                        format = format.join('');

                        map.push({ index: index, apply: data.apply });
                    }
                });

                return {
                    regex: new RegExp('^' + regex.join('') + '$'),
                    map: orderByFilter(map, 'index')
                };
            };

            this.parse = function (input, format) {
                if (!angular.isString(input)) {
                    return input;
                }
                format = $locale.DATETIME_FORMATS[format] || format;
                if (!this.parsers[format]) {
                    this.parsers[format] = this.createParser(format);
                }

                var parser = this.parsers[format],
                    regex = parser.regex,
                    map = parser.map,
                    results = input.match(regex);

                if (results && results.length) {
                    var fields = { year: 1900, month: 0, date: 1, hours: 0 }, dt;

                    for (var i = 1, n = results.length; i < n; i++) {
                        var mapper = map[i - 1];
                        if (mapper.apply) {
                            mapper.apply.call(fields, results[i]);
                        }
                    }

                    if (isValid(fields.year, fields.month, fields.date)) {
                        dt = new Date(fields.year, fields.month, fields.date, fields.hours);
                    }
                    return dt;
                }
            };

            // Check if date is valid for specific month (and year for February).
            // Month: 0 = Jan, 1 = Feb, etc
            function isValid(year, month, date) {
                if (month === 1 && date > 28) {
                    return date === 29 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
                }

                if (month === 3 || month === 5 || month === 8 || month === 10) {
                    return date < 31;
                }

                return true;
            }
        }]);
    angular.module('ui.position', [])
        .factory('$position', ['$document', '$window', function ($document, $window) {
            function getStyle(el, cssprop) {
                if (el.currentStyle) { //IE
                    return el.currentStyle[cssprop];
                } else if ($window.getComputedStyle) {
                    return $window.getComputedStyle(el)[cssprop];
                }
                // finally try and get inline style
                return el.style[cssprop];
            }

            /**
             * Checks if a given element is statically positioned
             * @param element - raw DOM element
             */
            function isStaticPositioned(element) {
                return (getStyle(element, 'position') || 'static' ) === 'static';
            }

            /**
             * returns the closest, non-statically positioned parentOffset of a given element
             * @param element
             */
            var parentOffsetEl = function (element) {
                var docDomEl = $document[0];
                var offsetParent = element.offsetParent || docDomEl;
                while (offsetParent && offsetParent !== docDomEl && isStaticPositioned(offsetParent)) {
                    offsetParent = offsetParent.offsetParent;
                }
                return offsetParent || docDomEl;
            };

            return {
                /**
                 * Provides read-only equivalent of jQuery's position function:
                 * http://api.jquery.com/position/
                 */
                position: function (element) {
                    var elBCR = this.offset(element);
                    var offsetParentBCR = { top: 0, left: 0 };
                    var offsetParentEl = parentOffsetEl(element[0]);
                    if (offsetParentEl != $document[0]) {
                        offsetParentBCR = this.offset(angular.element(offsetParentEl));
                        offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
                        offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
                    }

                    var boundingClientRect = element[0].getBoundingClientRect();
                    return {
                        width: boundingClientRect.width || element.prop('offsetWidth'),
                        height: boundingClientRect.height || element.prop('offsetHeight'),
                        top: elBCR.top - offsetParentBCR.top,
                        left: elBCR.left - offsetParentBCR.left
                    };
                },

                /**
                 * Provides read-only equivalent of jQuery's offset function:
                 * http://api.jquery.com/offset/
                 */
                offset: function (element) {
                    var boundingClientRect = element[0].getBoundingClientRect();
                    return {
                        width: boundingClientRect.width || element.prop('offsetWidth'),
                        height: boundingClientRect.height || element.prop('offsetHeight'),
                        top: boundingClientRect.top + ($window.pageYOffset || $document[0].documentElement.scrollTop),
                        left: boundingClientRect.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft)
                    };
                },

                /**
                 * Provides coordinates for the targetEl in relation to hostEl
                 */
                positionElements: function (hostEl, targetEl, positionStr, appendToBody) {

                    var positionStrParts = positionStr.split('-');
                    var pos0 = positionStrParts[0], pos1 = positionStrParts[1] || 'center';

                    var hostElPos,
                        targetElWidth,
                        targetElHeight,
                        targetElPos;

                    hostElPos = appendToBody ? this.offset(hostEl) : this.position(hostEl);

                    targetElWidth = targetEl.prop('offsetWidth');
                    targetElHeight = targetEl.prop('offsetHeight');

                    var shiftWidth = {
                        center: function () {
                            return hostElPos.left + hostElPos.width / 2 - targetElWidth / 2;
                        },
                        left: function () {
                            return hostElPos.left;
                        },
                        right: function () {
                            return hostElPos.left + hostElPos.width;
                        }
                    };

                    var shiftHeight = {
                        center: function () {
                            return hostElPos.top + hostElPos.height / 2 - targetElHeight / 2;
                        },
                        top: function () {
                            return hostElPos.top;
                        },
                        bottom: function () {
                            return hostElPos.top + hostElPos.height;
                        }
                    };

                    switch (pos0) {
                        case 'right':
                            targetElPos = {
                                top: shiftHeight[pos1](),
                                left: shiftWidth[pos0]()
                            };
                            break;
                        case 'left':
                            targetElPos = {
                                top: shiftHeight[pos1](),
                                left: hostElPos.left - targetElWidth
                            };
                            break;
                        case 'bottom':
                            targetElPos = {
                                top: shiftHeight[pos0](),
                                left: shiftWidth[pos1]()
                            };
                            break;
                        default:
                            targetElPos = {
                                top: hostElPos.top - targetElHeight,
                                left: shiftWidth[pos1]()
                            };
                            break;
                    }

                    return targetElPos;
                }
            };
        }]);
    angular.module('ui.datepicker', ['ui.dateparser', 'ui.position'])
        .constant('datepickerConfig', {
            formatDay: 'dd',
            formatMonth: 'MMMM',
            formatYear: 'yyyy',
            formatDayHeader: 'EEE',
            formatDayTitle: 'MMMM yyyy',
            formatMonthTitle: 'yyyy',
            timeFormat: 'HH:mm:ss',
            datepickerMode: 'day',
            minMode: 'day',
            maxMode: 'year',
            showWeeks: false,
            startingDay: 0,
            yearRange: 20,
            minDate: null,
            maxDate: null
        })
        .controller('DatepickerController', ['$scope', '$attrs', '$parse', '$interpolate', '$timeout', '$log', 'dateFilter', 'datepickerConfig', function ($scope, $attrs, $parse, $interpolate, $timeout, $log, dateFilter, datepickerConfig) {
            var self = this,
                ngModelCtrl = { $setViewValue: angular.noop }; // nullModelCtrl;
            // Modes chain
            this.modes = ['day', 'month', 'year'];
            // Configuration attributes
            angular.forEach(['formatDay', 'formatMonth', 'formatYear', 'formatDayHeader', 'formatDayTitle', 'formatMonthTitle',
                'minMode', 'maxMode', 'showWeeks', 'startingDay', 'yearRange'], function (key, index) {
                self[key] = angular.isDefined($attrs[key]) ?
                    (index < 8 ? $interpolate($attrs[key])($scope.$parent) :
                        $scope.$parent.$eval($attrs[key])) : datepickerConfig[key];
            });
            // Watchable attributes
            angular.forEach(['minDate', 'maxDate'], function (key) {
                if ($attrs[key]) {
                    $scope.$parent.$watch($parse($attrs[key]), function (value) {
                        self[key] = value ? new Date(value) : null;
                        self.refreshView();
                    });
                } else {
                    self[key] = datepickerConfig[key] ? new Date(datepickerConfig[key]) : null;
                }
            });
            $scope.datepickerMode = $scope.datepickerMode || datepickerConfig.datepickerMode;
            $scope.uniqueId = 'datepicker-' + $scope.$id + '-' + Math.floor(Math.random() * 10000);
            this.activeDate = angular.isDefined($attrs.initDate) ? $scope.$parent.$eval($attrs.initDate) : new Date();
            $scope.isActive = function (dateObject) {
                if (self.compare(dateObject.date, self.activeDate) === 0) {
                    $scope.activeDateId = dateObject.uid;
                    return true;
                }
                return false;
            };
            this.init = function (ngModelCtrl_) {
                ngModelCtrl = ngModelCtrl_;

                ngModelCtrl.$render = function () {
                    self.render();
                };
            };
            this.getRemind = function () {
                var a = $scope.remind;
                if (a) {
                    return a
                }
                return ''
            };
            this.addRemind = function (data, day) {
                var i = 0, j, l = day.length, l2 = data.length, d, d2;
                for (; i < l2; i++) {
                    for (j = 0; j < l; j++) {
                        d = new Date(data[i].date);
                        d2 = new Date(day[j].date);
                        if (d.getDate() === d2.getDate() && d.getMonth() === d2.getMonth()) {
                            day[j].remind = data[i];
                        }
                        day[j].isRemind = true;
                    }
                }
            };
            this.render = function () {
                if (ngModelCtrl.$modelValue) {
                    var date = new Date(ngModelCtrl.$modelValue),
                        isValid = !isNaN(date);
                    if (isValid) {
                        this.activeDate = date;
                    } else {
                        $log.error('Datepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
                    }
                    ngModelCtrl.$setValidity('date', isValid);
                }
                this.refreshView();
            };
            this.refreshView = function () {
                if (this.element) {
                    this._refreshView();
                    var date = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;
                    ngModelCtrl.$setValidity('date-disabled', !date || (this.element && !this.isDisabled(date)));
                }
            };
            this.createDateObject = function (date, format) {
                var model = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;
                return {
                    date: date,
                    label: dateFilter(date, format),
                    selected: model && this.compare(date, model) === 0,
                    disabled: this.isDisabled(date),
                    current: this.compare(date, new Date()) === 0
                };
            };
            this.isDisabled = function (date) {
                return ((this.minDate && this.compare(date, this.minDate) < 0) || (this.maxDate && this.compare(date, this.maxDate) > 0) || ($attrs.dateDisabled && $scope.dateDisabled({date: date, mode: $scope.datepickerMode})));
            };
            // Split array into smaller arrays
            this.split = function (arr, size) {
                var arrays = [];
                while (arr.length > 0) {
                    arrays.push(arr.splice(0, size));
                }
                return arrays;
            };
            $scope.select = function (date, bool, evt, notAllowed, dataAPI) {
                if (evt) {
                    evt.stopPropagation();
                }
                if ($scope.datepickerMode === self.minMode) {
                    var dt = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : new Date(0, 0, 0, 0, 0, 0, 0);
                    dt.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                    var miniTime = $scope.$parent.$parent.miniTime;
                    var nowDate = new Date();
                    if (miniTime) {
                        dt.setHours(miniTime.getHours());
                        dt.setMinutes(miniTime.getMinutes());
                        dt.setSeconds(miniTime.getSeconds());
                    } else {
                        dt.setHours(nowDate.getHours());
                        dt.setMinutes(nowDate.getMinutes());
                        dt.setSeconds(nowDate.getSeconds());
                    }
                    ngModelCtrl.$setViewValue(dt);
                    ngModelCtrl.$render();
                } else {
                    self.activeDate = date;
                    $scope.datepickerMode = self.modes[ self.modes.indexOf($scope.datepickerMode) - 1 ];
                }
                if (bool) {
                    if ($scope.asynRemind)
                        $scope.asynRemind({month: date.getMonth() + 1});
                } else {
                    if ($scope.onselect && !notAllowed)
                        $scope.onselect({remind: dataAPI});
                }

            };
            $scope.move = function (direction) {
                var year = self.activeDate.getFullYear() + direction * (self.step.years || 0),
                    month = self.activeDate.getMonth() + direction * (self.step.months || 0);
                self.activeDate.setFullYear(year, month, 1);
                self.refreshView();
                if ($scope.asynRemind)
                    $scope.asynRemind({month: self.activeDate.getMonth() + 1});
            };
            $scope.toggleMode = function (direction) {
                direction = direction || 1;
                if (($scope.datepickerMode === self.maxMode && direction === 1) || ($scope.datepickerMode === self.minMode && direction === -1)) {
                    return;
                }
                $scope.datepickerMode = self.modes[ self.modes.indexOf($scope.datepickerMode) + direction ];
            };
            // Key event mapper
            $scope.keys = { 13: 'enter', 32: 'space', 33: 'pageup', 34: 'pagedown', 35: 'end', 36: 'home', 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
            var focusElement = function () {
                $timeout(function () {
                    self.element[0].focus();
                }, 0, false);
            };
            // Listen for focus requests from popup directive
            $scope.$on('datepicker.focus', focusElement);

            $scope.keydown = function (evt) {
                var key = $scope.keys[evt.which];
                if (!key || evt.shiftKey || evt.altKey) {
                    return;
                }
                evt.preventDefault();
                evt.stopPropagation();
                if (key === 'enter' || key === 'space') {
                    if (self.isDisabled(self.activeDate)) {
                        return; // do nothing
                    }
                    $scope.select(self.activeDate);
                    focusElement();
                } else if (evt.ctrlKey && (key === 'up' || key === 'down')) {
                    $scope.toggleMode(key === 'up' ? 1 : -1);
                    focusElement();
                } else {
                    self.handleKeyDown(key, evt);
                    self.refreshView();
                }
            };
        }])
        .directive('datepicker', function () {
            return {
                restrict: 'EAC',
                replace: true,
                templateUrl: 'templates/datepicker/datepicker.html',
                scope: {
                    datepickerMode: '=?',
                    remind: '=?',
                    onselect: '&',
                    asynRemind: '&',
                    dateDisabled: '&'
                },
                require: ['datepicker', '?^ngModel'],
                controller: 'DatepickerController',
                link: function (scope, element, attrs, ctrls) {
                    var datepickerCtrl = ctrls[0], ngModelCtrl = ctrls[1];
                    if (ngModelCtrl) {
                        datepickerCtrl.init(ngModelCtrl);
                    }
                    scope.$watch('remind', function (a, b) {
                        if (a != b) {
                            datepickerCtrl.refreshView();
                        }
                    }, true);
                }
            };
        })
        .directive('daypicker', ['dateFilter', function (dateFilter) {
            return {
                restrict: 'EA',
                replace: true,
                templateUrl: 'templates/datepicker/day.html',
                require: '^datepicker',
                link: function (scope, element, attrs, ctrl) {
                    scope.showWeeks = ctrl.showWeeks;

                    ctrl.step = { months: 1 };
                    ctrl.element = element;

                    var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

                    function getDaysInMonth(year, month) {
                        return ((month === 1) && (year % 4 === 0) && ((year % 100 !== 0) || (year % 400 === 0))) ? 29 : DAYS_IN_MONTH[month];
                    }

                    function getDates(startDate, n) {
                        var dates = new Array(n), current = new Date(startDate), i = 0;
                        current.setHours(12); // Prevent repeated dates because of timezone bug
                        while (i < n) {
                            dates[i++] = new Date(current);
                            current.setDate(current.getDate() + 1);
                        }
                        return dates;
                    }

                    ctrl._refreshView = function () {
                        var year = ctrl.activeDate.getFullYear(),
                            month = ctrl.activeDate.getMonth(),
                            firstDayOfMonth = new Date(year, month, 1),
                            difference = ctrl.startingDay - firstDayOfMonth.getDay(),
                            numDisplayedFromPreviousMonth = (difference > 0) ? 7 - difference : -difference,
                            firstDate = new Date(firstDayOfMonth);
                        var remind = ctrl.getRemind();
                        if (numDisplayedFromPreviousMonth > 0) {
                            firstDate.setDate(-numDisplayedFromPreviousMonth + 1);
                        }

                        // 42 is the number of days on a six-month calendar
                        var days = getDates(firstDate, 35);

                        for (var i = 0; i < 35; i++) {
                            days[i] = angular.extend(ctrl.createDateObject(days[i], ctrl.formatDay), {
                                secondary: days[i].getMonth() !== month,
                                uid: scope.uniqueId + '-' + i
                            });
                        }
                        if (remind) {
                            ctrl.addRemind(remind, days);//添加提醒
                        }
                        scope.labels = new Array(7);
                        for (var j = 0; j < 7; j++) {
                            scope.labels[j] = {
                                abbr: dateFilter(days[j].date, ctrl.formatDayHeader),
                                full: dateFilter(days[j].date, 'EEEE')
                            };
                        }

                        scope.title = dateFilter(ctrl.activeDate, ctrl.formatDayTitle);
                        scope.rows = ctrl.split(days, 7);
                        if (scope.showWeeks) {
                            scope.weekNumbers = [];
                            var weekNumber = getISO8601WeekNumber(scope.rows[0][0].date),
                                numWeeks = scope.rows.length;
                            while (scope.weekNumbers.push(weekNumber++) < numWeeks) {
                            }
                        }
                    };

                    ctrl.compare = function (date1, date2) {
                        return (new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()) - new Date(date2.getFullYear(), date2.getMonth(), date2.getDate()) );
                    };

                    function getISO8601WeekNumber(date) {
                        var checkDate = new Date(date);
                        checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7)); // Thursday
                        var time = checkDate.getTime();
                        checkDate.setMonth(0); // Compare with Jan 1
                        checkDate.setDate(1);
                        return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
                    }

                    ctrl.handleKeyDown = function (key, evt) {
                        var date = ctrl.activeDate.getDate();

                        if (key === 'left') {
                            date = date - 1;   // up
                        } else if (key === 'up') {
                            date = date - 7;   // down
                        } else if (key === 'right') {
                            date = date + 1;   // down
                        } else if (key === 'down') {
                            date = date + 7;
                        } else if (key === 'pageup' || key === 'pagedown') {
                            var month = ctrl.activeDate.getMonth() + (key === 'pageup' ? -1 : 1);
                            ctrl.activeDate.setMonth(month, 1);
                            date = Math.min(getDaysInMonth(ctrl.activeDate.getFullYear(), ctrl.activeDate.getMonth()), date);
                        } else if (key === 'home') {
                            date = 1;
                        } else if (key === 'end') {
                            date = getDaysInMonth(ctrl.activeDate.getFullYear(), ctrl.activeDate.getMonth());
                        }
                        ctrl.activeDate.setDate(date);
                    };

                    ctrl.refreshView();
                }
            };
        }])
        .directive('monthpicker', ['dateFilter', function (dateFilter) {
            return {
                restrict: 'EA',
                replace: true,
                templateUrl: 'templates/datepicker/month.html',
                require: '^datepicker',
                link: function (scope, element, attrs, ctrl) {
                    ctrl.step = { years: 1 };
                    ctrl.element = element;

                    ctrl._refreshView = function () {
                        var months = new Array(12),
                            year = ctrl.activeDate.getFullYear();

                        for (var i = 0; i < 12; i++) {
                            months[i] = angular.extend(ctrl.createDateObject(new Date(year, i, 1), ctrl.formatMonth), {
                                uid: scope.uniqueId + '-' + i
                            });
                        }

                        scope.title = dateFilter(ctrl.activeDate, ctrl.formatMonthTitle);
                        scope.rows = ctrl.split(months, 3);
                    };

                    ctrl.compare = function (date1, date2) {
                        return new Date(date1.getFullYear(), date1.getMonth()) - new Date(date2.getFullYear(), date2.getMonth());
                    };

                    ctrl.handleKeyDown = function (key, evt) {
                        var date = ctrl.activeDate.getMonth();

                        if (key === 'left') {
                            date = date - 1;   // up
                        } else if (key === 'up') {
                            date = date - 3;   // down
                        } else if (key === 'right') {
                            date = date + 1;   // down
                        } else if (key === 'down') {
                            date = date + 3;
                        } else if (key === 'pageup' || key === 'pagedown') {
                            var year = ctrl.activeDate.getFullYear() + (key === 'pageup' ? -1 : 1);
                            ctrl.activeDate.setFullYear(year);
                        } else if (key === 'home') {
                            date = 0;
                        } else if (key === 'end') {
                            date = 11;
                        }
                        ctrl.activeDate.setMonth(date);
                    };

                    ctrl.refreshView();
                }
            };
        }])
        .directive('yearpicker', ['dateFilter', function (dateFilter) {
            return {
                restrict: 'EA',
                replace: true,
                templateUrl: 'templates/datepicker/year.html',
                require: '^datepicker',
                link: function (scope, element, attrs, ctrl) {
                    var range = ctrl.yearRange;

                    ctrl.step = { years: range };
                    ctrl.element = element;

                    function getStartingYear(year) {
                        return parseInt((year - 1) / range, 10) * range + 1;
                    }

                    ctrl._refreshView = function () {
                        var years = new Array(range);

                        for (var i = 0, start = getStartingYear(ctrl.activeDate.getFullYear()); i < range; i++) {
                            years[i] = angular.extend(ctrl.createDateObject(new Date(start + i, 0, 1), ctrl.formatYear), {
                                uid: scope.uniqueId + '-' + i
                            });
                        }

                        scope.title = [years[0].label, years[range - 1].label].join(' - ');
                        scope.rows = ctrl.split(years, 5);
                    };

                    ctrl.compare = function (date1, date2) {
                        return date1.getFullYear() - date2.getFullYear();
                    };

                    ctrl.handleKeyDown = function (key, evt) {
                        var date = ctrl.activeDate.getFullYear();

                        if (key === 'left') {
                            date = date - 1;   // up
                        } else if (key === 'up') {
                            date = date - 5;   // down
                        } else if (key === 'right') {
                            date = date + 1;   // down
                        } else if (key === 'down') {
                            date = date + 5;
                        } else if (key === 'pageup' || key === 'pagedown') {
                            date += (key === 'pageup' ? -1 : 1) * ctrl.step.years;
                        } else if (key === 'home') {
                            date = getStartingYear(ctrl.activeDate.getFullYear());
                        } else if (key === 'end') {
                            date = getStartingYear(ctrl.activeDate.getFullYear()) + range - 1;
                        }
                        ctrl.activeDate.setFullYear(date);
                    };

                    ctrl.refreshView();
                }
            };
        }])
        .constant('datepickerPopupConfig', {
            datepickerPopup: 'yyyy-MM-dd',
            currentText: 'Today',
            clearText: 'Clear',
            closeText: 'Done',
            closeOnDateSelection: true,
            appendToBody: false,
            showButtonBar: true
        })
        .directive('datepickerPopup', ['$compile', '$parse', '$document', '$position', 'dateFilter', 'dateParser', 'datepickerPopupConfig', '$translate',
            function ($compile, $parse, $document, $position, dateFilter, dateParser, datepickerPopupConfig, $translate) {
                return {
                    restrict: 'EA',
                    require: 'ngModel',
                    scope: {
                        isOpen: '=?',
                        currentText: '@',
                        clearText: '@',
                        closeText: '@',
                        dateDisabled: '&'
                    },
                    link: function (scope, element, attrs, ngModel) {
                        var dateFormat,
                            format = attrs.datepickerPopup.split(' ')[1],
                            closeOnDateSelection = angular.isDefined(attrs.closeOnDateSelection) ? scope.$parent.$eval(attrs.closeOnDateSelection) : datepickerPopupConfig.closeOnDateSelection,
                            appendToBody = angular.isDefined(attrs.datepickerAppendToBody) ? scope.$parent.$eval(attrs.datepickerAppendToBody) : datepickerPopupConfig.appendToBody;
                        scope.showButtonBar = angular.isDefined(attrs.showButtonBar) ? scope.$parent.$eval(attrs.showButtonBar) : datepickerPopupConfig.showButtonBar;

                        scope.getText = function (key) {
                            return scope[key + 'Text'] || datepickerPopupConfig[key + 'Text'];
                        };
                        if (format) {
                            format = format.toUpperCase();
                            scope.HH = format.indexOf('HH') >= 0;
                            scope.mm = format.indexOf('MM') >= 0;
                            scope.ss = format.indexOf('SS') >= 0;
                            // scope.ismeridian=true;
                        }
                        var _dataFormat=function(v){
                            var y = $translate.use();
                            switch (y) {
                                case 'en':
                                {
                                    return 'dd/MM/yyyy ' + (v.split(' ')[1] || '');
                                    break;
                                }
                                default:
                                {
                                    return v
                                    break;
                                }
                            }
                        }
                        dateFormat=_dataFormat(attrs.datepickerPopup);
                        attrs.$observe('datepickerPopup', function (value) {
                            dateFormat=_dataFormat(value) || datepickerPopupConfig.datepickerPopup;
                            ngModel.$render();
                        });

                        // popup element used to display calendar
                        var popupEl = angular.element('<div datepicker-popup-wrap><div datepicker></div></div>');
                        popupEl.attr({
                            'ng-model': 'date',
                            'ng-change': 'dateSelection()'
                        });

                        function cameltoDash(string) {
                            return string.replace(/([A-Z])/g, function ($1) {
                                return '-' + $1.toLowerCase();
                            });
                        }

                        // datepicker element
                        var datepickerEl = angular.element(popupEl.children()[0]);
                        if (attrs.datepickerOptions) {
                            angular.forEach(scope.$parent.$eval(attrs.datepickerOptions), function (value, option) {
                                datepickerEl.attr(cameltoDash(option), value);
                            });
                        }

                        angular.forEach(['minDate', 'maxDate'], function (key) {
                            if (attrs[key]) {
                                scope.$parent.$watch($parse(attrs[key]), function (value) {
                                    scope[key] = value;
                                });
                                datepickerEl.attr(cameltoDash(key), key);
                            }
                        });
                        if (attrs.dateDisabled) {
                            datepickerEl.attr('date-disabled', 'dateDisabled({ date: date, mode: mode })');
                        }

                        function parseDate(viewValue) {
                            // console.log(new Date(viewValue).Format('yyyy-MM-dd hh:mm:ss'));

                            if (!viewValue) {
                                ngModel.$setValidity('date', true);
                                return null;
                            } else if (angular.isDate(viewValue) && !isNaN(viewValue)) {
                                ngModel.$setValidity('date', true);
                                return viewValue;
                            } else if (angular.isString(viewValue)) {
                                var date = dateParser.parse(viewValue, dateFormat) || new Date(viewValue);
                                if (isNaN(date)) {
                                    ngModel.$setValidity('date', false);
                                    return undefined;
                                } else {
                                    ngModel.$setValidity('date', true);
                                    return date;
                                }
                            } else {
                                ngModel.$setValidity('date', false);
                                // console.log(ngModel);
                                return undefined;
                            }
                        }

                        ngModel.$parsers.unshift(parseDate);
                        // Inner change
                        scope.dateSelection = function (dt) {
                            if (angular.isDefined(dt)) {
                                scope.date = dt;
                            }
                            ngModel.$setViewValue(scope.date);
                            ngModel.$render();

                            if (closeOnDateSelection) {
                                scope.isOpen = false;
                                element[0].focus();
                            }
                        };

                        element.bind('input change keyup', function () {
                            scope.$apply(function () {
                                scope.date = ngModel.$modelValue;
                            });
                        });

                        // Outter change
                        ngModel.$render = function () {
                            // console.log(dateFormat);
                            var date = ngModel.$viewValue ? dateFilter(ngModel.$viewValue, dateFormat) : '';
                            // console.log(date);
                            element.val(date);
                            scope.date = parseDate(ngModel.$modelValue);

                        };

                        var documentClickBind = function (event) {
                            if (scope.isOpen && event.target !== element[0]) {
                                scope.$apply(function () {
                                    scope.isOpen = false;
                                });
                            }
                        };

                        var keydown = function (evt, noApply) {
                            scope.keydown(evt);
                        };
                        element.bind('keydown', keydown);

                        scope.keydown = function (evt) {
                            if (evt.which === 27) {
                                evt.preventDefault();
                                evt.stopPropagation();
                                scope.close();
                            } else if (evt.which === 40 && !scope.isOpen) {
                                scope.isOpen = true;
                            }
                        };

                        scope.$watch('isOpen', function (value) {
                            if (value) {
                                scope.$broadcast('datepicker.focus');
                                scope.position = appendToBody ? $position.offset(element) : $position.position(element);
                                scope.position.top = scope.position.top + element.prop('offsetHeight');

                                $document.bind('click', documentClickBind);
                            } else {
                                $document.unbind('click', documentClickBind);
                            }
                        });

                        scope.select = function (date) {
                            if (date === 'today') {
                                var today = new Date();
                                if (angular.isDate(ngModel.$modelValue)) {
                                    date = new Date(ngModel.$modelValue);
                                    date.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
                                } else {
                                    date = new Date(today.setHours(0, 0, 0, 0));
                                }
                            }
                            scope.dateSelection(date);
                        };

                        scope.close = function () {
                            scope.isOpen = false;
                            element[0].focus();
                        };
                        scope.miniTimeChange = function () {
                            scope.$$childHead.$$childHead.select(scope.date || new Date());
                        };
                        var $popup = $compile(popupEl)(scope);
                        if (appendToBody) {
                            $document.find('body').append($popup);
                        } else {
                            element.after($popup);
                        }

                        scope.$on('$destroy', function () {
                            $popup.remove();
                            element.unbind('keydown', keydown);
                            $document.unbind('click', documentClickBind);
                        });
                    }
                };
            }])
        .directive('datepickerPopupWrap', function () {
            return {
                restrict: 'EA',
                replace: true,
                transclude: true,
                templateUrl: 'templates/datepicker/popup.html',
                link: function (scope, element, attrs) {
                    element.bind('click', function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                    });
                }
            };
        });
    angular.module('ui.timepicker', [])
        .constant('timepickerConfig', {
            hourStep: 1,
            minuteStep: 1,
            secondStep: 1,
            showMeridian: true,
            meridians: null,
            readonlyInput: false,
            mousewheel: true
        })
        .controller('TimepickerController', ['$scope', '$attrs', '$parse', '$log', '$locale', 'timepickerConfig',
            function ($scope, $attrs, $parse, $log, $locale, timepickerConfig) {
                var selected = new Date(),
                    ngModelCtrl = { $setViewValue: angular.noop }, // nullModelCtrl
                    meridians = angular.isDefined($attrs.meridians) ? $scope.$parent.$eval($attrs.meridians) : timepickerConfig.meridians || $locale.DATETIME_FORMATS.AMPMS;

                this.init = function (ngModelCtrl_, inputs) {
                    ngModelCtrl = ngModelCtrl_;
                    ngModelCtrl.$render = this.render;

                    var hoursInputEl = inputs.eq(0),
                        minutesInputEl = inputs.eq(1),
                        secondsInputEl = inputs.eq(2);

                    var mousewheel = angular.isDefined($attrs.mousewheel) ? $scope.$parent.$eval($attrs.mousewheel) : timepickerConfig.mousewheel;
                    if (mousewheel) {
                        this.setupMousewheelEvents(hoursInputEl, minutesInputEl, secondsInputEl);
                    }

                    $scope.readonlyInput = angular.isDefined($attrs.readonlyInput) ? $scope.$parent.$eval($attrs.readonlyInput) : timepickerConfig.readonlyInput;
                    this.setupInputEvents(hoursInputEl, minutesInputEl, secondsInputEl);
                };

                var hourStep = timepickerConfig.hourStep;
                if ($attrs.hourStep) {
                    $scope.$parent.$watch($parse($attrs.hourStep), function (value) {
                        hourStep = parseInt(value, 10);
                    });
                }

                var minuteStep = timepickerConfig.minuteStep;
                if ($attrs.minuteStep) {
                    $scope.$parent.$watch($parse($attrs.minuteStep), function (value) {
                        minuteStep = parseInt(value, 10);
                    });
                }

                var secondStep = timepickerConfig.secondStep;
                if ($attrs.secondStep) {
                    $scope.$parent.$watch($parse($attrs.secondStep), function (value) {
                        secondStep = parseInt(value, 10);
                    });
                }

                // 12H / 24H mode
                $scope.showMeridian = timepickerConfig.showMeridian;
                if ($attrs.showMeridian) {
                    $scope.$parent.$watch($parse($attrs.showMeridian), function (value) {
                        $scope.showMeridian = !!value;

                        if (ngModelCtrl.$error.time) {
                            // Evaluate from template
                            var hours = getHoursFromTemplate(), minutes = getMinutesFromTemplate(), seconds = getSecondsFromTemplate();
                            if (angular.isDefined(hours) && angular.isDefined(minutes) && angular.isDefined(seconds)) {
                                selected.setHours(hours);
                                refresh();
                            }
                        } else {
                            updateTemplate();
                        }
                    });
                }

                // Get $scope.hours in 24H mode if valid
                function getHoursFromTemplate() {
                    var hours = parseInt($scope.hours, 10);
                    var valid = ( $scope.showMeridian ) ? (hours > 0 && hours < 13) : (hours >= 0 && hours < 24);
                    if (!valid) {
                        return undefined;
                    }

                    if ($scope.showMeridian) {
                        if (hours === 12) {
                            hours = 0;
                        }
                        if ($scope.meridian === meridians[1]) {
                            hours = hours + 12;
                        }
                    }
                    return hours;
                }

                function getMinutesFromTemplate() {
                    var minutes = parseInt($scope.minutes, 10);
                    return ( minutes >= 0 && minutes < 60 ) ? minutes : undefined;
                }

                function getSecondsFromTemplate() {
                    var seconds = parseInt($scope.seconds, 10);
                    return ( seconds >= 0 && seconds < 60 ) ? seconds : undefined;
                }

                function pad(value) {
                    return ( angular.isDefined(value) && value.toString().length < 2 ) ? '0' + value : value;
                }

                // Respond on mousewheel spin
                this.setupMousewheelEvents = function (hoursInputEl, minutesInputEl, secondsInputEl) {
                    var isScrollingUp = function (e) {
                        if (e.originalEvent) {
                            e = e.originalEvent;
                        }
                        //pick correct delta variable depending on event
                        var delta = (e.wheelDelta) ? e.wheelDelta : -e.deltaY;
                        return (e.detail || delta > 0);
                    };

                    hoursInputEl.bind('mousewheel wheel', function (e) {
                        $scope.$apply((isScrollingUp(e)) ? $scope.incrementHours() : $scope.decrementHours());
                        e.preventDefault();
                    });

                    minutesInputEl.bind('mousewheel wheel', function (e) {
                        $scope.$apply((isScrollingUp(e)) ? $scope.incrementMinutes() : $scope.decrementMinutes());
                        e.preventDefault();
                    });

                    secondsInputEl.bind('mousewheel wheel', function (e) {
                        $scope.$apply((isScrollingUp(e)) ? $scope.incrementSeconds() : $scope.decrementSeconds());
                        e.preventDefault();
                    });

                };

                this.setupInputEvents = function (hoursInputEl, minutesInputEl, secondsInputEl) {
                    if ($scope.readonlyInput) {
                        $scope.updateHours = angular.noop;
                        $scope.updateMinutes = angular.noop;
                        $scope.updateSeconds = angular.noop;
                        return;
                    }

                    var invalidate = function (invalidHours, invalidMinutes, invalidSeconds) {
                        ngModelCtrl.$setViewValue(null);
                        ngModelCtrl.$setValidity('time', false);
                        if (angular.isDefined(invalidHours)) {
                            $scope.invalidHours = invalidHours;
                        }
                        if (angular.isDefined(invalidMinutes)) {
                            $scope.invalidMinutes = invalidMinutes;
                        }
                        if (angular.isDefined(invalidSeconds)) {
                            $scope.invalidSeconds = invalidSeconds;
                        }
                    };

                    $scope.updateHours = function () {
                        var hours = getHoursFromTemplate();

                        if (angular.isDefined(hours)) {
                            selected.setHours(hours);
                            refresh('h');
                        } else {
                            invalidate(true);
                        }
                    };

                    hoursInputEl.bind('blur', function (e) {
                        if (!$scope.invalidHours && $scope.hours < 10) {
                            $scope.$apply(function () {
                                $scope.hours = pad($scope.hours);
                            });
                        }
                    });

                    $scope.updateMinutes = function () {
                        var minutes = getMinutesFromTemplate();

                        if (angular.isDefined(minutes)) {
                            selected.setMinutes(minutes);
                            refresh('m');
                        } else {
                            invalidate(undefined, true);
                        }
                    };

                    $scope.updateSeconds = function () {
                        var seconds = getSecondsFromTemplate();

                        if (angular.isDefined(seconds)) {
                            selected.setSeconds(seconds);
                            refresh('s');
                        } else {
                            invalidate(undefined, undefined, true);
                        }
                    };

                    minutesInputEl.bind('blur', function (e) {
                        if (!$scope.invalidMinutes && $scope.minutes < 10) {
                            $scope.$apply(function () {
                                $scope.minutes = pad($scope.minutes);
                            });
                        }
                    });

                    secondsInputEl.bind('blur', function (e) {
                        if (!$scope.invalidSeconds && $scope.seconds < 10) {
                            $scope.$apply(function () {
                                $scope.seconds = pad($scope.seconds);
                            });
                        }
                    });

                };

                this.render = function () {
                    var date = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;

                    if (isNaN(date)) {
                        ngModelCtrl.$setValidity('time', false);
                        $log.error('Timepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
                    } else {
                        if (date) {
                            selected = date;
                        }
                        makeValid();
                        updateTemplate();
                    }
                };

                // Call internally when we know that model is valid.
                function refresh(keyboardChange) {
                    makeValid();
                    ngModelCtrl.$setViewValue(new Date(selected));
                    updateTemplate(keyboardChange);
                }

                function makeValid() {
                    ngModelCtrl.$setValidity('time', true);
                    $scope.invalidHours = false;
                    $scope.invalidMinutes = false;
                    $scope.invalidSeconds = false;
                }

                function updateTemplate(keyboardChange) {
                    var hours = selected.getHours(), minutes = selected.getMinutes(), seconds = selected.getSeconds();

                    if ($scope.showMeridian) {
                        hours = ( hours === 0 || hours === 12 ) ? 12 : hours % 12; // Convert 24 to 12 hour system
                    }

                    $scope.hours = keyboardChange === 'h' ? hours : pad(hours);
                    $scope.minutes = keyboardChange === 'm' ? minutes : pad(minutes);
                    $scope.seconds = keyboardChange === 's' ? seconds : pad(seconds);
                    $scope.meridian = selected.getHours() < 12 ? meridians[0] : meridians[1];
                }

                function addMinutes(minutes) {
                    var dt = new Date(selected.getTime() + minutes * 60000);
                    selected.setHours(dt.getHours(), dt.getMinutes());
                    refresh();
                }

                function addSeconds(seconds) {
                    var dt = new Date(selected.getTime() + seconds * 1000);
                    selected.setHours(dt.getHours(), dt.getMinutes(), dt.getSeconds());
                    refresh();
                }

                $scope.incrementHours = function () {
                    addMinutes(hourStep * 60);
                };
                $scope.decrementHours = function () {
                    addMinutes(-hourStep * 60);
                };
                $scope.incrementMinutes = function () {
                    addMinutes(minuteStep);
                };
                $scope.decrementMinutes = function () {
                    addMinutes(-minuteStep);
                };
                $scope.incrementSeconds = function () {
                    addSeconds(secondStep);
                };
                $scope.decrementSeconds = function () {
                    addSeconds(-secondStep);
                };

                $scope.toggleMeridian = function () {
                    addMinutes(12 * 60 * (( selected.getHours() < 12 ) ? 1 : -1));
                };
            }])
        .directive('timepicker', function () {
            return {
                restrict: 'EA',
                require: ['timepicker', '?^ngModel'],
                controller: 'TimepickerController',
                replace: true,
                scope: {},
                templateUrl: 'templates/timepicker/timepicker.html',
                link: function (scope, element, attrs, ctrls) {
                    var timepickerCtrl = ctrls[0], ngModelCtrl = ctrls[1];

                    if (ngModelCtrl) {
                        timepickerCtrl.init(ngModelCtrl, element.find('input'));
                    }
                    if (attrs.inDatepicker) {
                        scope.inDatepicker = attrs.inDatepicker;
                        scope.HH = scope.$parent.HH;
                        scope.mm = scope.$parent.mm;
                        scope.ss = scope.$parent.ss;
                    }
                }
            };
        });
    /*一些通用的指令*/
    angular.module('ui.common', [])
        .filter('i18nDateFilter',['i18nDateFilter',function(i18nDateFilter){
            return function(inp,type){
                return i18nDateFilter(inp,type);
            }
        }])
        .factory('i18nDateFilter',['$translate',function($translate){
            var use=$translate.use();
            var format= {
                en: {
                    s: 'dd/MM/yy',
                    m: 'dd/MM/yyyy',
                    l: 'dd/MM/yyyy hh:mm:ss',
                    hm:'hh:mm',
                    hms:'hh:mm:ss'
                },
                zh_CN: {
                    s: 'yy-MM-dd',
                    m: 'yyyy-MM-dd',
                    l: 'yyyy-MM-dd hh:mm:ss',
                    hms:'hh:mm:ss'
                }
            };
            return function(inp,type){
                if(!inp)return '';
                if(!_.isDate(inp)){
                    inp=new Date(inp);
                }
                return inp.Format(format[use][type]);
            }
        }])
        .factory('$resizeGrid', ['$timeout', function ($timeout) {
            return function () {
                var promise;
                var arg = arguments;
                if (!arg.length)return;
                promise = $timeout(function () {
                    angular.forEach(arg, function (g) {
                        if (g) {
                            g.$gridServices.DomUtilityService.RebuildGrid(g.$gridScope, g.ngGrid);
                        }
                    });
                    $timeout.cancel(promise)
                }, 300)
            }
        }])
        .directive('commonGrid',['$compile','$translate','$timeout','$document',function($compile,$translate,$timeout,$document){
                return{
                    restrict:'EA',
                    replace:true,
                    scope:{
                        ngModel:'=',
                        data:'=',
                        gridScope:'=',
                        total:"=",
                        onPage:'&',
                        ngGridOptions:'=',
                        defaultSelect:'=?'
                    },
                    link:function(scope,elem,attrs){
                        var wc2=scope.$watchCollection('data',function(a){
                            scope.setPagingData(scope.data,scope.total);
                        });
                        scope.setPagingData = function (data,totalCount){
                            scope.gridData = data;
                            scope.totalServerItems = totalCount;
                            $timeout(function(){
                                var _scope = scope.gridOpts.$gridScope;
                                var pageSize=scope.gridOpts.pagingOptions.pageSize;
                                if (_scope) {
                                    var ngPager = _scope.ngPager;
                                    var op = ngPager.option;
                                    op.page = Math.ceil(totalCount / pageSize);
                                    if (op.page < op.current) {
                                        op.current = 1;
                                        scope.gridOpts.pagingOptions.currentPage = 1;//默认设置第一页
                                    }
                                    op.pageSize = pageSize;
                                    op.i18n = $translate.use();
                                    op.count = totalCount;
                                    ngPager._refreshPager();
                                }
                            });
                            if(data&&scope.gridOpts.primaryKey){
                                keepSelectState(data,scope.defaultSelect||[]);
                            }
                        };
                        var keepSelectState=function(data,add){
                            var key=scope.gridOpts.primaryKey;
                            console.log(add);
                            $timeout(function(){
                                for(var j=0;j<data.length;j++){
                                    for(var i=0;i<add.length;i++){
                                        if(data[j][key]===add[i][key]){
                                            console.log(data[j][key]+'==='+add[i][key]);
					    if(!_.where(scope.ngModel,data[j]).length){
                                                scope.ngModel.push(data[j]);
                                            }
                                            scope.gridOpts.selectItem(j,true,true);
                                        }
                                    }
                                }
                            },100);
                        };
                        if(scope.defaultSelect){

                            scope.ngModel=scope.defaultSelect;
                            console.log(scope.ngModel);
                        }
                        
                        var dw=scope.$watch(function(scope){
                            return scope.gridOpts.pagingOptions
                        }, function (newVal, oldVal){
                            if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
                                var param = {};
                                param.start = scope.gridOpts.pagingOptions.currentPage;
                                param.limit =10;
                                (scope.gridOpts.onPage||angular.noop)(param,scope);
                                (scope.onPage||angular.noop)({param:param,self:scope});
                            }
                        }, true);
                        var gridOpts={
                            data: 'gridData',
                            enablePaging: true,
                            showFooter: true,
                            multiSelect: false,
                            totalServerItems:'totalServerItems',
                            selectedItems:scope.ngModel,
                            pagingOptions:{
                                pageSize:10,
                                currentPage:1
                            }
                        };
                        scope.ngGridOptions.scope=scope;
                        scope.gridOpts=$.extend(gridOpts,scope.ngGridOptions||{});
                        if(scope.ngGridOptions.func){
                            for(var i in scope.ngGridOptions.func){
                                scope[i]=scope.ngGridOptions.func[i];
                            }
                        }
                        var grid=$compile('<div ng-grid="gridOpts"></div>')(scope);
                        elem.html(grid);
                        scope.$on('$destroy',function(){
                            dw();
                            wc2();
                        });
                    }
                }
        }])
        .directive('ngIcheck', [function () {
            return{
                restrict: 'A',
                link: function (scope, element, attrs) {
                    var t,
                        name = attrs.filterName,
                        defaultChecked = attrs.defaultChecked,
                        disableChecked = attrs.disableChecked,
                        checked,
                        checkbox,
                        scopeDeep = attrs.scopeDeep >> 0,
                        _scope = scope,
                        isMulti = !!attrs.multi;
                    var defChecked = function () {
                            var checkArr = $(element).find('.rs-square').not('.all'), checked = _scope[defaultChecked].split(',');
                            checkArr.removeClass('glyphicon-ok');
                            angular.forEach(checkArr, function (item) {
                                if (_.indexOf(checked, item.getAttribute('value')) >= 0) {
                                    $(item).addClass('glyphicon-ok');
                                }
                            });
                            scope[name] = _scope[defaultChecked];
                        },
                        disChecked = function () {
                            var checkArr = $(element).find('.rs-square'), dis = _scope[disableChecked].split(',');
                            var checked = _scope[name].split(',');
                            angular.forEach(checkArr, function (item) {
                                if (_.indexOf(dis, item.getAttribute('value')) >= 0) {
                                    $(item).addClass('rs-square-disable').removeClass('glyphicon-ok');
                                    checked = _.without(checked, item.getAttribute('value'));
                                } else {
                                    $(item).removeClass('rs-square-disable');
                                }
                            });
                            _scope[name] = checked.join(',');
                        };
                    scope[name] = '';
                    if (defaultChecked) {
                        var dW0=scope.$watch(defaultChecked, function (a, b) {
                            if (a != b) {
                                defChecked();
                            }
                        });
                    }
                    if (scope[defaultChecked]) {
                        defChecked();
                    }
                    if (disableChecked)
                        var dW1=scope.$watch(disableChecked, function (a, b) {
                            if (a != b) {
                                disChecked();
                            }
                        });
                    if (scope[disableChecked]) {
                        disChecked();
                    }
                    //fix
                    if (scopeDeep) {
                        while (scopeDeep--) {
                            _scope = scope.$parent;
                        }
                    }
                    element.on('click', function (e) {
                        t = $(e.target);
                        if (t.hasClass('rs-text')) {
                            t = t.prev();
                        }
                        if (t.hasClass('rs-square-disable'))return;
                        element.tmp = [];
                        if (t.hasClass('rs-square')) {
                            if (isMulti) {
                                if (t.hasClass('all')) {
                                    checkbox = t.parents('ul').find('.rs-square').not('.all');
                                    if (!t.hasClass('glyphicon-ok'))
                                        checkbox.addClass('glyphicon-ok');
                                    else {
                                        checkbox.removeClass('glyphicon-ok');
                                    }
                                }
                                t.toggleClass('glyphicon-ok');
                            }
                            checked = $(element).find('.glyphicon-ok').not('.all');
                            if (isMulti) {
                                checked.each(function () {
                                    element.tmp.push(this.getAttribute('value'));
                                });
                            } else {
                                checked.each(function () {
                                    if (this != t[0])
                                        $(this).removeClass('glyphicon-ok');
                                });
                                if (t.hasClass('glyphicon-ok')) {
                                    element.tmp = [];
                                } else {
                                    element.tmp.push(t[0].getAttribute('value'));
                                }
                                t.toggleClass('glyphicon-ok');
                            }
                            scope.$apply(function () {
                                _scope[name] = element.tmp.join(',');
                            });
                        }
                    });
                    scope.$on("$destroy",function() {
                        dW0&&dW0();
                        dW1&&dW1();
                        element.off('click');
                    });
                }
            };
        }])
        .directive('slidebar', ['$timeout', function ($timeout) {
            return{
                restrict: 'A',
                scope: {
                    onSlide: '&'
                },
                link: function (scope, elem, attrs) {
                    var tpl = $('<div class="am-slide-btn"></div>');
                    var timeout, bar, style;
                    elem.prepend(tpl);
                    var par = elem.parent();
                    bar = par.find('.am-sidebar');
                    style = bar[0].style;
                    elem.addClass('am-slide-bar');
                    tpl.click(function () {
                        if (par.hasClass('am-sidebar-show')) {//修复展开短暂出现滚动条问题
                            if (timeout) {
                                $timeout.cancel(timeout)
                            }
                            timeout = $timeout(function () {
                                style.height = '';
                                style.overflow = '';
                                $timeout.cancel(timeout);
                            }, 100);//与css动画一致
                        } else {
                            style.height = bar[0].offsetHeight + 'px';
                            style.overflow = "hidden";
                        }
                        par.toggleClass('am-sidebar-show');
                        if (scope.onSlide)
                            scope.onSlide();
                    });
                }
            }
        }])
        
        .directive('monthSelect', ['$compile', '$templateCache', function ($compile, $templateCache) {
            return{
                restrict: 'EA',
                require: ['?^tpl', '?^num', '?^ngModel'],
                scope: {
                    ngModel: '=',
                    num: '@',
                    tpl: '@'
                },
                compile: function () {
                    return {
                        pre: function (scope, elem) {
                            if (elem.children().length === 0) {
                                elem.append($compile($templateCache.get(scope.tpl + '.html'))(scope));
                            }
                        },
                        post: function (scope, elem, attr) {
                            var n = scope.num || 1,
                                select = function (self) {
                                    var sel,
                                        value = self.getAttribute('value'),
                                        arr = [];
                                    switch (value) {
                                        case 'L':
                                        {
                                            scope.selectAll(1);
                                            if ($(self).hasClass('active')) {
                                                arr = ['L'];
                                            }
                                            break
                                        }
                                        case 'T':
                                        {
                                            arr.push(scope.today);
                                        }
                                        default:
                                        {
                                            sel = elem.find('li.active');
                                            sel.each(function () {
                                                var value = this.getAttribute('value');
                                                if (value !== 'T' && value !== 'L') {
                                                    arr.push(+value);
                                                }
                                            });
                                            var filter = ['L'];
                                            if (value === 'T') {
                                                if ($(self).hasClass('active')) {
                                                    arr.push(scope.today)
                                                } else {
                                                    filter.push(scope.today)
                                                }
                                            }
                                            arr = _.difference(arr, filter);
                                        }
                                    };
                                    scope.ngModel = _.uniq(arr);
                                };
                            scope.items = function () {
                                var num = [], i = 1;
                                while (i <= n) {
                                    num.push(i);
                                    i++;
                                }
                                return num
                            }();
                            scope.selectAll = function (b) {
                                var a = ['addClass', 'removeClass'][b],
                                    el = elem.find('li.item'),
                                    arr = [];
                                el[a]('active');
                                if (b) {
                                    scope.ngModel = [];
                                } else {
                                    el.each(function () {
                                        arr.push(this.getAttribute('value'));
                                    });
                                    scope.ngModel = arr;
                                }
                            };
                            scope.compare = function (i) {
                                return _.find(scope.ngModel, function (num) {
                                    return num == i
                                })
                            };
                            elem.on('click', 'li', function () {
                                $(this).toggleClass('active');
                                select(this);
                                scope.$apply();
                            });
                            scope.today = function () {
                                var d = new Date().getDate();
                                return d;
                            }();
                            scope.$on("$destroy",function() {
                                elem.off('click');
                            });
                        }
                    }
                }
            }
        }])
        .directive('suggest',['$timeout',function($timeout){
            return {
                restrict: 'A',
                require:'?ngModel',
                scope:{
                    select:'&',
                    params:'='
                },
                link:function(scope, element, attrs,ngModel) {
                    var U=AM.util,asValue=attrs.asValue;
                    if(!scope.suggest){
                        scope.suggest=new AM.Suggest({
                            id:element,
                            params:scope.params,
                            url:attrs.url,
                            objParam:attrs.objParam,
                            realtime:+attrs.realtime,
                            max:10,
                            key:attrs.key,
                            selected:function(item,self){
                                if(scope.select){
                                    scope.$apply(function(){
                                        if(asValue){
                                            ngModel.$setViewValue(item[asValue]);
                                        }else{
                                            ngModel.$setViewValue(item);
                                        }
                                        scope.select({self:self,item:item});
                                    });
                                }
                            }
                        });
                    }
                    scope.$watch('ngModel',function(a){
                        console.log(a);
                        if(a===''){
                            element.val('');
                        }
                        $timeout(function(){
                            element.val(element.attr('isvalue'));
                        },200);
                    });
                }
            }
        }])
        ;
    angular.module('ui.collapse', ['ui.transition'])
        .directive('collapse', ['$transition', function ($transition) {
            return {
                link: function (scope, element, attrs) {
                    var initialAnimSkip = true;
                    var currentTransition;

                    function doTransition(change) {
                        var newTransition = $transition(element, change);
                        if (currentTransition) {
                            currentTransition.cancel();
                        }
                        currentTransition = newTransition;
                        newTransition.then(newTransitionDone, newTransitionDone);
                        return newTransition;

                        function newTransitionDone() {
                            // Make sure it's this transition, otherwise, leave it alone.
                            if (currentTransition === newTransition) {
                                currentTransition = undefined;
                            }
                        }
                    }

                    function expand() {
                        if (initialAnimSkip) {
                            initialAnimSkip = false;
                            expandDone();
                        } else {
                            element.removeClass('collapse').addClass('collapsing');
                            doTransition({ height: element[0].scrollHeight + 'px' }).then(expandDone);
                        }
                    }

                    function expandDone() {
                        element.removeClass('collapsing');
                        element.addClass('collapse in');
                        element.css({height: 'auto'});
                    }

                    function collapse() {
                        if (initialAnimSkip) {
                            initialAnimSkip = false;
                            collapseDone();
                            element.css({height: 0});
                        } else {
                            // CSS transitions don't work with height: auto, so we have to manually change the height to a specific value
                            element.css({ height: element[0].scrollHeight + 'px' });
                            //trigger reflow so a browser realizes that height was updated from auto to a specific value
                            var x = element[0].offsetWidth;

                            element.removeClass('collapse in').addClass('collapsing');

                            doTransition({ height: 0 }).then(collapseDone);
                        }
                    }

                    function collapseDone() {
                        element.removeClass('collapsing');
                        element.addClass('collapse');
                    }

                    scope.$watch(attrs.collapse, function (shouldCollapse) {
                        if (shouldCollapse) {
                            collapse();
                        } else {
                            expand();
                        }
                    });
                }
            };
        }]);
    angular.module('ui.bindHtml', [])
        .directive('bindHtmlUnsafe', ['$compile', function ($compile) {
            return function (scope, element, attr) {
                element.addClass('ng-binding').data('$binding', attr.bindHtmlUnsafe);
                scope.$watch(attr.bindHtmlUnsafe, function bindHtmlUnsafeWatchAction(value) {
                    element.html(value || '');
                    $compile(element.contents())(scope);
                });
            };
        }]);
    angular.module('ui.buttons', [])
        .constant('buttonConfig', {
            activeClass: 'active',
            toggleEvent: 'click'
        })
        .controller('ButtonsController', ['buttonConfig', function (buttonConfig) {
            this.activeClass = buttonConfig.activeClass || 'active';
            this.toggleEvent = buttonConfig.toggleEvent || 'click';
        }])
        .directive('btnRadio', function () {
            return {
                require: ['btnRadio', 'ngModel'],
                controller: 'ButtonsController',
                link: function (scope, element, attrs, ctrls) {
                    var buttonsCtrl = ctrls[0], ngModelCtrl = ctrls[1];
                    //model -> UI
                    ngModelCtrl.$render = function () {
                        element.toggleClass(buttonsCtrl.activeClass, angular.equals(ngModelCtrl.$modelValue, scope.$eval(attrs.btnRadio)));
                    };
                    //ui->model
                    element.bind(buttonsCtrl.toggleEvent, function () {
                        var isActive = element.hasClass(buttonsCtrl.activeClass);

                        if (!isActive || angular.isDefined(attrs.uncheckable)) {
                            scope.$apply(function () {
                                ngModelCtrl.$setViewValue(isActive ? null : scope.$eval(attrs.btnRadio));
                                ngModelCtrl.$render();
                            });
                        }
                    });
                }
            };
        })
        .directive('btnCheckbox', function () {
            return {
                require: ['btnCheckbox', 'ngModel'],
                controller: 'ButtonsController',
                link: function (scope, element, attrs, ctrls) {
                    var buttonsCtrl = ctrls[0], ngModelCtrl = ctrls[1];

                    function getTrueValue() {
                        return getCheckboxValue(attrs.btnCheckboxTrue, true);
                    }

                    function getFalseValue() {
                        return getCheckboxValue(attrs.btnCheckboxFalse, false);
                    }

                    function getCheckboxValue(attributeValue, defaultValue) {
                        var val = scope.$eval(attributeValue);
                        return angular.isDefined(val) ? val : defaultValue;
                    }

                    //model -> UI
                    ngModelCtrl.$render = function () {
                        element.toggleClass(buttonsCtrl.activeClass, angular.equals(ngModelCtrl.$modelValue, getTrueValue()));
                    };
                    //ui->model
                    element.bind(buttonsCtrl.toggleEvent, function () {
                        scope.$apply(function () {
                            ngModelCtrl.$setViewValue(element.hasClass(buttonsCtrl.activeClass) ? getFalseValue() : getTrueValue());
                            ngModelCtrl.$render();
                        });
                    });
                }
            };
        });
    angular.module('ui.tabs', [])
        .controller('TabsetController', ['$scope', function TabsetCtrl($scope) {
            var ctrl = this,
                tabs = ctrl.tabs = $scope.tabs = [];

            ctrl.select = function (selectedTab, elem) {
                var _index;
                angular.forEach(tabs, function (tab, index) {
                    if (tab.active && tab !== selectedTab) {
                        tab.active = false;
                        tab.onDeselect();
                    }
                    if (tab === selectedTab) {
                        _index = index;
                    }
                });
                selectedTab.active = true;
                selectedTab.onSelect({elem: elem, index: _index});
            };
            ctrl.addTab = function addTab(tab) {
                tabs.push(tab);
                // we can't run the select function on the first tab
                // since that would select it twice
                if (tabs.length === 1) {
                    tab.active = true;
                } else if (tab.active) {
                    ctrl.select(tab);
                }
            };

            ctrl.removeTab = function removeTab(tab) {
                var index = tabs.indexOf(tab);
                //Select a new tab if the tab to be removed is selected
                if (tab.active && tabs.length > 1) {
                    //If this is the last tab, select the previous tab. else, the next tab.
                    var newActiveIndex = index == tabs.length - 1 ? index - 1 : index + 1;
                    ctrl.select(tabs[newActiveIndex]);
                }
                tabs.splice(index, 1);
            };
        }])
        .directive('uiTabset', function () {
            return {
                restrict: 'EAC',
                transclude: true,
                replace: true,
                scope: {
                    type: '@',
                    selectedIndex: "="
                },
                controller: 'TabsetController',
                templateUrl: 'templates/tabs/tabset.html',
                link: function (scope, element, attrs) {
                    scope.vertical = angular.isDefined(attrs.vertical) ? scope.$parent.$eval(attrs.vertical) : false;
                    scope.justified = angular.isDefined(attrs.justified) ? scope.$parent.$eval(attrs.justified) : false;

                    scope.$watch('selectedIndex', function (selectedIndex) {
                        scope.tabs[selectedIndex] && scope.tabs[selectedIndex].select();
                    });
                }
            };
        })
        .directive('uiTab', ['$parse', function ($parse) {
            return {
                require: '^uiTabset',
                restrict: 'EA',
                replace: true,
                templateUrl: 'templates/tabs/tab.html',
                transclude: true,
                scope: {
                    active: '=?',
                    heading: '@',
                    onSelect: '&select', //This callback is called in contentHeadingTransclude
                    //once it inserts the tab's content into the dom
                    onDeselect: '&deselect'
                },
                controller: function () {
                    //Empty controller so other directives can require being 'under' a tab
                },
                compile: function (elm, attrs, transclude) {
                    return function postLink(scope, elm, attrs, tabsetCtrl) {
                        scope.$watch('active', function (active) {
                            if (active) {
                                tabsetCtrl.select(scope, elm);
                            }
                        });
                        scope.disabled = false;
                        if (attrs.disabled) {
                            scope.$parent.$watch($parse(attrs.disabled), function (value) {
                                scope.disabled = !!value;
                            });
                        }
                        scope.select = function () {
                            if (!scope.disabled) {
                                scope.active = true;
                            }
                        };
                        tabsetCtrl.addTab(scope);
                        scope.$on('$destroy', function () {
                            tabsetCtrl.removeTab(scope);
                        });
                        //We need to transclude later, once the content container is ready.
                        //when this link happens, we're inside a tab heading.
                        scope.$transcludeFn = transclude;
                    };
                }
            };
        }])
        .directive('tabHeadingTransclude', [function () {
            return {
                restrict: 'A',
                require: '^uiTab',
                link: function (scope, elm, attrs, tabCtrl) {
                    scope.$watch('headingElement', function updateHeadingElement(heading) {
                        if (heading) {
                            elm.html('');
                            elm.append(heading);
                        }
                    });
                }
            };
        }])
        .directive('tabContentTransclude', function () {
            return {
                restrict: 'A',
                require: '^uiTabset',
                link: function (scope, elm, attrs) {
                    var tab = scope.$eval(attrs.tabContentTransclude);
                    //Now our tab is ready to be transcluded: both the tab heading area
                    //and the tab content area are loaded.  Transclude 'em both.
                    tab.$transcludeFn(tab.$parent, function (contents) {
                        angular.forEach(contents, function (node) {
                            if (isTabHeading(node)) {
                                //Let tabHeadingTransclude know.
                                tab.headingElement = node;
                            } else {
                                elm.append(node);
                            }
                        });
                    });
                }
            };
            function isTabHeading(node) {
                return node.tagName && (
                    node.hasAttribute('tab-heading') ||
                    node.hasAttribute('data-tab-heading') ||
                    node.tagName.toLowerCase() === 'tab-heading' ||
                    node.tagName.toLowerCase() === 'data-tab-heading'
                    );
            }
        });
    angular.module('ui.dropdown', [])
        .constant('dropdownConfig', {
            openClass: 'open'
        })
        .service('dropdownService', ['$document', function ($document) {
            var openScope = null;

            this.open = function (dropdownScope) {
                if (!openScope) {
                    $document.bind('click', closeDropdown);
                    $document.bind('keydown', escapeKeyBind);
                }

                if (openScope && openScope !== dropdownScope) {
                    openScope.isOpen = false;
                }

                openScope = dropdownScope;
            };

            this.close = function (dropdownScope) {
                if (openScope === dropdownScope) {
                    openScope = null;
                    $document.unbind('click', closeDropdown);
                    $document.unbind('keydown', escapeKeyBind);
                }
            };

            var closeDropdown = function (evt) {
                if (evt && evt.isDefaultPrevented()) {
                    return;
                }

                openScope.$apply(function () {
                    openScope.isOpen = false;
                });
            };

            var escapeKeyBind = function (evt) {
                if (evt.which === 27) {
                    openScope.focusToggleElement();
                    closeDropdown();
                }
            };
        }])
        .controller('DropdownController', ['$scope', '$attrs', '$parse', 'dropdownConfig', 'dropdownService', '$animate',
            function ($scope, $attrs, $parse, dropdownConfig, dropdownService, $animate) {
                var self = this,
                    scope = $scope.$new(), // create a child scope so we are not polluting original one
                    openClass = dropdownConfig.openClass,
                    getIsOpen,
                    setIsOpen = angular.noop,
                    toggleInvoker = $attrs.onToggle ? $parse($attrs.onToggle) : angular.noop;

                this.init = function (element) {
                    self.$element = element;

                    if ($attrs.isOpen) {
                        getIsOpen = $parse($attrs.isOpen);
                        setIsOpen = getIsOpen.assign;

                        $scope.$watch(getIsOpen, function (value) {
                            scope.isOpen = !!value;
                        });
                    }
                };

                this.toggle = function (open) {
                    return scope.isOpen = arguments.length ? !!open : !scope.isOpen;
                };

                // Allow other directives to watch status
                this.isOpen = function () {
                    return scope.isOpen;
                };

                scope.focusToggleElement = function () {
                    if (self.toggleElement) {
                        self.toggleElement[0].focus();
                    }
                };

                scope.$watch('isOpen', function (isOpen, wasOpen) {
                    $animate[isOpen ? 'addClass' : 'removeClass'](self.$element, openClass);
                    if (isOpen) {
                        scope.focusToggleElement();
                        dropdownService.open(scope);
                    } else {
                        dropdownService.close(scope);
                    }

                    setIsOpen($scope, isOpen);
                    if (angular.isDefined(isOpen) && isOpen !== wasOpen) {
                        toggleInvoker($scope, { open: !!isOpen });
                    }
                });

                $scope.$on('$locationChangeSuccess', function () {
                    scope.isOpen = false;
                });

                $scope.$on('$destroy', function () {
                    scope.$destroy();
                });
            }])
        .directive('dropdown', function () {
            return {
                restrict: 'CA',
                controller: 'DropdownController',
                link: function (scope, element, attrs, dropdownCtrl) {
                    dropdownCtrl.init(element);
                }
            };
        })
        .directive('dropdownToggle', function () {
            return {
                restrict: 'CA',
                require: '?^dropdown',
                link: function (scope, element, attrs, dropdownCtrl) {
                    if (!dropdownCtrl) {
                        return;
                    }
                    dropdownCtrl.toggleElement = element;
                    var toggleDropdown = function (event) {
                        event.preventDefault();

                        if (!element.hasClass('disabled') && !attrs.disabled) {
                            scope.$apply(function () {
                                dropdownCtrl.toggle();
                            });
                        }
                    };
                    element.bind('click', toggleDropdown);
                    // WAI-ARIA
                    element.attr({ 'aria-haspopup': true, 'aria-expanded': false });
                    scope.$watch(dropdownCtrl.isOpen, function (isOpen) {
                        element.attr('aria-expanded', !!isOpen);
                    });
                    scope.$on('$destroy', function () {
                        element.unbind('click', toggleDropdown);
                    });
                }
            };
        })
        .directive('uiDropdown', function () {
            return {
                restrict: 'CA',
                require: '?^ngModel',
                templateUrl: 'templates/dropdown/dropdown.html',
                replace: true,
                scope: {
                    options: '=',
                    ngModel: '=',
                    disabled: '=',
                    onChange: '&'
                },
                link: function (scope, element, attrs) {
                    scope._obj = {};
                    scope.key = attrs.key;
                    scope.width = attrs.width;
                    scope.dropdown = +attrs.dropdown || 0;
                    var ngModel = attrs.ngModel;
                    if (!scope.key)return;
                    scope.ngModel = scope.options[0];
                    scope.itemClick = function (evt, obj) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        scope.status.isopen = !scope.status.isopen;
                        //if(!scope.dropdown)
                        scope.ngModel = obj;
                        if (scope.onChange) {
                            scope._obj[attrs.ngModel] = obj;
                        }
                    };
                    scope.$watch('_obj', function (a, b) {
                        if (a != b) {
                            scope.onChange(scope._obj);
                        }
                    }, true);
                }
            }
        })
        .directive('uiSelect', ['$filter', '$timeout','$translate', function ($filter, $timeout,$translate) {
            return {
                restrict: 'A',
                require: '?^ngModel',
                templateUrl: 'templates/dropdown/select.html',
                replace: true,
                scope: {
                    options: '=',
                    ngModel: '=',
                    title: '@',
                    disabled: '=',
                    onChange: '&',
                    onBeforeChange: '&',
                    onClose: '&'
                },
                link: function (scope, element, attrs) {
                    var _filter_;
                    var ngModelTemp;
                    scope._obj = {};
                    scope.key = attrs.key;
                    scope.filter = _filter_ = attrs.filter;
                    scope.asValue = attrs.asValue;
                    scope.width = attrs.width;
                    scope.max = +attrs.max || 10;
                    scope.multi = +attrs.multi || 0;
                    scope.lineHeight = +attrs.lineHeight || 24.3;
                    scope.isDropdown = +attrs.isDropdown || 0;
                    scope.position = function () {
                        var pos = attrs.position, sp;
                        if (pos) {
                            sp = pos.split('|');
                            if (sp.length > 1) {
                                if (sp[1] === 'right')
                                    return sp;
                                else [sp[0]]
                            }
                            return pos ? [pos] : ''
                        }
                    }();
                    scope.optionsFilter = function () {
                        var obj = {};
                        if (!_filter_) return scope.options;
                        obj[scope.key] = scope._filterText_;
                        return $filter('filter')(scope.options, obj);
                    };
                    scope['default'] = function () {
                        var obj = {};
                        if (attrs['default']) {
                            if (scope.asValue) {
                                return attrs['default']
                            }
                            return obj[scope.key] = attrs['default'];
                        }
                        return ''
                    }();
                    scope.addDefault = function () {
                        var obj = {};
                        obj[scope.key] = scope['default'];
                        obj[scope.asValue || 'value'] =attrs.all?attrs.all:'';
                        return obj
                    };
                    if (!scope.key)return;
                    scope.isopen = +attrs.isOpened || false;

                    var setValue = function (obj) {
                        if (scope.multi) {
                            if (_.where(scope.ngModel, obj).length) {
                                scope.ngModel = _.filter(scope.ngModel, function (it) {
                                    return it[scope.key] != obj[scope.key]
                                });
                            } else {
                                scope.ngModel.push(obj);
                            }
                            scope._obj[attrs.ngModel] = scope.ngModel;
                        } else {
                            if (scope.asValue) {
                                scope._ngModel = [obj];
                                scope.ngModel = obj[scope.asValue];
                            } else {
                                scope.ngModel = obj;
                            }
                            if (scope.isDropdown) {
                                scope._onChange(_.object([
                                    [attrs.ngModel, scope.asValue ? obj[scope.asValue] : obj]
                                ]));
                            } else {
                                scope._obj[attrs.ngModel] = obj;
                            }
                            scope.isopen = 0;
                        }
                    };
                    scope.itemClick = function (evt, obj) {
                        if (evt.target.tagName !== 'INPUT')
                            evt.preventDefault();
                        evt.stopPropagation();
                        ngModelTemp = scope.ngModel;

                        if (attrs.onBeforeChange) {
                            scope.ngModel = obj;
                            $timeout(function () {
                                if (!scope._onBeforeChange()) {
                                    scope.ngModel = ngModelTemp;
                                    scope.isopen = 0;
                                } else {
                                    setValue(obj);
                                }
                            });
                        } else {
                            setValue(obj);
                        }
                        if (scope.filter) {
                            scope._filterText_ = '';
                        }
                    };
                    scope.isChecked = function (item) {
                        delete item.$$hashKey;
                        return _.where(scope.ngModel, item).length;
                    };
                    scope.asValueHandler = function () {
                        var f;
                        if (scope.asValue && typeof scope.ngModel !== 'object') {
                            f = _.filter(scope.options || [], function (item) {
                                if(item[scope.asValue]!=='')
                                return item[scope.asValue] == scope.ngModel
                            });
                            return f.length ? f : (attrs.all?[attrs.all]:['']);
                        }
                        return attrs.all?[attrs.all]:[''];
                    };
                    scope.getNgModel = function () {
                        var a = scope._ngModel[0][scope.asValue],
                            b = scope['default'],
                            c = scope.options[0],
                            d = scope.ngModel;
                        if (scope.asValue) {
                            if (a) {
                                return a
                            } else if (b) {
                                scope._ngModel = [b];
                                return b[scope.asValue] || ''
                            } else {
                                return c[scope.asValue]
                            }
                        } else {
                            return d || b || c || {};
                        }
                    };
                    scope.setMenuStyle = function () {
                        if (scope.options && scope.max && scope.options.length > scope.max) {
                            scope.menuStyle = {'height': scope.lineHeight * scope.max - scope.max + 1, 'overflow-y': 'auto'}
                        }
                    };
                    scope.ngModel=attrs.all||scope.ngModel;
                    scope._ngModel = scope.asValueHandler();
                    if (!scope.multi) {
                        if (scope.options && scope.options.length) {
                            scope.ngModel = scope.getNgModel();
                            if (!scope._first && scope['default'] && scope.options[0][scope.asValue || 'value']) {
                                scope.options.unshift(scope.addDefault());
                                scope._first = 1;
                            }
                        }
                    } else {
                        scope.ngModel = scope._ngModel[0][scope.asValue]|| scope.ngModel || [];
                    }
                    scope.setMenuStyle();
                    scope._onChange = function (obj) {
                        if (scope.onChange) {
                            // console.log(obj || scope._obj);
                            scope.onChange(obj || scope._obj);
                        }
                    };
                    scope._onBeforeChange = function (obj) {
                        return scope.onBeforeChange(obj || scope._obj);
                    };

                    var dw0=scope.$watch('ngModel', function (a, b) {
                        if (a != b) {
                            $timeout(function(){
                                scope._ngModel = scope.asValueHandler();
                            });
                        }
                    }, true);
                    
                    var dw1=scope.$watch('options', function (a, b) {
                        if (a != b) {
                            if (!a || a.length === 0)return;//(attrs.all?(scope.options[0][scope.asValue || 'value']!=attrs.all):scope.options[0][scope.asValue || 'value']))
                            var opV=scope.options[0][scope.asValue || 'value'];
                            if (!scope.multi && scope['default'] && (attrs.all?(opV!=attrs.all):opV)) {
                                scope.options.unshift(scope.addDefault());
                            }
                            if (!scope.multi) {
                                scope._ngModel = scope.asValueHandler();
                                scope.ngModel = scope.getNgModel();
                            }
                            scope.setMenuStyle();
                        }
                    }, true);
                    var dw2=scope.$watch('_obj', function (a, b) {
                        if (a != b) {
                            scope._onChange();
                        }
                    }, true);
                    var dw3=scope.$watch('isopen', function (a, b) {
                        if (a != b) {
                            if (!a && scope.onClose) {
                                scope.onClose(scope._obj);
                            }
                        }
                    });
                    scope.$on('$destroy',function (){
                        dw0();
                        dw1();
                        dw2();
                        dw3();
                        element.remove();
                    });
                }
            }
        }]);
    angular.module('ui.tooltip', [ 'ui.position', 'ui.bindHtml' ])
        .provider('$tooltip', function () {
            // The default options tooltip and popover.
            var defaultOptions = {
                placement: 'top',
                animation: true,
                popupDelay: 0
            };

            // Default hide triggers for each show trigger
            var triggerMap = {
                'mouseenter': 'mouseleave',
                'click': 'click',
                'focus': 'blur'
            };

            // The options specified to the provider globally.
            var globalOptions = {};

            this.options = function (value) {
                angular.extend(globalOptions, value);
            };
            this.setTriggers = function setTriggers(triggers) {
                angular.extend(triggerMap, triggers);
            };
            function snake_case(name) {
                var regexp = /[A-Z]/g;
                var separator = '-';
                return name.replace(regexp, function (letter, pos) {
                    return (pos ? separator : '') + letter.toLowerCase();
                });
            }

            /**
             * Returns the actual instance of the $tooltip service.
             * TODO support multiple triggers
             */
            this.$get = [ '$window', '$compile', '$timeout', '$parse', '$document', '$position', '$interpolate', function ($window, $compile, $timeout, $parse, $document, $position, $interpolate) {
                return function $tooltip(type, prefix, defaultTriggerShow) {
                    var options = angular.extend({}, defaultOptions, globalOptions);

                    function getTriggers(trigger) {
                        var show = trigger || options.trigger || defaultTriggerShow;
                        var hide = triggerMap[show] || show;
                        return {
                            show: show,
                            hide: hide
                        };
                    }

                    var directiveName = snake_case(type);

                    var startSym = $interpolate.startSymbol();
                    var endSym = $interpolate.endSymbol();
                    var template =
                        '<div ' + directiveName + '-popup ' +
                        'title="' + startSym + 'tt_title' + endSym + '" ' +
                        'content="' + startSym + 'tt_content' + endSym + '" ' +
                        'placement="' + startSym + 'tt_placement' + endSym + '" ' +
                        'animation="tt_animation" ' +
                        'is-open="tt_isOpen"' +
                        '>' +
                        '</div>';

                    return {
                        restrict: 'EA',
                        scope: true,
                        compile: function (tElem, tAttrs) {
                            var tooltipLinker = $compile(template);

                            return function link(scope, element, attrs) {
                                var tooltip;
                                var transitionTimeout;
                                var popupTimeout;
                                var appendToBody = angular.isDefined(options.appendToBody) ? options.appendToBody : false;
                                var triggers = getTriggers(undefined);
                                var hasEnableExp = angular.isDefined(attrs[prefix + 'Enable']);

                                var positionTooltip = function () {

                                    var ttPosition = $position.positionElements(element, tooltip, scope.tt_placement, appendToBody);
                                    ttPosition.top += 'px';
                                    ttPosition.left += 'px';

                                    // Now set the calculated positioning.
                                    tooltip.css(ttPosition);
                                };

                                // By default, the tooltip is not open.
                                // TODO add ability to start tooltip opened
                                scope.tt_isOpen = false;

                                function toggleTooltipBind() {
                                    if (!scope.tt_isOpen) {
                                        showTooltipBind();
                                    } else {
                                        hideTooltipBind();
                                    }
                                }

                                // Show the tooltip with delay if specified, otherwise show it immediately
                                function showTooltipBind() {
                                    if (hasEnableExp && !scope.$eval(attrs[prefix + 'Enable'])) {
                                        return;
                                    }
                                    if (scope.tt_popupDelay) {
                                        // Do nothing if the tooltip was already scheduled to pop-up.
                                        // This happens if show is triggered multiple times before any hide is triggered.
                                        if (!popupTimeout) {
                                            popupTimeout = $timeout(show, scope.tt_popupDelay, false);
                                            popupTimeout.then(function (reposition) {
                                                reposition();
                                            });
                                        }
                                    } else {
                                        show()();
                                    }
                                }

                                function hideTooltipBind() {
                                    scope.$apply(function () {
                                        hide();
                                    });
                                }

                                // Show the tooltip popup element.
                                function show() {

                                    popupTimeout = null;

                                    // If there is a pending remove transition, we must cancel it, lest the
                                    // tooltip be mysteriously removed.
                                    if (transitionTimeout) {
                                        $timeout.cancel(transitionTimeout);
                                        transitionTimeout = null;
                                    }

                                    // Don't show empty tooltips.
                                    if (!scope.tt_content) {
                                        return angular.noop;
                                    }

                                    createTooltip();

                                    // Set the initial positioning.
                                    tooltip.css({ top: 0, left: 0, display: 'block' });

                                    // Now we add it to the DOM because need some info about it. But it's not
                                    // visible yet anyway.
                                    if (appendToBody) {
                                        $document.find('body').append(tooltip);
                                    } else {
                                        element.after(tooltip);
                                    }

                                    positionTooltip();

                                    // And show the tooltip.
                                    scope.tt_isOpen = true;
                                    scope.$digest(); // digest required as $apply is not called

                                    // Return positioning function as promise callback for correct
                                    // positioning after draw.
                                    return positionTooltip;
                                }

                                // Hide the tooltip popup element.
                                function hide() {
                                    // First things first: we don't show it anymore.
                                    scope.tt_isOpen = false;

                                    //if tooltip is going to be shown after delay, we must cancel this
                                    $timeout.cancel(popupTimeout);
                                    popupTimeout = null;

                                    // And now we remove it from the DOM. However, if we have animation, we
                                    // need to wait for it to expire beforehand.
                                    // FIXME: this is a placeholder for a port of the transitions library.
                                    if (scope.tt_animation) {
                                        if (!transitionTimeout) {
                                            transitionTimeout = $timeout(removeTooltip, 500);
                                        }
                                    } else {
                                        removeTooltip();
                                    }
                                }

                                function createTooltip() {
                                    // There can only be one tooltip element per directive shown at once.
                                    if (tooltip) {
                                        removeTooltip();
                                    }
                                    tooltip = tooltipLinker(scope, function () {
                                    });

                                    // Get contents rendered into the tooltip
                                    scope.$digest();
                                }

                                function removeTooltip() {
                                    transitionTimeout = null;
                                    if (tooltip) {
                                        tooltip.remove();
                                        tooltip = null;
                                    }
                                }

                                /**
                                 * Observe the relevant attributes.
                                 */
                                attrs.$observe(type, function (val) {
                                    scope.tt_content = val;

                                    if (!val && scope.tt_isOpen) {
                                        hide();
                                    }
                                });

                                attrs.$observe(prefix + 'Title', function (val) {
                                    scope.tt_title = val;
                                });

                                attrs.$observe(prefix + 'Placement', function (val) {
                                    scope.tt_placement = angular.isDefined(val) ? val : options.placement;
                                });

                                attrs.$observe(prefix + 'PopupDelay', function (val) {
                                    var delay = parseInt(val, 10);
                                    scope.tt_popupDelay = !isNaN(delay) ? delay : options.popupDelay;
                                });

                                var unregisterTriggers = function () {
                                    element.unbind(triggers.show, showTooltipBind);
                                    element.unbind(triggers.hide, hideTooltipBind);
                                };

                                attrs.$observe(prefix + 'Trigger', function (val) {
                                    unregisterTriggers();

                                    triggers = getTriggers(val);

                                    if (triggers.show === triggers.hide) {
                                        element.bind(triggers.show, toggleTooltipBind);
                                    } else {
                                        element.bind(triggers.show, showTooltipBind);
                                        element.bind(triggers.hide, hideTooltipBind);
                                    }
                                });

                                var animation = scope.$eval(attrs[prefix + 'Animation']);
                                scope.tt_animation = angular.isDefined(animation) ? !!animation : options.animation;

                                attrs.$observe(prefix + 'AppendToBody', function (val) {
                                    appendToBody = angular.isDefined(val) ? $parse(val)(scope) : appendToBody;
                                });

                                // if a tooltip is attached to <body> we need to remove it on
                                // location change as its parent scope will probably not be destroyed
                                // by the change.
                                if (appendToBody) {
                                    scope.$on('$locationChangeSuccess', function closeTooltipOnLocationChangeSuccess() {
                                        if (scope.tt_isOpen) {
                                            hide();
                                        }
                                    });
                                }

                                // Make sure tooltip is destroyed and removed.
                                scope.$on('$destroy', function onDestroyTooltip() {
                                    $timeout.cancel(transitionTimeout);
                                    $timeout.cancel(popupTimeout);
                                    unregisterTriggers();
                                    //removeTooltip();
                                });
                            };
                        }
                    };
                };
            }];
        })
        .directive('tooltipPopup', function () {
            return {
                restrict: 'EA',
                replace: true,
                scope: { content: '@', placement: '@', animation: '&', isOpen: '&' },
                templateUrl: 'templates/tooltip/tooltip-popup.html'
            };
        })
        .directive('tooltip', [ '$tooltip', function ($tooltip) {
            return $tooltip('tooltip', 'tooltip', 'mouseenter');
        }])
        .directive('tooltipHtmlUnsafePopup', function () {
            return {
                restrict: 'EA',
                replace: true,
                scope: { content: '@', placement: '@', animation: '&', isOpen: '&' },
                templateUrl: 'templates/tooltip/tooltip-html-unsafe-popup.html'
            };
        })
        .directive('tooltipHtmlUnsafe', [ '$tooltip', function ($tooltip) {
            return $tooltip('tooltipHtmlUnsafe', 'tooltip', 'mouseenter');
        }]);
    angular.module('ui.loading', [])
        .factory('Tracker', ['$timeout', '$q', function ($timeout, $q) {
            return function () {
                var tracker = {};
                tracker.promises = [];
                tracker.delayPromise = null;
                tracker.durationPromise = null;
                tracker.delayJustFinished = false;
                tracker.reset = function (options) {
                    tracker.minDuration = options.minDuration;
                    tracker.promises = [];
                    angular.forEach(options.promises, function (p) {
                        if (!p || p.$uiLoadFulfilled) {
                            return;
                        }
                        addPromiseLikeThing(p);
                    });
                    if (tracker.promises.length === 0) {
                        //if we have no promises then dont do the delay or duration stuff
                        return;
                    }
                    tracker.delayJustFinished = false;
                    if (options.delay) {
                        tracker.delayPromise = $timeout(function () {
                            tracker.delayPromise = null;
                            tracker.delayJustFinished = true;
                        }, parseInt(options.delay, 10));
                    }
                    if (options.minDuration) {
                        tracker.durationPromise = $timeout(function () {
                            tracker.durationPromise = null;
                        }, parseInt(options.minDuration, 10) + (options.delay ? parseInt(options.delay, 10) : 0));
                    }
                };
                tracker.getThen = function (promise) {
                    var then = promise && (promise.then || promise.$then ||
                        (promise.$promise && promise.$promise.then));

                    if (promise.denodeify) {
                        return $q.when(promise).then;
                    }
                    return then;
                };
                var addPromiseLikeThing = function (promise) {
                    var then = tracker.getThen(promise);
                    if (!then) {
                        throw new Error('uiLoad expects a promise (or something that has a .promise or .$promise');
                    }
                    if (tracker.promises.indexOf(promise) !== -1) {
                        return;
                    }
                    tracker.promises.push(promise);
                    then(function () {
                        promise.$uiLoadFulfilled = true;
                        if (tracker.promises.indexOf(promise) === -1) {
                            return;
                        }
                        tracker.promises.splice(tracker.promises.indexOf(promise), 1);
                    }, function () {
                        promise.$uiLoadFulfilled = true;
                        if (tracker.promises.indexOf(promise) === -1) {
                            return;
                        }
                        tracker.promises.splice(tracker.promises.indexOf(promise), 1);
                    });
                };
                tracker.active = function () {
                    if (tracker.delayPromise) {
                        return false;
                    }
                    if (!tracker.delayJustFinished) {
                        if (tracker.durationPromise) {
                            return true;
                        }
                        return tracker.promises.length > 0;
                    } else {
                        //if both delay and min duration are set, 
                        //we don't want to initiate the min duration if the 
                        //promise finished before the delay was complete
                        tracker.delayJustFinished = false;
                        return tracker.promises.length > 0;
                    }
                };
                return tracker;
            };
        }])
        .directive('uiLoading', ['$compile', '$templateCache', '$http', 'Tracker', '$translate', function ($compile, $templateCache, $http, Tracker, $translate) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    element.css('position', 'relative');
                    var templateElement;
                    var backdropElement;
                    var currentTemplate;
                    var templateScope;
                    var backdrop;
                    var tracker = Tracker();
                    var defaults = {
                        templateUrl: 'ui-loading.html',
                        delay: 0,
                        minDuration: 0,
                        backdrop: false,
                        message: $translate.instant('LOADING')
                    };
                    scope.$watchCollection(attrs.options, function (options) {
                        if (!options) {
                            options = {promise: null};
                        }
                        //is it an array (of promises) or one promise
                        if (angular.isArray(options) || tracker.getThen(options)) {
                            options = {promise: options};
                        }
                        options = angular.extend(angular.copy(defaults), options);
                        if (!options.templateUrl) {
                            options.templateUrl = defaults.templateUrl;
                        }
                        if (!angular.isArray(options.promise)) {
                            options.promise = [options.promise];
                        }
                        if (!templateScope) {
                            templateScope = scope.$new();
                        }
                        templateScope.$message = options.message;
                        if (!angular.equals(tracker.promises, options.promise)) {
                            tracker.reset({
                                promises: options.promise,
                                delay: options.delay,
                                minDuration: options.minDuration
                            });
                        }
                        templateScope.$uiLoadIsActive = function () {
                            return tracker.active();
                        };
                        if (!templateElement || currentTemplate !== options.templateUrl || backdrop !== options.backdrop) {
                            if (templateElement) {
                                templateElement.remove();
                            }
                            if (backdropElement) {
                                backdropElement.remove();
                            }
                            currentTemplate = options.templateUrl;
                            backdrop = options.backdrop;
                            $http.get(currentTemplate, {cache: $templateCache}).success(function (indicatorTemplate) {
                                options.backdrop = typeof options.backdrop === 'undefined' ? true : options.backdrop;
                                if (options.backdrop) {
                                    var backdrop = '<div class="ui-loading-backdrop ui-loading-backdrop-animation ng-hide" ng-show="$uiLoadIsActive()"></div>';
                                    backdropElement = $compile(backdrop)(templateScope);
                                    element.append(backdropElement);
                                }
                                var template = '<div class="ui-loading ui-loading-animation ng-hide" ng-show="$uiLoadIsActive()">' + indicatorTemplate + '</div>';
                                templateElement = $compile(template)(templateScope);
                                element.append(templateElement);
                            });
                        }
                    }, true);
                }
            };
        }]);
    angular.module('ui.edit',[])
        .factory('ete',[function(){
            var addBlur=function(elem,callback,scope){
                elem.on('blur',function(){
                    scope.$apply(function(){
                        callback();
                    })
                });
            },
            addSelectBlur=function(doc,callback,scope){
                doc.on('click',function(){
                    scope.$apply(function(){
                        callback();
                    })
                });
            },
            selectText=function (a,f,j){
                try{
                    a.focus();
                    if (document.createRange) a.setSelectionRange(f,j);
                    else {
                        a = a.createTextRange();
                        a.collapse(1);
                        a.moveStart("character", f);
                        a.moveEnd("character", j - f);
                        a.select();
                    }
                } catch (b) {}
            },
            tempSelect=[],
            removeSelectBlur=function(doc){
                doc.off('click');
            },
            removeBlur=function(elem){
                elem.off('blur');
            };
            return{
                addBlurEvt:addBlur,
                addSelectEvt:addSelectBlur,
                selectTextEvt:selectText,
                removeBlurEvt:removeBlur,
                tempSelect:tempSelect,
                removeSelectBlur:removeSelectBlur
            }
        }])
        .directive('editText',['$compile','$templateCache','ete','$timeout','$document',function($compile,$templateCache,ete,$timeout,$document){
            return{
                restrict:'EA',
                require:'?ngModel',
                replace:true,
                template:'<div class="ui-edit-wrap"><span class="ui-edit-text" ng-hide="isHideText">{{text}}</span></div>',
                scope:{
                    ngModel:'=',
                    type:'@',
                    onFinish:'&',
                    selectOptions:'=?',//select数据
                    selectOnChange:'&'//select回调
                },
                compile: function() {
                    return {
                        post:function(scope,elem,attrs){
                            var ops=['readonly','max','inputClass',
                                    'hasEdit','hasDel',
                                    'selectAsValue','selectKey','selectPosition','selectWidth'],
                                editing=0,
                                input,
                                reg=/#([\s\S]+?)#/g,
                                timeout,
                                clickTimeout,
                                tmpScope,
                                type=scope.type,
                                isSelect=type==='select',
                                typeArr=['input','textarea','select'],
                                onFinish=function(){//结束编辑 通知回调
                                    clearInput();
                                    if(scope.ngModel&&elem.temp!==scope.ngModel){//避免空值或重复值 触发
                                        scope.onFinish({scope:scope});
                                    }
                                },
                                handler=function(evt){//点击处理
                                    if(isSelect&&ete.tempSelect.length<2 && (ete.tempSelect[0]===input)){//单独对select作处理
                                        evt.stopPropagation();
                                    }
                                    if(editing)return;
                                    clickTimeout=$timeout(function(){
                                        editing=1;
                                        renderInput();
                                    },0);
                                },
                                renderInput=function(f){//渲染input和开启相关状态和事件的绑定
                                    var val=scope.ngModel||'';
                                    scope.isHideText=true;
                                    if(!input){
                                        tmpScope=scope.$new();
                                        input=$compile($templateCache.get('ui-edit-'+type+'.html'))(tmpScope);
                                        elem.append(input);
                                        if(isSelect){
                                            ete.tempSelect.push(input);
                                        }
                                    }
                                    editing=1;
                                    if(!isSelect){
                                        ete.addBlurEvt(input,onFinish,scope);
                                    }else{
                                        ete.addSelectEvt($document,onFinish,scope);
                                    }
                                    if(f || isSelect)return;//避免初次加载就获得焦点
                                    timeout=$timeout(function(){
                                        ete.selectTextEvt(input[0],0,val.length);
                                    });
                                },
                                clearInput=function(a){//赋值和关闭状态和解绑事件
                                    if(!input||!editing)return;
                                    if(!isSelect){
                                        var val=input.val().trim();
                                        if(val===''){
                                            return;
                                        }
                                        ete.removeBlurEvt(input);
                                        $timeout.cancel(timeout);
                                        scope.ngModel=val;
                                    }else{
                                        ete.removeSelectBlur($document);
                                        ete.tempSelect.length=0;
                                    }
                                    $timeout.cancel(clickTimeout);
                                    scope.isHideText=false;
                                    editing=0;
                                    tmpScope.$destroy();
                                    input.remove();
                                    input=null;
                                },
                                getObjByValue=function(value){
                                    var obj={};
                                    obj[scope.selectAsValue]=value;
                                    return _.where(scope.selectOptions,obj)[0];
                                },
                                fillInput=function(a){//切换到文本状态
                                    if(isSelect){
                                        if(scope.selectAsValue){
                                            scope.text=getObjByValue(a)[scope.selectKey];
                                        }else{
                                            scope.text=a[scope.selectKey];
                                        }
                                        scope.selectNgModel.ngModel=a;
                                    }else{
                                        if(attrs.extraValue){
                                            a=a+attrs.extraValue;
                                        }
                                        scope.text=a;
                                    }
                                    elem.temp=a;
                                    clearInput();
                                },
                                onchange=function(a,b){//检测每次编辑完成之后 并处理相应动作
                                    if(a===undefined || (!isSelect&&a.trim()==='')){
                                        renderInput(1);
                                    }else{
                                        fillInput(a);
                                    }
                                };
                            if(type&&typeArr.indexOf(type)<0){//检查传入的类型
                                // console.log('type not found!');
                                return;
                            }
                            type=type||typeArr[0];//默认为input类型
                            for(var i in attrs){//统一把设置的数据挂载到scope上
                                if(ops.indexOf(i)>=0){
                                    scope[i]=attrs[i];
                                }
                            }
                            if(scope.max){//input textarea字符限制
                                scope.max='maxlength="'+scope.max+'"';
                            }
                            if(!scope.readonly){//只读 不绑定相关事件 与普通文本效果一样
                                elem.on('click',handler);
                            }
                            if(attrs.editText){//对父级公开方法
                                scope.$parent[attrs.editText]=scope;
                                scope.handler=handler;
                            }
                            if(attrs.focus){//自动获得焦点
                                handler(window.event);
                            }
                            var dw0=scope.$watch('ngModel',onchange),dw1;
                            if(isSelect){
                                scope.selectNgModel={};
                                dw1=scope.$watch(function(scope){
                                    return scope.selectNgModel.ngModel
                                },function(a){
                                    if(a!==undefined){
                                        scope.ngModel=a;
                                    }
                                });
                                scope._selectOnChange=function(value){
                                    var obj={};
                                    // console.log(value);
                                    // function(){
                                    //     return obj[scope.ngModel]=getObjByValue(value)[0]
                                    // }()
                                    scope.selectOnChange(scope.ngModel);
                                }
                            }
                            scope.$on('$destroy',function (){
                                elem.off('click');
                                dw0();
                                if(dw1)dw1();
                            });
                        }
                    }
                }
            }
        }])
        .directive('inputTable',['$compile','$templateCache','ete','$timeout',function($compile,$templateCache,ete,$timeout){
            return{
                restrict:'EA',
                require:'?ngModel',
                replace:true,
                scope:{
                    ngModel:'='
                },
                link:function(scope,elem,attrs){
                    
                }
            }
        }]);
    angular.module("ui.loading").run(["$templateCache", function ($templateCache) {
        $templateCache.put('ui-loading.html',
            '<div class="ui-loading-sign ui-loading-page">\
                      <div class="ui-loading-spinner ">\
                      </div>\
                      <div class=\"ui-loading-text\">{{$message}}</div>\
                </div>')
        $templateCache.put('ui-loading-grid.html',
            '<div class="ui-loading-sign ui-loading-grid">\
                  <div class="ui-loading-spinner "></div>\
                  <div class=\"ui-loading-text\">{{$message}}</div>\
            </div>');
        $templateCache.put('ui-loading-normal.html',
            '<div class="ui-loading-sign ui-loading-normal">\
                  <div class="ui-loading-spinner "></div>\
                  <div class=\"ui-loading-text\">{{$message}}</div>\
            </div>');
    }]);
    angular.module('ui.tooltip', [ 'ui.position', 'ui.bindHtml' ])
        .provider('$tooltip', function () {
            // The default options tooltip and popover.
            var defaultOptions = {
                placement: 'top',
                animation: true,
                popupDelay: 0
            };

            // Default hide triggers for each show trigger
            var triggerMap = {
                'mouseenter': 'mouseleave',
                'click': 'click',
                'focus': 'blur'
            };

            // The options specified to the provider globally.
            var globalOptions = {};

            this.options = function (value) {
                angular.extend(globalOptions, value);
            };
            this.setTriggers = function setTriggers(triggers) {
                angular.extend(triggerMap, triggers);
            };
            function snake_case(name) {
                var regexp = /[A-Z]/g;
                var separator = '-';
                return name.replace(regexp, function (letter, pos) {
                    return (pos ? separator : '') + letter.toLowerCase();
                });
            }

            /**
             * Returns the actual instance of the $tooltip service.
             * TODO support multiple triggers
             */
            this.$get = [ '$window', '$compile', '$timeout', '$parse', '$document', '$position', '$interpolate', function ($window, $compile, $timeout, $parse, $document, $position, $interpolate) {
                return function $tooltip(type, prefix, defaultTriggerShow) {
                    var options = angular.extend({}, defaultOptions, globalOptions);

                    function getTriggers(trigger) {
                        var show = trigger || options.trigger || defaultTriggerShow;
                        var hide = triggerMap[show] || show;
                        return {
                            show: show,
                            hide: hide
                        };
                    }

                    var directiveName = snake_case(type);

                    var startSym = $interpolate.startSymbol();
                    var endSym = $interpolate.endSymbol();
                    var template =
                        '<div ' + directiveName + '-popup ' +
                        'title="' + startSym + 'tt_title' + endSym + '" ' +
                        'content="' + startSym + 'tt_content' + endSym + '" ' +
                        'placement="' + startSym + 'tt_placement' + endSym + '" ' +
                        'animation="tt_animation" ' +
                        'is-open="tt_isOpen"' +
                        '>' +
                        '</div>';

                    return {
                        restrict: 'EA',
                        scope: true,
                        compile: function (tElem, tAttrs) {
                            var tooltipLinker = $compile(template);

                            return function link(scope, element, attrs) {
                                var tooltip;
                                var transitionTimeout;
                                var popupTimeout;
                                var appendToBody = angular.isDefined(options.appendToBody) ? options.appendToBody : false;
                                var triggers = getTriggers(undefined);
                                var hasEnableExp = angular.isDefined(attrs[prefix + 'Enable']);

                                var positionTooltip = function () {

                                    var ttPosition = $position.positionElements(element, tooltip, scope.tt_placement, appendToBody);
                                    ttPosition.top += 'px';
                                    ttPosition.left += 'px';

                                    // Now set the calculated positioning.
                                    tooltip.css(ttPosition);
                                };

                                // By default, the tooltip is not open.
                                // TODO add ability to start tooltip opened
                                scope.tt_isOpen = false;

                                function toggleTooltipBind() {
                                    if (!scope.tt_isOpen) {
                                        showTooltipBind();
                                    } else {
                                        hideTooltipBind();
                                    }
                                }

                                // Show the tooltip with delay if specified, otherwise show it immediately
                                function showTooltipBind() {
                                    if (hasEnableExp && !scope.$eval(attrs[prefix + 'Enable'])) {
                                        return;
                                    }
                                    if (scope.tt_popupDelay) {
                                        // Do nothing if the tooltip was already scheduled to pop-up.
                                        // This happens if show is triggered multiple times before any hide is triggered.
                                        if (!popupTimeout) {
                                            popupTimeout = $timeout(show, scope.tt_popupDelay, false);
                                            popupTimeout.then(function (reposition) {
                                                reposition();
                                            });
                                        }
                                    } else {
                                        show()();
                                    }
                                }

                                function hideTooltipBind() {
                                    scope.$apply(function () {
                                        hide();
                                    });
                                }

                                // Show the tooltip popup element.
                                function show() {

                                    popupTimeout = null;

                                    // If there is a pending remove transition, we must cancel it, lest the
                                    // tooltip be mysteriously removed.
                                    if (transitionTimeout) {
                                        $timeout.cancel(transitionTimeout);
                                        transitionTimeout = null;
                                    }

                                    // Don't show empty tooltips.
                                    if (!scope.tt_content) {
                                        return angular.noop;
                                    }

                                    createTooltip();

                                    // Set the initial positioning.
                                    tooltip.css({ top: 0, left: 0, display: 'block' });

                                    // Now we add it to the DOM because need some info about it. But it's not
                                    // visible yet anyway.
                                    if (appendToBody) {
                                        $document.find('body').append(tooltip);
                                    } else {
                                        element.after(tooltip);
                                    }

                                    positionTooltip();

                                    // And show the tooltip.
                                    scope.tt_isOpen = true;
                                    scope.$digest(); // digest required as $apply is not called

                                    // Return positioning function as promise callback for correct
                                    // positioning after draw.
                                    return positionTooltip;
                                }

                                // Hide the tooltip popup element.
                                function hide() {
                                    // First things first: we don't show it anymore.
                                    scope.tt_isOpen = false;

                                    //if tooltip is going to be shown after delay, we must cancel this
                                    $timeout.cancel(popupTimeout);
                                    popupTimeout = null;

                                    // And now we remove it from the DOM. However, if we have animation, we
                                    // need to wait for it to expire beforehand.
                                    // FIXME: this is a placeholder for a port of the transitions library.
                                    if (scope.tt_animation) {
                                        if (!transitionTimeout) {
                                            transitionTimeout = $timeout(removeTooltip, 500);
                                        }
                                    } else {
                                        removeTooltip();
                                    }
                                }

                                function createTooltip() {
                                    // There can only be one tooltip element per directive shown at once.
                                    if (tooltip) {
                                        removeTooltip();
                                    }
                                    tooltip = tooltipLinker(scope, function () {
                                    });

                                    // Get contents rendered into the tooltip
                                    scope.$digest();
                                }

                                function removeTooltip() {
                                    transitionTimeout = null;
                                    if (tooltip) {
                                        tooltip.remove();
                                        tooltip = null;
                                    }
                                }

                                /**
                                 * Observe the relevant attributes.
                                 */
                                attrs.$observe(type, function (val) {
                                    scope.tt_content = val;

                                    if (!val && scope.tt_isOpen) {
                                        hide();
                                    }
                                });

                                attrs.$observe(prefix + 'Title', function (val) {
                                    scope.tt_title = val;
                                });

                                attrs.$observe(prefix + 'Placement', function (val) {
                                    scope.tt_placement = angular.isDefined(val) ? val : options.placement;
                                });

                                attrs.$observe(prefix + 'PopupDelay', function (val) {
                                    var delay = parseInt(val, 10);
                                    scope.tt_popupDelay = !isNaN(delay) ? delay : options.popupDelay;
                                });

                                var unregisterTriggers = function () {
                                    element.unbind(triggers.show, showTooltipBind);
                                    element.unbind(triggers.hide, hideTooltipBind);
                                };

                                attrs.$observe(prefix + 'Trigger', function (val) {
                                    unregisterTriggers();

                                    triggers = getTriggers(val);

                                    if (triggers.show === triggers.hide) {
                                        element.bind(triggers.show, toggleTooltipBind);
                                    } else {
                                        element.bind(triggers.show, showTooltipBind);
                                        element.bind(triggers.hide, hideTooltipBind);
                                    }
                                });

                                var animation = scope.$eval(attrs[prefix + 'Animation']);
                                scope.tt_animation = angular.isDefined(animation) ? !!animation : options.animation;

                                attrs.$observe(prefix + 'AppendToBody', function (val) {
                                    appendToBody = angular.isDefined(val) ? $parse(val)(scope) : appendToBody;
                                });

                                // if a tooltip is attached to <body> we need to remove it on
                                // location change as its parent scope will probably not be destroyed
                                // by the change.
                                if (appendToBody) {
                                    scope.$on('$locationChangeSuccess', function closeTooltipOnLocationChangeSuccess() {
                                        if (scope.tt_isOpen) {
                                            hide();
                                        }
                                    });
                                }

                                // Make sure tooltip is destroyed and removed.
                                scope.$on('$destroy', function onDestroyTooltip() {
                                    $timeout.cancel(transitionTimeout);
                                    $timeout.cancel(popupTimeout);
                                    unregisterTriggers();
                                    //removeTooltip();
                                });
                            };
                        }
                    };
                };
            }];
        })
        .directive('tooltipPopup', function () {
            return {
                restrict: 'EA',
                replace: true,
                scope: { content: '@', placement: '@', animation: '&', isOpen: '&' },
                templateUrl: 'templates/tooltip/tooltip-popup.html'
            };
        })
        .directive('tooltip', [ '$tooltip', function ($tooltip) {
            return $tooltip('tooltip', 'tooltip', 'mouseenter');
        }])
        .directive('tooltipHtmlUnsafePopup', function () {
            return {
                restrict: 'EA',
                replace: true,
                scope: { content: '@', placement: '@', animation: '&', isOpen: '&' },
                templateUrl: 'templates/tooltip/tooltip-html-unsafe-popup.html'
            };
        })
        .directive('tooltipHtmlUnsafe', [ '$tooltip', function ($tooltip) {
            return $tooltip('tooltipHtmlUnsafe', 'tooltip', 'mouseenter');
        }]);
    angular.module("templates/tooltip/tooltip-html-unsafe-popup.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/tooltip/tooltip-html-unsafe-popup.html",
                "<div class=\"tooltip {{placement}}\" ng-class=\"{ in: isOpen(), fade: animation() }\">\n" +
                "  <div class=\"tooltip-arrow\"></div>\n" +
                "  <div class=\"tooltip-inner\" bind-html-unsafe=\"content\"></div>\n" +
                "</div>\n" +
                "");
    }]);
    angular.module("templates/tooltip/tooltip-popup.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/tooltip/tooltip-popup.html",
                "<div class=\"tooltip {{placement}}\" ng-class=\"{ in: isOpen(), fade: animation() }\">\n" +
                "  <div class=\"tooltip-arrow\"></div>\n" +
                "  <div class=\"tooltip-inner\" ng-bind=\"content\"></div>\n" +
                "</div>\n" +
                "");
    }]);
    angular.module("ui.common").run(["$templateCache", function ($templateCache) {
        $templateCache.put("ui-edit-input.html",
            '<input type="text" class="form-control {{inputClass}}" value="{{ngModel}}" {{max}}/>');
        $templateCache.put("ui-edit-textarea.html",
            '<textarea type="text" class="form-control {{inputClass}}" {{max}}>{{ngModel}}</textarea>');
        $templateCache.put("ui-edit-select.html",
            '<div ui-select ng-model="selectNgModel.ngModel" position="{{selectPosition}}" width="{{selectWidth||\'100%\'}}" default="{{\'CHOOSE\'|translate}}"  \
                options="selectOptions"  as-value="{{selectAsValue}}"  key="{{selectKey}}" \
                on-change="_selectOnChange(selectNgModel.ngModel)"></div>');

        $templateCache.put("ui-popup.html",
            '<div class="am-popup {{className}}" ng-show="visible">\
            <span class="close" ng-click="popUpClose()">&times;</span>\
            <b class="am-popup-arrow-o"></b><b class="am-popup-arrow-i"></b>\
            <div class="am-popup_inner">\
                <div class="am-popup-loading" ng-show="loading">loading</div>\
                <div ng-include="getPopupTpl()" ng-hide="loading"></div>\
            </div>\
        </div>');
        $templateCache.put("month.html",
            '<ul><li class="item" ng-class="{active:compare(i)}" ng-repeat="i in items" value="{{i}}"><span>{{i}}</span></li></ul>\
         <span class="select" ng-click="selectAll(0)">{{"ALL"|translate}}</span>\
         <span class="select" ng-click="selectAll(1)">{{"RESET"|translate}}</span>'
        );
        $templateCache.put("day.html",
            '<ul><li class="item" ng-class="{active:compare(i)}" ng-repeat="i in items" value="{{i}}"><span>{{i}}</span></li>\
        <li ng-class="{active:compare(\'L\')}" class="monthEnd" value="L"><span>Month End</span></li>\
        <li ng-class="{active:compare(today)}" class="monthEnd today"  value="T"><span>Today</span></li></ul>\
         <span class="select" ng-click="selectAll(0)">{{"ALL"|translate}}</span>\
         <span class="select" ng-click="selectAll(1)">{{"RESET"|translate}}</span>'
        );
        $templateCache.put("week.html",
            '<ul><li class="item" ng-class="{active:compare(!(i%7)?1:(i+1))}" ng-repeat="i in items" value="{{!(i%7)?1:(i+1)}}"><span>{{i}}</span></li>\
        </ul>\
         <span class="select" ng-click="selectAll(0)">{{"ALL"|translate}}</span>\
         <span class="select" ng-click="selectAll(1)">{{"RESET"|translate}}</span>'
        );
    }]);
    angular.module("templates/timepicker/timepicker.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/timepicker/timepicker.html",
                "<table>\n" +
                " <tbody>\n" +
                "   <tr>\n" +
                "     <td ng-hide=\"inDatepicker&&!HH\" style=\"width:35px;\" class=\"form-group\" ng-class=\"{'has-error': invalidHours}\">\n" +
                "       <input type=\"text\" ng-model=\"hours\" ng-change=\"updateHours()\" class=\"x-form-text x-form-field form-control text-center\" ng-mousewheel=\"incrementHours()\" ng-readonly=\"readonlyInput\" maxlength=\"2\">\n" +
                "     </td>\n" +
                "     <td ng-hide=\"inDatepicker&&!mm\">:</td>\n" +
                "     <td ng-hide=\"inDatepicker&&!mm\" style=\"width:35px;\" class=\"form-group\" ng-class=\"{'has-error': invalidMinutes}\">\n" +
                "       <input type=\"text\" ng-model=\"minutes\" ng-change=\"updateMinutes()\" class=\"x-form-text x-form-field form-control text-center\" ng-readonly=\"readonlyInput\" maxlength=\"2\">\n" +
                "     </td>\n" +
                "     <td ng-hide=\"inDatepicker&&!ss\">:</td>\n" +
                "     <td ng-hide=\"inDatepicker&&!ss\" style=\"width:35px;\" class=\"form-group\" ng-class=\"{'has-error': invalidSeconds}\">\n" +
                "       <input type=\"text\" ng-model=\"seconds\" ng-change=\"updateSeconds()\" class=\"x-form-text x-form-field form-control text-center\" ng-readonly=\"readonlyInput\" maxlength=\"2\">\n" +
                "     </td>\n" +"   </tr>\n" +
                " </tbody>\n" +
                "</table>\n" +
                "");
    }]);
    angular.module("templates/tooltip/tooltip-html-unsafe-popup.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/tooltip/tooltip-html-unsafe-popup.html",
                "<div class=\"tooltip {{placement}}\" ng-class=\"{ in: isOpen(), fade: animation() }\">\n" +
                "  <div class=\"tooltip-arrow\"></div>\n" +
                "  <div class=\"tooltip-inner\" bind-html-unsafe=\"content\"></div>\n" +
                "</div>\n" +
                "");
    }]);
    angular.module("templates/tooltip/tooltip-popup.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/tooltip/tooltip-popup.html",
                "<div class=\"tooltip {{placement}}\" ng-class=\"{ in: isOpen(), fade: animation() }\">\n" +
                "  <div class=\"tooltip-arrow\"></div>\n" +
                "  <div class=\"tooltip-inner\" ng-bind=\"content\"></div>\n" +
                "</div>\n" +
                "");
    }]);
    angular.module("templates/dropdown/select.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/dropdown/select.html",
            "<div class=\"btn-group ui-select\" ng-class=\"{'dropup':position[0]}\" dropdown is-open=\"isopen\"  ng-style=\"{'display':width?'block':'','width':width}\">\
                <button type=\"button\" style=\"float:none;\" class=\"btn btn-primary dropdown-toggle\" ng-style=\"{'width':width}\" ng-disabled=\"disabled\">\
                   <span class=\"caret pull-right\" style=\"margin:8px 0 0 5px\"></span> \
                   <span class=\"ui-select-text\">{{(isDropdown?(title||''):(_ngModel[0][key]||ngModel[key]))||(options.length&&default)||'NODATA'|translate}}</span>\
                </button>\
                <ul class=\"dropdown-menu\" role=\"menu\" ng-show=\"options.length\" ng-class=\"{'pull-right':position[1]}\"   ng-style=\"menuStyle\">\
                    <li ng-if=\"filter\" ng-click=\"$event.stopPropagation()\"><input class=\"form-control ui-select-filter\" type=\"text\" ng-model=\"$parent._filterText_\"/><span class=\"glyphicon glyphicon-search\"></span></li>\
                    <li ng-class=\"{'active':!isDropdown && item[key]===(_ngModel[0][key]||ngModel[key])}\" ng-repeat=\"item in optionsFilter()\">\
                      <a href=\"#\" ng-click=\"itemClick($event,item)\">\
                      <input ng-if=\"multi\"  type=\"checkbox\" ng-checked=\"isChecked(item)\"/> \
                      {{item[key]}}</a></li>\
                </ul>\
            </div>");
    }]);
    angular.module("templates/modal/backdrop.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/modal/backdrop.html",
            "<div class=\"modal-backdrop fade\" ng-class=\"{in: animate}\" ng-style=\"{'z-index': 1040 + index*10}\"></div>");
    }]);
    angular.module("templates/modal/window.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/modal/window.html",
                "<div tabindex=\"-1\" class=\"modal fade {{ windowClass }}\" ng-class=\"{in: animate}\" ng-style=\"{'z-index': 1050 + index*10, display: 'block'}\" ng-click=\"close($event)\">\n" +
                "<div class=\"modal-dialog\" ng-style=\"{'width':width+'px'}\">" +
                "<div class=\"modal-content\" ng-transclude>" +
                "</div></div>\n" +
                "</div>");
    }]);
    angular.module("templates/tabs/tab.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/tabs/tab.html",
                "<li ng-class=\"{active: active, disabled: disabled}\">\n" +
                "  <a ng-click=\"select()\" tab-heading-transclude>{{heading}}</a>\n" +
                "</li>\n" +
                "");
    }]);
    angular.module("templates/tabs/tabset-titles.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/tabs/tabset-titles.html",
                "<ul class=\"nav {{type && 'nav-' + type}}\" ng-class=\"{'nav-stacked': vertical}\">\n" +
                "</ul>\n" +
                "");
    }]);
    angular.module("templates/tabs/tabset.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/tabs/tabset.html",
                "\n" +
                "<div>\n" +
                "  <ul class=\"am-tab clearfix\" ng-class=\"{'nav-stacked': vertical, 'nav-justified': justified}\" ng-transclude></ul>\n" +
                "  <div class=\"tab-content am-tab-content clearfix\">\n" +
                "    <div class=\"tab-pane\" \n" +
                "         ng-repeat=\"tab in tabs\" \n" +
                "         ng-class=\"{active: tab.active}\"\n" +
                "         tab-content-transclude=\"tab\">\n" +
                "    </div>\n" +
                "  </div>\n" +
                "</div>\n" +
                "");
    }]);
    angular.module("templates/datepicker/datepicker.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/datepicker/datepicker.html",
                "<div ng-switch=\"datepickerMode\" role=\"application\" ng-keydown=\"keydown($event)\">\n" +
                "  <daypicker ng-switch-when=\"day\" tabindex=\"0\"></daypicker>\n" +
                "  <monthpicker ng-switch-when=\"month\" tabindex=\"0\"></monthpicker>\n" +
                "  <yearpicker ng-switch-when=\"year\" tabindex=\"0\"></yearpicker>\n" +
                "</div>");
    }]);
    angular.module("templates/datepicker/day.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/datepicker/day.html",
                "<table role=\"grid\" aria-labelledby=\"{{uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
                "  <thead>\n" +
                "    <tr>\n" +
                "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-left\"></i></button></th>\n" +
                "      <th colspan=\"{{5 + showWeeks}}\"><button id=\"{{uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"toggleMode()\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title}}</strong></button></th>\n" +
                "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-right\"></i></button></th>\n" +
                "    </tr>\n" +
                "    <tr class=\"weeks\">\n" +
                "      <th ng-show=\"showWeeks\" class=\"text-center\"></th>\n" +
                "      <th ng-repeat=\"label in labels track by $index\" class=\"text-center\"><small aria-label=\"{{label.full}}\">{{label.abbr}}</small></th>\n" +
                "    </tr>\n" +
                "  </thead>\n" +
                "  <tbody>\n" +
                "    <tr ng-repeat=\"row in rows track by $index\">\n" +
                "      <td ng-show=\"showWeeks\" class=\"text-center h6\"><em>{{ weekNumbers[$index] }}</em></td>\n" +
                "      <td ng-repeat=\"dt in row track by dt.date\"  class=\"text-center\" role=\"gridcell\" id=\"{{dt.uid}}\" aria-disabled=\"{{!!dt.disabled}}\">\n" +
                "        <button type=\"button\" style=\"width:100%;\" class=\"btn btn-default btn-sm\" ng-class=\"{'btn-info': dt.selected, active: isActive(dt)}\" " +
                "ng-click=\"select(dt.date,0,$event,!dt.remind,dt.remind)\" ng-disabled=\"dt.disabled\" ng-style=\"{'cursor':(dt.isRemind&&!dt.remind)?'not-allowed':''}\" tabindex=\"-1\">" +
                "<span ng-class=\"{'text-muted': dt.secondary, 'text-info': dt.current}\">{{dt.label}}</span>" +
                "<span ng-if=\"dt.remind.completed\" class=\"remind\"><em class=\"state-clr-e\">●</em>{{dt.remind.completed}}</span>" +
                "<span ng-if=\"dt.remind.error\" class=\"remind\"><em class=\"state-clr-b\">●</em>{{dt.remind.error}}</span>" +
                "<span ng-if=\"dt.remind.running\" class=\"remind\"><em class=\"state-clr-a\">●</em>{{dt.remind.running}}</span>" +
                "</button>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </tbody><tfoot></tfoot>\n" +
                "</table>\n" +
                "");
    }]);
    angular.module("templates/datepicker/month.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/datepicker/month.html",
                "<table class=\"month\" role=\"grid\" aria-labelledby=\"{{uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
                "  <thead>\n" +
                "    <tr>\n" +
                "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-left\"></i></button></th>\n" +
                "      <th><button id=\"{{uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"toggleMode()\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title}}</strong></button></th>\n" +
                "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-right\"></i></button></th>\n" +
                "    </tr>\n" +
                "  </thead>\n" +
                "  <tbody>\n" +
                "    <tr ng-repeat=\"row in rows track by $index\">\n" +
                "      <td ng-repeat=\"dt in row track by dt.date\" class=\"text-center\" role=\"gridcell\" id=\"{{dt.uid}}\" aria-disabled=\"{{!!dt.disabled}}\">\n" +
                "        <button type=\"button\" style=\"width:100%;\" class=\"btn btn-default\" ng-class=\"{'btn-info': dt.selected, active: isActive(dt)}\" ng-click=\"select(dt.date,1)\" ng-disabled=\"dt.disabled\" tabindex=\"-1\"><span ng-class=\"{'text-info': dt.current}\">{{dt.label}}</span></button>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </tbody>\n" +
                "</table>\n" +
                "");
    }]);
    angular.module("templates/datepicker/popup.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/datepicker/popup.html",
                "<ul class=\"dropdown-menu\" ng-style=\"{display: (isOpen && 'block') || 'none', top: position.top+'px', left: position.left+'px'}\" ng-keydown=\"keydown($event)\">\n" +
                " <li ng-transclude></li>\n" +
                "<li class=\"timepicker-wrap\" ng-show=\"HH||mm||ss\"><div timepicker  in-datepicker=\"1\" class=\"pull-left\" style=\"width:auto\" ng-model=\"miniTime\" ng-change=\"miniTimeChange()\" hour-step=\"1\" minute-step=\"1\" second-step=\"1\" show-meridian=\"ismeridian\"></div></li>" +
                "</ul>\n" +
                "");
    }]);
    angular.module("templates/datepicker/year.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/datepicker/year.html",
                "<table class=\"year\" role=\"grid\" aria-labelledby=\"{{uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
                "  <thead>\n" +
                "    <tr>\n" +
                "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-left\"></i></button></th>\n" +
                "      <th colspan=\"3\"><button id=\"{{uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"toggleMode()\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title}}</strong></button></th>\n" +
                "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-right\"></i></button></th>\n" +
                "    </tr>\n" +
                "  </thead>\n" +
                "  <tbody>\n" +
                "    <tr ng-repeat=\"row in rows track by $index\">\n" +
                "      <td ng-repeat=\"dt in row track by dt.date\" class=\"text-center\" role=\"gridcell\" id=\"{{dt.uid}}\" aria-disabled=\"{{!!dt.disabled}}\">\n" +
                "        <button type=\"button\" style=\"width:100%;\" class=\"btn btn-default\" ng-class=\"{'btn-info': dt.selected, active: isActive(dt)}\" ng-click=\"select(dt.date)\" ng-disabled=\"dt.disabled\" tabindex=\"-1\"><span ng-class=\"{'text-info': dt.current}\">{{dt.label}}</span></button>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </tbody>\n" +
                "</table>\n" +
                "");
    }]);
    window.vbModule=angular.module('vb', [
        'ui',
        'ui.router',
        'pascalprecht.translate',
        'dialogs.main',
        'ngGrid'
    ]);
    vbModule.config(['$httpProvider', function ($httpProvider, transformRequestAsFormPost) {
        $httpProvider.defaults.transformRequest = function transformRequest( data, getHeaders ) {
            var headers = getHeaders();
            headers['Content-Type'] = "application/x-www-form-urlencoded; charset=utf-8";
            return( serializeData( data ) );
        };
    }]);
    if (!window.console){ window.console = {log: function() {}} };
    function serializeData( data ) {
        if ( ! angular.isObject( data ) ) {
            return( ( data == null ) ? "" : data.toString() );
        }
        var buffer = [];
        for ( var name in data ) {
            if ( ! data.hasOwnProperty( name ) ) {
                continue;
            }
            var value = data[ name ];
            if( angular.isObject(value) ){
                value = angular.toJson(value);
            }
            buffer.push(
                    encodeURIComponent( name ) + "=" + encodeURIComponent( ( value == null ) ? "" : value )
            );
        }
        // Serialize the buffer and clean it up for transportation.
        var source = buffer.join( "&" ).replace( /%20/g, "+" );
        return( source );
    }   

