# FormAlly
A simple javascript library for adding web form input validation and feedback.

This library makes it very easy to retroactively add validation and feedback to form input elements, such as styling, disabling buttons, etc, It usually does not require modifying the form HTML.  

Validation is based on **predicates** - simple true/false conditions such as a pattern match, **sources** - data values such as form inputs that are to be tested in the predicates, and **actions** - simple functions that are executed when a predicate state changes.

## Use

### Loading the Library

You will first need to include the javascript library in your web page:

```
    <script src="https://cdn.jsdelivr.net/gh/peterlsmith/formally/formally.js"></script>
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


The library can easily be extended.
