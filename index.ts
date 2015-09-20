/// <reference path="node_modules/reflect-metadata/reflect-metadata.d.ts" />

import 'reflect-metadata'

interface Newable<T> {
  new(...args: any[]): T
  name?: string
}

interface InjectableOverride {
  key: Newable<any>
  val: Newable<any>
}

interface Dict<T> {
  [idx: string]: T
}

let injectableId: number = 1

const injectableTypeKey: string = '__injectableTypeKey__'

class Injector {
  private cache: Dict<any>
  private explicitBindings: Dict<Newable<any>>

  constructor(bindingOverrides: InjectableOverride[] = []) {
    this.cache = {}
    this.explicitBindings = {}

    bindingOverrides.forEach((override: InjectableOverride) => {
      let key: string = override.key[injectableTypeKey]
      this.explicitBindings[key] = override.val
    })
  }

  getInstance<T>(newable: Newable<T>): T {
    let newableTypeKey: string = newable[injectableTypeKey]

    let cachedInstance: T = this.cache[newableTypeKey]
    if (cachedInstance) {
      return cachedInstance
    }

    if (this.explicitBindings[newableTypeKey]) {
      newable = this.explicitBindings[newableTypeKey]
    }

    let dependencies: Newable<any>[] = Reflect.getMetadata('design:paramtypes', newable)
    let args: any[] = []
    if (dependencies && dependencies.length) {
      args = dependencies.map((dep: Newable<any>) => {
        if (dep === undefined) {
          throw new Error(`Cannot inject '${newable.name}' because there is no type metadata for a dependency.
            you might have a circular dependency`)
        }
        return this.getInstance(dep)
      })
    }
    let isDecoratedWithInject: boolean = Reflect.getMetadata('DI:injectable', newable)
    if (!isDecoratedWithInject) {
      throw new Error(`Cannot inject '${newable.name}' because it is not decorated with @Injectable.`)
    }
    let applyArgs: Newable<any>[] = [newable]
    applyArgs = applyArgs.concat(args)
    let constructor: Newable<T> = Function.prototype.bind.apply(newable, applyArgs)
    let newInstance: T = new constructor()
    this.cache[newableTypeKey] = newInstance
    return newInstance
  }
}

function Injectable<T>(target: Newable<T>): Newable<T> {
  Reflect.defineMetadata('DI:injectable', true, target)
  target[injectableTypeKey] = injectableId++
  return target
}

export {
  Injectable as default,
  Injector,
  InjectableOverride
}
