/// <reference path="./node_modules/reflect-metadata/reflect-metadata.d.ts" />
/// <reference path="./node_modules/typescript/bin/lib.es6.d.ts" />

import 'reflect-metadata';

interface Newable<T> {
  new(...args: any[]): T
}

interface Override {
  key: Newable<any>,
  val: Newable<any>
}

interface Dict<T> {
  [idx: string]: T
}

let injectableId = 1;

const injectableTypeKey = '__injectableTypeKey__';

class Injector {
  private static injectableId = 1;
  private cache: Dict<any>;
  private explicitBindings: Dict<Newable<any>>;

  constructor(bindingOverrides: Override[] = []) {
    this.cache = {};
    this.explicitBindings = {};

    bindingOverrides.forEach((override: Override) => {
      let key: string = override.key[injectableTypeKey];
      this.explicitBindings[key] = override.val;
    });
  }

  getInstance<T>(newable: Newable<T>): T {
    let newableTypeKey = newable[injectableTypeKey];

    let cachedInstance = this.cache[newableTypeKey];
    if (cachedInstance) {
      return cachedInstance;
    }

    if (this.explicitBindings[newableTypeKey]) {
      newable = this.explicitBindings[newableTypeKey];
    }

    let dependencies: Newable<any>[] = Reflect.getMetadata('design:paramtypes', newable);
    let args: any[] = [];
    if (dependencies && dependencies.length) {
      args = dependencies.map(dep => {
        if (dep === undefined) {
          throw new Error(`Cannot inject '${newable.name}' because there is no type metadata for a dependency.
            you might have a circular dependency`);
        }
        return this.getInstance(dep)
      });
    }
    let isDecoratedWithInject = Reflect.getMetadata('DI:injectable', newable);
    if (!isDecoratedWithInject) {
      throw new Error(`Cannot inject '${newable.name}' because it is not decorated with @Injectable.`)
    }
    let applyArgs: Newable<any>[] = [newable];
    applyArgs = applyArgs.concat(args);
    let constructor = Function.prototype.bind.apply(newable, applyArgs);
    let newInstance = new constructor();
    this.cache[newableTypeKey] = newInstance;
    return newInstance;
  }
}

function Injectable<T>(target: Newable<T>) {
  Reflect.defineMetadata('DI:injectable', true, target);
  target[injectableTypeKey] = injectableId++;
  return target;
}

export {
  Injectable as default,
  Injector
}
