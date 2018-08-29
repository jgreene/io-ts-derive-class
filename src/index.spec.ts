import { expect } from 'chai';
import 'mocha';

import * as t from 'io-ts'
import * as tdc from './index'

//import { PathReporter } from 'io-ts/lib/PathReporter'

const CityType = t.type({
    ID: t.number,
    Name: t.string
})

class City extends tdc.DeriveClass(CityType) {}

const AddressType = t.type({
    StreetAddress1: t.string,
    StreetAddress2: t.string,
    City: tdc.ref(City)
});

class Address extends tdc.DeriveClass(AddressType) {}

const TestTupleType = t.tuple([t.string, t.number])

const PersonType = t.type({
    ID: t.Integer,
    FirstName: t.string,
    LastName: t.string,
    MiddleName: t.union([t.string, t.null]),
    Address: tdc.ref(Address),
    Addresses: t.array(tdc.ref(Address)),
    Tuple: TestTupleType
});

class Person extends tdc.DeriveClass(PersonType) {}

describe('Person tests', async () => {

    it('constructor with missing data fills in defaults', async () => {
        let person = new Person({ FirstName: 'Test', LastName: 'TestLast'});
        let result = tdc.decode(Person, person);
        expect(result.isLeft()).eq(false);

        if(!(person.Address instanceof Address)) {
            expect(true).eq(false);
        }
    });

    it('missing data fails decode', async () => {
        let person = new Person({ FirstName: 'Test', LastName: 'TestLast'});
        let firstName: any = undefined;
        person.FirstName = firstName;
        let result = tdc.decode(Person, person);
        expect(result.isLeft()).eq(true);
    });

    it('assigned address decodes properly', async () => {
        let address = new Address({ StreetAddress1: "123 Test st. "});
        let person = new Person({ FirstName: 'Test', LastName: 'TestLast', Address: address });
        let result = tdc.decode(Person, person);
        expect(result.isLeft()).eq(false);
    });

    it('missing data fails decode', async () => {
        let result = PersonType.decode({ FirstName: 'Test', LastName: 'TestLast'})

        expect(result.isLeft()).eq(true);
    });

    it('Addresses array defaults to empty array', async () => {
        let person = new Person({ FirstName: 'Test', LastName: 'TestLast' });
        expect(person.Addresses.length).eq(0);
    });

    it('MiddleName default is null', async () => {
        let person = new Person({ FirstName: 'Test', LastName: 'TestLast' });
        expect(person.MiddleName).eq(null);
    });

    it('Tuple defaults are correct', async () => {
        let person = new Person({ FirstName: 'Test', LastName: 'TestLast' });
        expect(person.Tuple[0]).eq('');
        expect(person.Tuple[1]).eq(0);
    });

    it('encode decode is isomorhpic', async () => {
        let person = new Person({ FirstName: 'Test', LastName: 'TestLast', });
        let type = person.getType();
        let json = JSON.stringify(person);
        let result = type.decode(JSON.parse(json));
        let decodedPerson = new Person(result.value);
        expect(result.isLeft()).eq(false);

        if(!(decodedPerson.Address instanceof Address)) {
            expect(true).eq(false);
        }
    });
});

