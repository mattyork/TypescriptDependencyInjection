/// <reference path="./node_modules/reflect-metadata/reflect-metadata.d.ts" />
/// <reference path="./node_modules/typescript/bin/lib.es6.d.ts" />

import 'reflect-metadata';

interface Newable<T> {
  new(...args: any[]): T
}

function Injectable<T>(target: Newable<T>) {
  // This is only needed to force typescript to emit type metadata on the contructor
  Reflect.defineMetadata('DI:injectable', true, target);
  return target;
}

class Injector {
  private cache: Map<Newable<any>, any>;
  private explicitBindings: Map<Newable<any>, any>;

  constructor(explicitBindings: Map<Newable<any>, any> = new Map<Newable<any>, any>()) {
    this.cache = new Map<Newable<any>, any>();
    this.explicitBindings = explicitBindings;
  }

  getInstance<T>(newable: Newable<T>): T {
    let cachedInstance = this.cache.get(newable);
    if (cachedInstance) {
      return cachedInstance;
    }

    if (this.explicitBindings.has(newable)) {
      newable = this.explicitBindings.get(newable);
    }
    let dependencies: Newable<any>[] = Reflect.getMetadata("design:paramtypes", newable);
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
    this.cache.set(newable, newInstance);
    return newInstance;
  }
}

export {
  Injectable as default,
  Injector
}
