# wafir

Web application feedback and issue reporter

## Proposed frameworks

The core requirements are:

- Good support for Shadow DOMs
- should be completely isolated from the outside HTML/CSS. Should not effect the site.

- [Lit](https://github.com/lit/lit): Build on native web components, allows for use with ShadowDOMs and with any other frameworks.
- [webawesome](https://github.com/shoelace-style/webawesome): Prebuilt components built with Lit. Similar to bootstrap.

OR

- [preact](https://github.com/preactjs/preact): React with a smaller bundle size (3KB)

## Why not React?

React would be ideal, but shipping it out would mean having to deal with shipping the entire React runtime library (~35 KB) to consumers.
