Getting Started

    yarn add io-ts-derive-class io-ts

Purpose:

This library is intended to help create classes from io-ts interface types and assist in setting defaults on instances of these classes.

Quick Example:

```ts
    import * as t from 'io-ts'
    import * as tdc from 'io-ts-derive-class'

    //Define a normal io-ts interface type
    const CityType = t.type({
        ID: t.number,
        Name: t.string
    })

    //Derive a class from it
    class City extends tdc.DeriveClass(CityType) {}

    //Define another io-ts interface type
    const AddressType = t.type({
        StreetAddress1: t.string,
        StreetAddress2: t.string,
        //Reference the previously defined class
        City: tdc.ref(City)
    });

    class Address extends tdc.DeriveClass(AddressType) {}

    const PersonType = t.type({
        ID: t.number,
        FirstName: t.string,
        //MiddleName is string or null.  The default generated will be the right most member of the union.  Here it will be null.
        MiddleName: t.union([t.string, t.null]),
        LastName: t.string,
        Address: tdc.ref(Address)
    });

    class Person extends tdc.DeriveClass(PersonType) {}

    const person = new Person({ 
        FirstName: 'Test', 
        LastName: 'TestLast'
    });

    //person.MiddleName === null
    //person.FirstName === 'Test'
    //person.Address.StreetAddress1 === ''
    //person.Address.City.Name === ''

    const personJson = JSON.stringify(person);
    const result = tdc.decode(Person, personJson);

    //result.isLeft() === false
    const areEqual = JSON.stringify(result.value) === personJson
    //areEqual === true

```

Derived Defaults:

* unions will always default to the right most type
    
    |   Type                           | Default Value |
    | --------                         | ------------- |
    | t.number                         | 0             |
    | t.string                         | ''            |
    | t.undefined                      | undefined     |
    | t.null                           | null          |
    | t.boolean                        | false         |
    | t.literal('myliteral')           | 'myliteral'   |
    | t.union([t.string, t.undefined]) | undefined     |
    | t.union([t.string, t.null])      | null          |
    | t.union([t.number, t.string])    | ''            |
    | t.type({})                       | {}            |
    | t.tuple([t.string, t.number])    | ['', 0]       |
    | t.array(arraytype)               | []            |
    | tdc.ref(MyClass)                 | new MyClass() |
    | tdc.DateTime                     | moment()      |
    | tdc.uuid                         | creates uuid4 |


More examples and tests can be found in src/index.spec.ts

Contributing:

    yarn install
    yarn run test

