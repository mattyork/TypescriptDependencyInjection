/// <reference path="typings/tsd.d.ts" />

import { expect } from 'chai'
import Injectable, { Injector, InjectableOverride } from './index'

@Injectable
class FirstInjectable {}

@Injectable
class SecondInjectable {
  constructor(
    public argFirstInjectable: FirstInjectable) {}
}

@Injectable
class ThirdInjectable {
  constructor(
    public argFirstInjectable: FirstInjectable,
    public argSecondInjectable: SecondInjectable) {}
}

@Injectable
class MockFirstInjectable {}

@Injectable
class MockThirdInjectable {
  constructor(
    public argFirstInjectable: FirstInjectable,
    public argSecondInjectable: SecondInjectable) {}
}

@Injectable
class CircularOne {
  constructor(
    public argCircularTwo: CircularTwo) {}
}

@Injectable
class CircularTwo {
  constructor(
    public argCircularOne: CircularOne) { }
}

class Uninjectable {}

@Injectable
class DependencyOnUninjectable {
  constructor(
    public argUninjectable: Uninjectable) {}
}

describe('Injector', () => {
  it('should create an instance of an empty class', () => {
    let injector: Injector = new Injector()
    expect(injector.getInstance(FirstInjectable)).instanceof(FirstInjectable)
  })

  it('should use cached instance of requested object', () => {
    let injector: Injector = new Injector()
    let firstInstance: FirstInjectable = injector.getInstance(FirstInjectable)
    let secondInstance: FirstInjectable = injector.getInstance(FirstInjectable)
    expect(firstInstance).equals(secondInstance)
  })

  it('should create one instance of dependencies per instance of Injector', () => {
    let firstInstance: FirstInjectable = new Injector().getInstance(FirstInjectable)
    let secondInstance: FirstInjectable = new Injector().getInstance(FirstInjectable)
    expect(firstInstance).not.equals(secondInstance)
  })

  it('should inject instances of the correct type in the the constructor', () => {
    let injector: Injector = new Injector()
    expect(injector.getInstance(ThirdInjectable).argFirstInjectable).instanceof(FirstInjectable)
    expect(injector.getInstance(ThirdInjectable).argSecondInjectable).instanceof(SecondInjectable)
  })

  it('should use cached instance of dependency if resolving different objects with the same dependency', () => {
    let injector: Injector = new Injector()
    let secondInjectableFirstArg: FirstInjectable = injector.getInstance(SecondInjectable).argFirstInjectable
    let thirdInjectableFirstArg: FirstInjectable = injector.getInstance(ThirdInjectable).argFirstInjectable
    expect(secondInjectableFirstArg).equals(thirdInjectableFirstArg)
  })

  it('should walk whole dependency graph', () => {
    let injector: Injector = new Injector()
    let thirdInjectable: ThirdInjectable = injector.getInstance(ThirdInjectable)
    let secondInjectable: SecondInjectable = injector.getInstance(SecondInjectable)
    expect(secondInjectable).equals(thirdInjectable.argSecondInjectable)
    expect(secondInjectable.argFirstInjectable).equals(thirdInjectable.argFirstInjectable)
  })

  it('should throw on circular dependencies', () => {
    let injector: Injector = new Injector()
    expect(() => injector.getInstance(CircularTwo)).throws('circular dependency')
  })

  it('should throw when instantiating an object with no Injectable decorator', () => {
    let injector: Injector = new Injector()
    expect(() => injector.getInstance(Uninjectable)).throws('not decorated with @Injectable')
    expect(() => injector.getInstance(DependencyOnUninjectable)).throws('not decorated with @Injectable')
  })

  it('should allow overriding an injectable type', () => {
    let overrides: InjectableOverride[] = [
      { key: FirstInjectable, val: MockFirstInjectable },
      { key: ThirdInjectable, val: MockThirdInjectable }
    ]
    let injector: Injector = new Injector(overrides)
    let injected: ThirdInjectable = injector.getInstance(ThirdInjectable)
    expect(injected, 'injected').instanceof(MockThirdInjectable)
    expect(injected.argFirstInjectable, 'first arg of injected').instanceof(MockFirstInjectable)
    expect(injected.argSecondInjectable, 'second arg of injected').instanceof(SecondInjectable)
  })
})
