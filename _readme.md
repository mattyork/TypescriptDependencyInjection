# Dependency Injection

## Property DI vs Constructor DI

Constructor DI works well for Singletons, but not for classes that are instantiated at runtime. That's a pain. For example, React Components would have to have their dependencies injected at instantiation. How do you do this?

Property DI allows you to inject the dependencies on individual classes easily. It's not as clear as Constructor DI, but it's more flexible.

Maybe it's best to use both? Use Constructor DI for Singletons, and property DI for others.

But should you ask the injector to create instances, or should the injector be automatically invoked when constructing an object? Property injectors have to ask the injector for instances (isn't that the Service-Locator pattern?), but then how do they know which Injector to ask? Can there only be one global injector at a time?

## Approach

Why not use Angular's DI?

1. ES6 only. It relies on Map. :(
2. Too much stuff we don't need. Lazy, Promises, etc.
3. Can't inject into object where we don't have control over the constructor.

## Step 1 - ES6 with constructor-only dependency injection

1. Similar to Angular's DI, but don't require types in decorators. Use reflect-metadata
2. Use Classes as keys in the ES6 map for cacheing instances
3. Enable Overriding for mocking

## Step 2 - Property-based injection

(I'm not going to worry about this. I only really care about React components, and they can be injected using props (with getDefaultProps).)

The property will need to know which injector to use for lookup, so maybe the annotation should provide the Injector? That means there needs to be some way to look up the current injector. Hrm. Does mocking work in this case?

## Step 3 - ES5

Not sure how this will work without map. Maybe we can decorate injectable classes with a string key to use in the map? Might work...


## Requirements:

1. There can be multiple Injectors per app, each with it's own instance cache.
2. Can Inject into objects where we don't have control over the constructor (like React components)
3. Can override the Injector's provider
4. Can construct objects that could be injected outside of the Injector. i.e. can construct objects normally, without going through injector

@Injectable - definition decorator goes on an abstract class. It registers the class. Do we really need this when using Map? Not sure.
@ProvideInjectable - Provide an instance of the injectable.
@ConstructorInject - Looks up type metadata in constructor. Is this all we need? Do we need Injectable?
@PropertyInject(InjectableClass) -

## Fundamental Problem With My Design

The design calls for Property based dependency injection. This would work by having the getter on the property return the Injector's instance, but how does the getter know which Injector to talk to? We'd have to have another level of indirection: the getter asks for the "current" Injector, and there can only be one "current" Injector for all views. Icky.

