# Dependency Injection

Dependency Injection for Typescript. Inspired by [di.js](https://github.com/angular/di.js/), but simpler and strongly typed.

[![Build Status](https://travis-ci.org/mattyork/TypescriptDependencyInjection.svg?branch=master)](https://travis-ci.org/mattyork/TypescriptDependencyInjection)

# Requirements

1. Typescript >= 1.5
2. import [reflect-metadata](https://www.npmjs.com/package/reflect-metadata) in your source
3. Compile with options: `--experimentalDecorators --emitDecoratorMetadata --target ES5`


# Quick Start

Only three touch points: `@Injectable`, `new Injector`, `Injector#getInstance`

```typescript
import Injector, { Injectable } from './index';

@Injectable
class KlassA {}

@Injectable
class KlassB {
  constructor(public dependency: KlassA) {}
}

let injector = new Injector();
let b = injector.getInstance(KlassB);
let a = injector.getInstance(KlassA);
assert(b.dependency === a);
assert(b === injector.getInstance(B));

@Injectable
class MockKlassA {}

let overrides = [
  {key: KlassA, val: MockKlassA}
];
let injector = new Injector(overrides);
let b = injector.getInstance(KlassB);
assert(b.dependency instanceof MockKlassA)
```
See `tests.js` for more examples

# API

There is at most one instance of each `@Injectable` per `Injector` instance.
All objects are instantiated lazily (i.e. when they are first requested).

## `@Injectable`

Use to decorate classes that will be instantiated through `Injector#getInstance`

`Injector#getInstance` will throw if it encounters objects without this decorator.

```typescript
@Injectable
class Klass {
  constructor(injectableDependency: InjectableDependency) {}
}
```

## `Injector`

```typescript
interface Injector {
  new(overrides?: {key: Newable<any>, val: Newable<any>}[]): Injector;
  getInstance<T>(Newable<T>): T;
}
```

`Injector` will create at most one instance of each requested `@Injectable`:

```typescript
@Injectable
class A {}
let inj = new Injector();
assert(inj.getInstance(A) === inj.getInstance(A));
```

Each instance of Injector keeps its own instance cache:

```typescript
@Injectable
class A {}
let inj1 = new Injector();
let inj2 = new Injector();
assert(inj1.getInstance(A) !== inj2.getInstance(A));
```

`Injector` instantiates lazily and will follow the whole dependency tree:

```typescript
@Injectable
class Fur {
  constructor() {
    console.log('Fur');
  }
}

@Injectable
class Sasquatch {
  constructor(fur: Fur) {
    console.log('Sasquatch');
  }
}
let inj = new Injector();
inj.getInstance(Sasquatch);
// > Sasquatch
// > Fur
```

`Injector` bindings can be overridden at construction time

```typescript
@Injectable
class KlassA {}

@Injectable
class MockKlassA {}

let overrides = [
  {key: KlassA, val: MockKlassA}
];
let injector = new Injector(overrides);
let a = injector.getInstance(KlassA);
assert(a instanceof MockKlassA)
```

# Build and Test

    > npm install
    > npm test

See the the `scripts` in `package.json` for finer grained npm scripts

# todo

1. Better static typing for bindings overrides. Currently any object can be overridden with anything. Compiler should enforce that objects have same interface. Maybe: Use TS 1.6's abstract class to define an @Injectable, have a @DefaultProvider that inherits from the @Injectable abstract class to give default implementation, and have a @Provider for mocks. All @Providers would still need to be passed in to the Injector's constructor.
