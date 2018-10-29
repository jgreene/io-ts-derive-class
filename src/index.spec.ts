import { expect } from 'chai';
import 'mocha';

import * as t from 'io-ts'
import * as tdc from './index'
import * as moment from 'moment';

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
    LookupID: t.Integer,
    FirstName: t.string,
    LastName: t.string,
    MiddleName: t.union([t.string, t.null]),
    Address: tdc.ref(Address),
    NullableAddress: t.union([tdc.ref(Address), t.null]),
    Addresses: t.array(tdc.ref(Address)),
    Tuple: TestTupleType,
    CreatedOn: tdc.DateTime,
});

class Person extends tdc.DeriveClass(PersonType, { LookupID: 1}) {}

describe('Person tests', async () => {

    it('constructor with missing data fills in defaults', async () => {
        let person = new Person({ FirstName: 'Test', LastName: 'TestLast'});
        let result = tdc.decode(Person, person);
        expect(result.isLeft()).eq(false);

        if(!(person.Address instanceof Address)) {
            expect(true).eq(false);
        }
    });

    it('Can override defaults with DeriveClass', async () => {
        let person = new Person();
        expect(person.LookupID).eq(1);
    })

    it('Can get default DateTime', async () => {
        let person = new Person();
        const now = moment();
        expect(person.CreatedOn.diff(now, 'minutes')).eq(0)
    })

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
        let personResult: Person = result.value as Person;
        expect(personResult.Address.StreetAddress1).eq("123 Test st. ");
        expect(person.Address.StreetAddress1).eq("123 Test st. ");
        expect(person.Address.StreetAddress1).eq(address.StreetAddress1);
        expect(personResult.Address.StreetAddress1).eq(address.StreetAddress1);
    });

    it('missing data fails decode', async () => {
        let result = PersonType.decode({ FirstName: 'Test', LastName: 'TestLast'})

        expect(result.isLeft()).eq(true);
    });

    it('Default person has no Addresses', async () => {
        let person = new Person();
        
        expect(person.Addresses.length).eq(0);
    })

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

    it('encode decode is isomorphic', async () => {
        let person = new Person({ FirstName: 'Test', LastName: 'TestLast', });
        let type = person.getType();
        let json = JSON.stringify(person);
        let result = type.decode(JSON.parse(json));
        expect(result.isLeft()).eq(false);
        let decodedPerson = new Person(result.value as Person);

        if(!(decodedPerson.Address instanceof Address)) {
            expect(true).eq(false);
        }
    });

    it('NullableAddress has correct type', async () => {
        let person = new Person();
        expect(person.NullableAddress).is.null;

        let person2 = new Person({ NullableAddress: new Address({ StreetAddress1: 'Street1' })});
        expect(person2.NullableAddress).is.not.null;
        expect(person2.NullableAddress instanceof Address).eq(true);
    });

    it('Invalid partial argument still results in valid entity', async () => {
        const arg = { FirstName: 'Test', LastName: 'TestLast', invalidField: 'not a valid field' }

        let person = new Person(arg);

        let type = person.getType();
        let json = JSON.stringify(person);
        let result = type.decode(JSON.parse(json));
        expect(result.isLeft()).eq(false);
        expect((person as any)['invalidField']).eq(undefined)
    })
});

