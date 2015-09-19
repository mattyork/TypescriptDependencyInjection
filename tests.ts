/// <reference path="typings/tsd.d.ts" />
/// <reference path="./node_modules/typescript/bin/lib.es6.d.ts" />

import { expect } from 'chai'
import Injectable, { Injector } from './index'

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
    let injector = new Injector()
    expect(injector.getInstance(FirstInjectable)).instanceof(FirstInjectable)
  })

  it('should use cached instance of requested object', () => {
    let injector = new Injector()
    let firstInstance = injector.getInstance(FirstInjectable)
    let secondInstance = injector.getInstance(FirstInjectable)
    expect(firstInstance).equals(secondInstance)
  })

  it('should create one instance of dependencies per instance of Injector', () => {
    let firstInstance = new Injector().getInstance(FirstInjectable)
    let secondInstance = new Injector().getInstance(FirstInjectable)
    expect(firstInstance).not.equals(secondInstance)
  })

  it('should inject instances of the correct type in the the constructor', () => {
    let injector = new Injector()
    expect(injector.getInstance(ThirdInjectable).argFirstInjectable).instanceof(FirstInjectable)
    expect(injector.getInstance(ThirdInjectable).argSecondInjectable).instanceof(SecondInjectable)
  })

  it('should use cached instance of dependency if resolving different objects with the same dependency', () => {
    let injector = new Injector()
    let thirdInjectableFirstArg = injector.getInstance(SecondInjectable).argFirstInjectable
    let secondInjected = injector.getInstance(ThirdInjectable).argFirstInjectable
    expect(thirdInjectableFirstArg).equals(secondInjected)
  })

  it('should walk whole dependency graph', () => {
    let injector = new Injector()
    let thirdInjectable = injector.getInstance(ThirdInjectable);
    let secondInjectable = injector.getInstance(SecondInjectable)
    expect(secondInjectable).equals(thirdInjectable.argSecondInjectable);
    expect(secondInjectable.argFirstInjectable).equals(thirdInjectable.argFirstInjectable);
  })

  it('should throw on circular dependencies', () => {
    let injector = new Injector();
    expect(() => injector.getInstance(CircularTwo)).throws('circular dependency');
  })

  it('should throw when instantiating an object with no Injectable decorator', () => {
    let injector = new Injector();
    expect(() => injector.getInstance(Uninjectable)).throws('not decorated with @Injectable');
    expect(() => injector.getInstance(DependencyOnUninjectable)).throws('not decorated with @Injectable');
  })

  it('should allow overriding an injectable type', () => {
    let overrides = [
      { key: FirstInjectable, val: MockFirstInjectable },
      { key: ThirdInjectable, val: MockThirdInjectable }
    ];
    let injector = new Injector(overrides);
    let injected: ThirdInjectable = injector.getInstance(ThirdInjectable)
    expect(injected, 'injected').instanceof(MockThirdInjectable)
    expect(injected.argFirstInjectable, 'first arg of injected').instanceof(MockFirstInjectable)
    expect(injected.argSecondInjectable, 'second arg of injected').instanceof(SecondInjectable)
  })
})
