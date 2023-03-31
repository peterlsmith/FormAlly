/******************************************************************************
 *                         FormAlly.js
 *
 * Provides web form input validation and feedback utilities.
 *
 * This libary can be used to easily add validation and feedback to web
 * based forms. It is simple to add retrospectively and it is easy to extend.
 *
 *
 * @author Peter Smith
 *
 *****************************************************************************/
'use strict';

(function(){

    /** Error function */

    const error = (msg) => { throw new Error(msg)};


    /** Utilty method to assemble mixed argument values into a single, flat array */

    const asList = (...args) => args.reduce((a, c) => a.concat(c), []);


    /** Dictionaries for the predicates, sources, and actions */

    const predicates = Object.create(null), sources = Object.create(null), actions = Object.create(null);


    /**
     * A few simple (imperfect) regex patterns that can be used for basic validation.
     */
    const regex = {
        email : /^[\w.%+-]+@[\w.-]+\.[\w]{2,}$/,

        web_url : /^(?:https?:\/\/)?[\w.-]+\.[A-Za-z.]{2,13}(?:\/[\w.+#%@~-]*)*\/?(?:\?[\w.+#%@~=&amp;-]*)?$/,
        web_url_full : /^https?:\/\/[\w.-]+\.[A-Za-z.]{2,13}(?:\/[\w.+#%@~-]*)*\/?(?:\?[\w.+#%@~=&amp;-]*)?$/,

        integer: /^[0-9]+$/
    };



    /**
     * Utility method for identifying a DOM element using a selector.
     * @param selector  the element selector - this can be a string (for use with element.querySelector),
     *                  an actual element, or a JQuery object.
     */
    const getInput = (selector) => {
        if (selector === undefined || selector === null) return document.body;

        if (selector.nodeName)
            return selector;
        else if (typeof selector == 'string')
            return document.querySelector(selector);
        else if (selector.selector) { /* Support JQuery  */
            return selector.get(0);
        }
        else
            error('Unsupported source element selector type')
    };



    /**
     * Event dispatcher constructor.
     * The event dispatcher is a very simple event notification mechanism used for propagating state
     * changes between the various components of the validation system.
     */
    function dispatcher() {
        this.listeners__ = Object.create(null);
    }



    /**
     * Adds a listener to a dispatcher for a named event.
     *
     * @param event     the name of the event to listen on 
     * @param callback  the listener to be added to the named event
     * @return          a reference to this instance
     */
    dispatcher.prototype.on = function(event, callback) {
        (this.listeners__[event] || (this.listeners__[event] = [])).push(callback);
        return this;
    };



    /**
     * Removes a listener from a dispatcher for a named event.
     *
     * @param event     the name of the event to remove the listener from
     * @param callback  the listener to be remove from the named event
     * @return          a reference to this instance
     */
    dispatcher.prototype.off = function(event, callback) {
        if (event in this.listeners__) {
            this.listeners__[event] = this.listeners__[event].filter(cb => cb !== callback);
        }
        return this;
    };



    /**
     * Triggers all listeners on a named event.
     *
     * @param event  the name of the event to fire
     * @param args   arguments to be passed through to the listeners
     * @return       a reference to this instance
     */
    dispatcher.prototype.fire = function(event, ...args) {
        if (event in this.listeners__) {
            this.listeners__[event].forEach(l => l.apply(this, args));
        }
        return this;
    };



    /**************************************************************************
     *               PREDICATES
     *
     * Predicates form the basis of validation testing. They check whether
     * or not a given condition exists based on values provided from data
     * sources (usually representing a form input field).
     *
     *************************************************************************/


    /**
     * Base predicate class. This defines the predicate API that all subclasses 
     * must implement.
     */
    const _predicate = function() {
        dispatcher.call(this);
        this.state__ = undefined;
    };
    _predicate.prototype = Object.create(dispatcher.prototype);


    /** Resets the predicate to its initial/starting state */

    _predicate.prototype.reset = () => console.error('Predicate reset method not implemented');


    /** Cleans up the predicate, freeing any resources */

    _predicate.prototype.destroy = () => console.error('Predicate destroy method not implemented');


    /** Sets the current state of this predicate */

    _predicate.prototype.state = function(state) {if (state != this.state__) this.fire('state', this.state__ = state, this)};


    /** Returns the current state of this predicate */

    _predicate.prototype.getState = function() {return this.state__};


    /* Provide external access to this class for extensions */

    predicates.base = Object.create(null);
    predicates.base.predicate = _predicate;



    /**
     * True predicate.
     * This predicate always returns true.
     */
    const predicateTrue = function() {_predicate.call(this)}
    predicateTrue.prototype = Object.create(_predicate.prototype);
    predicateTrue.prototype.reset = function() {this.state(true)};
    predicateTrue.prototype.destroy = () => {};
    predicates.true = () => new predicateTrue();



    /**
     * False predicate.
     * This predicate always returns false
     */
    const predicateFalse = function() {_predicate.call(this)}
    predicateFalse.prototype = Object.create(_predicate.prototype);
    predicateFalse.prototype.reset = function() {this.state(true)};
    predicateFalse.prototype.destroy = () => {};
    predicates.false = () => new predicateFalse();



    /**
     * General predicate base class.
     * This provides support for handling data sources. It sets up
     * handlers to listen on for changes on all sources and caches
     * the value. When a value changes, the 'check' method is invoked.
     * Derived classes must implement the 'check' method.
     *
     * @param sources  a list of sources to monitor
     */
    const predicateGeneral = function(...sources) {
        _predicate.call(this);
        
        this.sources  = asList(sources);
        this.data     = new Array(this.sources.length);
        this.listener = new Array(this.sources.length);

        /* Function to create a callback to listen on a given source */

        const callback = (i, value) => {
            if (value !== this.data[i]) {
                this.data[i] = this[`data_${i}`] = value;
                this.check();
            }
        };

        /* Set up listeners on each source */

        this.sources.forEach((source, i) => {
            this.listener[i] = (value) => callback.call(this, i, value);
            source.on('change', this.listener[i]);
        });
    }
    predicateGeneral.prototype = Object.create(_predicate.prototype);
    predicateGeneral.prototype.reset = function() {for (const source of this.sources) source.reset()};
    predicateGeneral.prototype.destroy = function() {
        this.sources.forEach((source, i) => source.off('change', this.listener[i]));
        for (const source of this.sources) source.destroy();
    };
    predicateGeneral.prototype.check = () => console.error('Predicate check method not implemented');


    /* Provide external access to this class for extensions */

    predicates.base.general = predicateGeneral;



    /**
     * Generic function predicate.
     * This predicate tests whether or a supplied function evaluates to true in the
     * context of the data sources.
     *
     * @param fn       the function that will be evaluated. It will be passed an array
     *                 of data values obtained from the sources.
     * @param sources  the data sources to monitor
     */
    const predicateFunction = function(fn, ...sources) {
        predicateGeneral.call(this, ...sources);
        this.fn = fn;
    }
    predicateFunction.prototype = Object.create(predicateGeneral.prototype);
    predicateFunction.prototype.check = function() {this.state(this.fn(this.data))};


    /* Provide external access to this class for extensions */

    predicates.base.function = predicateFunction;



    /**
     * Monitors data sources for changes.
     * This predicate checks wether or not a source has changed value since the last 
     * reset. Multiple sources can be monitored and  only a single source needs to 
     * change for a true result.
     *
     * @param sources  the sources to test for changes
     */
    const predicateChanged = function(...sources) {
        predicateGeneral.call(this, ...sources);
        this.original_value = new Array(this.data.length);
    }
    predicateChanged.prototype = Object.create(predicateGeneral.prototype);
    predicateChanged.prototype.reset = function() {
        predicateGeneral.prototype.reset.call(this);

        this.original_value = this.data.map(v => v);
        this.state(false);
    };
    predicateChanged.prototype.check = function() {
        this.state(this.original_value.some((v, i) => v != this.data[i]));
    };
    predicates.changed = (...sources) => new predicateChanged(...sources);

 

    /**
     * Tests whether or not all data sources are the same.
     * This predicate tests whether or not the data values are all equal. This can be used, for example,
     * in 'new password' forms to make sure the 'confirm' password matches.
     *
     * @param sources  the sources to check for equality
     */
    predicates.equal = (...sources) => new predicateFunction((values) => values.every(value => value === values[0]), ...sources);



    /**
     * Tests data sources against a regular expression pattern.
     * This predicate tests whether or not the data value matches a regular expression
     *
     * @param pattern  the pattern to test the data source values against
     * @param sources  the data sources to test
     */
    predicates.pattern = (pattern, ...sources) => {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        return new predicateFunction((values) => values.every(value => regex.test(value)), ...sources);
    };



    /**
     * Tests numerical data sources against a range.
     *
     * @param min      the minimum range value (data source must be >=)
     * @param max      the maximum range value (data source must be <=)
     * @param sources  the data sources to verify
     */
    predicates.range = (min, max, ...sources) => {
        const _min = parseFloat(min), _max = parseFloat(max);
        return new predicateFunction((values) => values.every(value => {
                const v = parseFloat(value);
                return !(Number.isNaN(v) || (!Number.isNaN(_min) && v < _min) || (!Number.isNaN(_max) && v > _max));
            }), ...sources);
    };



    /**
     * Tests whether or not data sources contain values on an excluded list.
     * This returns true if all data sources DO NOT contain any value in the provided
     * exclusion list.
     */
    predicates.exclude = (values, ...sources) => {
        const _values = values.map(value => value.toLowerCase());
        return new predicateFunction(
            (values) => values.every(value => !_values.includes(value.toLowerCase())),
            ...sources);
    };



    /**
     * Base predicate for logic functions (and/or/not).
     * This predicate is intended primarily as a base for logic operations that work
     * on one or more other predicates. It does not act directly on sources.
     *
     * @param fn          the function used to evaluate the result of the other predicates
     * @param predicates  the list of predicates to operate on
     */
    const predicateLogic = function(fn, ...predicates) {
        _predicate.call(this);
        
        this.fn = fn;
        this.predicates  = asList(predicates);
        this.listener = () => this.check();
        for(const predicate of this.predicates) predicate.on('state', this.listener);
    }
    predicateLogic.prototype = Object.create(_predicate.prototype);
    predicateLogic.prototype.reset = function() {for(const predicate of this.predicates) predicate.reset()};
    predicateLogic.prototype.destroy = function() {
        for(const predicate of this.predicates) {
            predicate.off('state', this.listener);
            predicate.destroy();
        }
    };
    predicateLogic.prototype.check = function() {
        this.state(this.fn(this.predicates))
    };



    /* Provide external access to this class for extensions */

    predicates.base.logic = predicateLogic;



    /**
     * AND predicate.
     * This returns true if all other predicates are true, false otherwise.
     */
    predicates.and = (...predicates) => new predicateLogic((predicates) => predicates.every(predicate => predicate.getState()), ...predicates);



    /**
     * OR predicate.
     * This returns true if at least on other predicates is true, false otherwise.
     */
    predicates.or = (...predicates) => new predicateLogic((predicates) => predicates.some(predicate => predicate.getState()), ...predicates);



    /**
     * NOT predicate.
     * This returns the inverse of the result of the other predicate. Note that unlike AND and OR, this only
     * takes a single predicate argument.
     */
    predicates.not = (predicate) => new predicateLogic((predicates) => !predicates[0].getState(), predicate);



    /*********************************************
     *               SOURCES
     *
     * Sources are used to provide the input data
     * to predicates.
     *********************************************/


    /**
     * Base class for all sources.
     * Sources extend the event dispatcher and are expected to fire a 'change' event
     * with the data source value as the first argument, and the data source itself
     * as the second argument.
     */
    const _source = function() {
        dispatcher.call(this);
    };
    _source.prototype = Object.create(dispatcher.prototype);
    _source.prototype.reset = () => console.error('Source reset method not implemented');
    _source.prototype.destroy = () => console.error('Source destroy method not implemented');


    /* Provide external access to this class for extensions */

    sources.base = Object.create(null);
    sources.base.source = _source;



    /**
     * Source class for constant values.
     * 
     * @param value  the value of this data source
     */
    const sourceConstant = function(value) {
        _source.call(this);
        this.value = value;
    };
    sourceConstant.prototype = Object.create(_source.prototype);
    sourceConstant.prototype.reset = function() {this.fire('change', this.value)}
    sourceConstant.prototype.destroy = () => {};
    sources.constant = (value) => new sourceConstant(value);


    
    /**
     * DOM Element source.
     * This sources data values from form elements - inputs, checkboxes, etc.
     *
     * @param selector   the selector for the element. This can be a regular string selector, or it can
     *                   be an actual DOM element. Ultimately, this is exepcted to resolve to an
     *                   input element of some type.
     */
    const sourceElement = function(selector) {
        _source.call(this);

        (selector !== undefined && selector !== null) || error('Empty source element selector');
        this.input = getInput(selector);

        this.eventType = 'input'
        switch (this.input.getAttribute('type')) {
            case 'checkbox':
                this.listener = () => this.fire('change', this.input.checked, this);
                this.eventType = 'change';
                break;

            case null:
                if (this.input.nodeName === 'SELECT') this.eventType = 'change';
                /* fall-thru */

            default:
                this.listener = () => this.fire('change', this.input.value, this);
                break;
        }
        this.input.addEventListener(this.eventType, this.listener);

    }
    sourceElement.prototype = Object.create(_source.prototype);
    sourceElement.prototype.reset = function() {this.listener()};
    sourceElement.prototype.destroy = function() {this.input.removeEventListener(this.eventType, this.listener)};
    sources.element = (selector) => new sourceElement(selector);



    /**************************************************************************
     *               ACTIONS
     *
     * Actions are used to execute specific operations based on the result
     * of the predicate. There is no base class for actions since they are
     * nothing more than a lambda/callback function.
     *
     *************************************************************************/

    /**
     * Wraps a list of actions and executes them all.
     *
     * @param args    a list of actions to execute
     */
    actions.all = (...args) => {
        const actions = asList(args);
        return (state) => {for (const action of actions) action(state)}
    };



    /**
     * Executes a provided callback with the predicate state.
     *
     * @param lambda  the callback to invoke. The predicate state is passed through as the
     *                first argument.
     */
    actions.function = (lambda) => (state) => lambda.call(null, state);



    /**
     * Triggers the execution of the alternate state of an operation.
     * This action invokes another action with the state value inverted.
     *
     * @param action  the action to invoke.
     */
    actions.alt = (action) => (state) => action(!state);



    /**
     * Debounces invocations of another action.
     * This action can be used to reduce the overhead of another action by temporarily buffering
     * action invocations and discarding multiple calls within a given time window. 
     *
     * @param delay   the debounce window in milliseconds
     * @param action  the action to invoke
     */
    actions.debounce = (delay, action) => {
        let timer;
        return (state) => {
            if (timer) window.clearTimeout(delay);
            timer = window.setTimeout(() => {timer = undefined; action(state)}, delay);
        };
    };



    /**
     * Applies (or removes) a class name to an element's class list.
     * Given that most CSS frameworks apply classes to an element to indicate something is in a
     * bad or incomplete state, this action applies a class if the predicate is false and removes
     * the class when the predicate becomes true. This can be wrapped in an 'alt' action to
     * reverse the operation.
     *
     * @param selector   the selector for the element whos class list is to be modified
     * @param classnames  the class names to apply/remove. This can be a single value or
     *                    a list of values
     */
    actions.style = (selector, trueStyles, falseStyles) => {
        const element = getInput(selector),
            tStyles = asList(trueStyles), fStyles = asList(falseStyles);

        return (state) => {
            if (state) {
                element.classList.remove(...fStyles);
                element.classList.add(...tStyles);
            }
            else {
                element.classList.remove(...tStyles);
                element.classList.add(...fStyles);
            }
        };
    };



    /**
     * Action to enable or disable an element.
     * This action can be used to enable or disable elements such as buttons until a given
     * condition exists.
     *
     * @param selector  the selector for the element to enable/disable
     */
    actions.enable = (selector) => {
        const element = getInput(selector);
        return (state) => {
            if (state)
                element.removeAttribute('disabled');
            else
                element.setAttribute('disabled', true);
        };
    };



    /*********************************************
     *               CONNECTOR
     *
     * The connector is used to connect predicates
     * with actions. Note that this is presented
     * externally as the 'validator'.
     *
     *********************************************/

    /**
     * Connects a set of predicates to an action (or actions).
     * A connector is itself a predicate and may be supplied to another connector to allow
     * groups of independent validators to be linked together.
     * 
     * @param predicates  a predicate (or array of predicates) used to determine validity
     * @param action      an action (or array of actions) to execute based on the predicate results.
     */
    const _connector = function(predicates, action) {
        predicateLogic.call(this, (predicates) => predicates.every(predicate => predicate.getState()), predicates);
        this.action = actions.all(action);

        /* Hook into state changes and invoke the actions */

        this.handler = (state) => this.action(state);
        this.on('state', this.handler);
    };
    _connector.prototype = Object.create(predicateLogic.prototype);
    _connector.prototype.destroy = function() {
        this.off('state', this.handler);
        predicateLogic.prototype.destroy.call(this);
    }



    /*********************************************
     *                 API
     *********************************************/

    /**
     * The API object that will be returned. By default, it contains the connector, the
     * predicates, actions, sources defined here.
     */
    const formally  = function(...scopes) {
        /* If invoked without 'new', set up a default scope */

        if (this == null || this == window) return new formally({
            and: predicates.and,
            changed: predicates.changed,
            equal: predicates.equal,
            exclude: predicates.exclude,
            FALSE: predicates.false,
            not: predicates.not,
            or: predicates.or,
            pattern: predicates.pattern,
            range: predicates.range,
            TRUE: predicates.true,

            constant: sources.constant,
            element: sources.element,

            all: actions.all,
            alt: actions.alt,
            style: actions.style,
            debounce: actions.debounce,
            enable: actions.enable,
            func: actions.function
        }, ...scopes);

        const context = Object.create(null);
        context.predicate = predicates;
        context.source = sources;
        context.action = actions;
        context.regex = regex;
        context.validator = (predicates, actions) => new _connector(predicates, actions);
        if (scopes.length) Object.assign(context, ...scopes);

        this.context = context;
    };


    /**
     * Utility method to create a validator from a string from.
     * form.
     */
    formally.prototype.fromString = function(string) {
        return Function(...Object.keys(this.context), `{ return ${string} }`)(...Object.values(this.context));
    };


    /* Make the concrete classes directly available for derivations */

    formally.validator = (predicates, actions) => new _connector(predicates, actions);
    formally.predicate = predicates;
    formally.source = sources;
    formally.action = actions;

    /* Publish the  API */

    window.formally = formally;
})();

