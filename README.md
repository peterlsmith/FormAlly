# FormAlly
A small and lightweight javascript library for adding web form input validation and feedback.

This library makes it very easy to retroactively add validation and feedback to form input elements, such as applying styles, disabling buttons, etc, on the basis of values entered within the form. This library does not have any dependencies, and in most cases does not require any modifications the form HTML. Configuring validators can usually be done in a single method call:

```
    formally().fromString(  
        `validator(
            pattern(/^[\\w.%+-]+@[\\w.-]+\\.[\\w]{2,}$/, element('#email')),
            enable('#submit')
        )`
    ).reset();
```

## Overview
The validation system implemented by FormAlly is based on **sources**, **predicate**, and **actions**.  

 - **sources** are usually used to monitor values of interest, such as an input field on a form, but they may also be used for constant values or even dynamic data, such as a timer value. Sources generate events when changes occur in the data value they monitor.

 - **predicates** are tests that check the validity of specific condition, and usually involve a source. For example, a predicate may test a source data value representing an input field against a regular expression. A predicate will listen to events on any sources they use and evaluate their corresponding tests to determine whether the condition is true or false.

 - **actions** are simple functions - such as lambda functions - that are executed by the validation when a corresponding predicate changes state. For example, an action may apply a style to a form element to indicate validity. The action is passed the predicate state when invoked.

The above three components are wrapped up in a **validator**. A validator links the predicates and the actions, and is responsbile for monitoring the predicate state and invoking the action as required.

---

## Use

### Loading the Library

You will first need to include the javascript library in your web page:

```
    <script src="https://cdn.jsdelivr.net/gh/peterlsmith/formally/src/formally.js"></script>
```
You may also download and serve the file youself - it has no dependencies.  
Script loading may be defered or asynchronous, as long as it loads before the code that uses it will be executed.

### Setting up validation

There are two main ways of setting up validation. The first is using the 'fromString' approach. For example, to enable a button once a valid email has been entered into a field:

```
    formally().fromString(  
        `validator(
            pattern(/^[\\w.%+-]+@[\\w.-]+\\.[\\w]{2,}$/, element('#email')),
            enable('#submit')
        )`
    ).reset();
```

The second approach is to construct it explicitly:

```
    formally.validator(
        formally.predicate.pattern(/^[\w.%+-]+@[\w.-]+\.[\w]{2,}$/, formally.source.element('#email')),
        formally.action.enable('#submit')
    ).reset();
```

Note that in both cases, the ``reset`` call is used to initialize the validator and make sure the form is in the correct state to begin with.  

A validator also acts as a predicate, so validation can be compounded. In the above case, we can add styling to the email field by wrapping it in its own validator. In the following example, we apply the bootstrap 'is-valid' and 'is-invalid' styling to the input field based on the results of the pattern match. The button enable/disable continues to work as before:

```
    formally().fromString(  
        `validator(
            validator(
                pattern(/^[\\w.%+-]+@[\\w.-]+\\.[\\w]{2,}$/, element('#email')),
                style('#email', 'is-valid', 'is-invalid')
            ),
            enable('#submit')
        )`
    ).reset();
```

or by constructing it explicitly:

```
    formally.validator(
        formally.validator(
            formally.predicate.pattern(/^[\w.%+-]+@[\w.-]+\.[\w]{2,}$/, formally.source.element('#email')),
            formally.action.style('#email', 'is-valid', 'is-invalid')
        ),
        formally.action.enable('#submit')
    ).reset();
```

Predicates can be combined using and/or operations, e.g.:

```
    formally().fromString(  
        `validator(
            and(
                pattern(/^\\w{2,}$/, element('#input1')),
                pattern(/^\\w{2,}$/, element('#input2')),
            ),
            enable('#button')
        )`
    ).reset();
```

or by constructing it explicitly:

```
    formally.validator(
        formally.predicate.and(
            formally.predicate.pattern(/^\\w{2,}$/, formally.source.element('#email')),
            formally.predicate.pattern(/^\\w{2,}$/, formally.source.element('#email')),
        ),
        formally.action.enable('#button')
    ).reset();
```

---

## API
A full list of all predicates, sources, and actions are given below.

### Predicates

**and**  
The ``and`` predicate wraps one or more other predicates, ands acts as a logical. e.g. enable a form submit button if all fields have values. e.g.

```
    formally.validator(
        formally.predicate.and(
            formally.predicate.pattern(/^.+$/, formally.source.element('#input1')),
            formally.predicate.pattern(/^.+$/, formally.source.element('#input2'))
        ),
        formally.action.enable('#submit')
    ).reset();
```


**changed**  
The ``changed`` predicate monitors the value of one or more input fields and returns true if any one of them has changed from its initial value. e.g.

```
    formally().fromString(  
        `validator(
            changed(
                element('#input1'),
                element('#input2'),
                element('#input3')
            )
            enable('#submit')
        )`
    ).reset();
```


**equal**  
The ``equal`` predicate checks if all the sources have the same value. e.g. check if a new user password has 
been entered correctly twice on a password update form.

```
    formally.validator(
        formally.predicate.equal(
            formally.source.element('#password1'),
            formally.source.element('#password2')
        ),
        formally.action.enable('#update')
    ).reset();
```


**exclude**  
The ``exclude`` predicate can be used to make sure specific values are not used in an input field. e.g.

```
    formally.validator(
        formally.predicate.exclude(
            ['root', 'admin'],
            formally.source.element('#username')
        ),
        formally.action.enable('#submit')
    ).reset();
```

Note that this predicate performs case insensitive matches.


**false**  
This predicate always returns a false value. Note when using the **fromString** method of validation construction, this predicate must be specified in upper case.


**not**  
This predicate can be used to wrap another predicate and invert its value. e.g.


```
    formally.validator(
        formally.predicate.not(
            formally.predicate.pattern('/^root$/', formally.source.element('#username'))
        ),
        formally.action.enable('#submit')
    ).reset();
```


**or**  
The ``or`` predicate wraps one or more other predicates, ands acts as a logical or, e.g. enable a save button if any field has been changed. e.g.

```
    formally.validator(
        formally.predicate.or(
            formally.predicate.changed(formally.source.element('#input1')),
            formally.predicate.changed(formally.source.element('#input2')),
            formally.predicate.changed(formally.source.element('#input3')),
        ),
        formally.action.enable('#save')
    ).reset();
```


**pattern**  
This predicate performs a regular expression match against the configured sources. If all source values match, the predicate result is true, otherwise false.

```
    formally.validator(
        formally.predicate.pattern(/^[\w.%+-]+@[\w.-]+\.[\w]{2,}$/, formally.source.element('#email')),
        formally.action.enable('#submit')
    ).reset();
```


**range**  
This predicate verifies the value of a numeric input field lies within a given range.

```
    formally.validator(
        formally.predicate.range(1, 10, formally.source.element('#product_count')),
        formally.action.enable('#purchase')
    ).reset();
```
Note that the range is inclusive.

**true**  
This predicate always returns a true value. Note when using the **fromString** method of validation construction, this predicate must be specified in upper case.


### Sources  
**constant**  
This source represents a simple constant value. It can be used in, for example, the **equals** predicate to test an input field against a specific value.
```
    formally.validator(
        formally.predicate.equals(
            formally.source.element('#username'),
            formally.source.constant('root')
        ),
        formally.action.style('#login', 'is-invalid')
    ).reset();
```


**element**  
This source monitors a value in a form field - for example, a text input, checkbox, or select. The element to be monitored is identified via a text selector (compatible with element.querySelector), but in the case of explicit construction, a node may be provided directly.

```
    const node = document.createElement('input');
    ...
    formally.validator(
        formally.predicate.changed(
            formally.source.element('#input1'),
            formally.source.element(node)),
        formally.action.enable('#save')
    ).reset();
```

### Actions

**all** 
This action wraps a list of other actions an executes them sequentially. For example:

```
    formally().fromString(  
        `validator(
            changed(element('#input')),
            all(
                enable('#extra-options'),
                enable('#save')
            )
        )`
    ).reset();
```

**alt**  
This action wraps another action and inverts the predicate state prior to calling it. This effectively reverses the action.
```
    formally.validator(
        formally.predicate.equals(
            formally.source.element('#username'),
            formally.source.constant('root')
        ),
        formally.action.alt(
            formally.action.enable('#submit')
        )
    ).reset();
```

**debounce**  
This action wraps another action and is used to reduce the frequency with which the wrapped action is executed. It does this by caching the predicate state for a short period of time to see if any more updates occur. If another update occurs before the time period expires, the old state is dropped and the new state is cached. If no new update occurs before the end of the timer period, the wrapped action is invoked with the cached value.
```
    formally.validator(
        formally.predicate.changed(formally.source.element('#input1')),
        formally.action.debounce(
            1000, /* 1 second timer */
            formally.action.enable('#save')
        )
    ).reset();
```

**enable**  
This action enables or disables another form element by setting the ``disabled`` attribute. For example:

```
    formally.validator(
        formally.predicate.changed(formally.source.element('#input')),
        formally.action.enable('#save')
    ).reset();
```

**function**  
This action allows custom functions to be executed when form input fields changes. The supplied function will be invoked with a single boolean argument representing the current state of the predicate.

```
    formally.validator(
        formally.predicate.changed(formally.source.element('#input1')),
        formally.action.function(
            (state) => console.log("You've made a change!")
        )
    ).reset();
```

Note that when this action is used in the ``fromString`` method, it must be specified using ``func``.

**style**  
This action applies class styles to a form element.

```
    formally.validator(
        formally.predicate.range(1, 10, formally.source.element('#input')),
        formally.action.style('#save', 'is-valid', 'is-invalid' )
    ).reset();
```
The first argument is a selector for the element to apply the class styles too. The second argument is the class name (or array of class names) to apply to the element when the predicate result is true. The third arguemnt is the class name (or array of class names) to apply to the element when the predicate result is false.

---

## Extending the library

If the library does not include the functionality you need, it can easily be extended with custom predicates, sources, and actions.

### Extending Sources
Sources must extend the FormAlly 'source' object. In this example, we create a custom source that monitors the number of words typed into an input field. A range predicate can use this to enable/disable other functionality based on how many words the user has typed into the field.
```
    function wordcountSource() {
        formally.source.call(this);
        const input = document.querySelector('#text');
        this.listener = () => this.changed(input.value.split(/\s+/).filter(s => s.length).length);
        input.addEventListener('keyup', this.listener);
    }
    wordcountSource.prototype = Object.create(formally.source.prototype);
    wordcountSource.prototype.reset = () => {this.listener};
```

### Extending Predicates
As with sources, custom predicates should extend the FormAlly 'predicate' object. The following is a simple timer predicate that only returns true 5 seconds after the validator has been reset.

```
    const predicateTimer = function() {
        formally.predicate.call(this);
    }
    predicateTimer.prototype = Object.create(formally.predicate.prototype);
    predicateTimer.prototype.reset = function() {
        this.state(false);
        setTimeout(() => this.state(true), 5000);
    };
```

### Extending Actions
Actions are simply functions of the form:

```
    function doStuff(state) {}
```
where ``state`` is the current state of the predicate - either true or false. It is therefore trivial to implement arbitrary actions if the standard ones do not provide you with what you need.

```
    formally.validator(
        formally.validator(
            ...
        ),
        (state) => console.log(state)
    ).reset();
```