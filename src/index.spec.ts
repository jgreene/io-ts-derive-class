import { expect } from 'chai';
import 'mocha';

import * as t from 'io-ts'
import * as m from './index'

const CityType = t.type({
    ID: t.number,
    Name: t.string
})

class City extends m.DeriveClass(CityType) {}

const AddressType = t.type({
    StreetAddress1: t.string,
    StreetAddress2: t.string,
    City: m.ref(City)
});

class Address extends m.DeriveClass(AddressType) {}


const PersonType = t.type({
    ID: t.Integer,
    FirstName: t.string,
    LastName: t.string,
    MiddleName: t.union([t.string, t.null]),
    Address: m.ref(Address),
    Addresses: t.array(m.ref(Address))
});

class Person extends m.DeriveClass(PersonType) {}

describe('Person tests', async () => {

    it('constructor with missing data fills in defaults', async () => {
        let person = new Person({ FirstName: 'Test', LastName: 'TestLast'});
        let result = person.getType().decode(person);
        expect(result.isLeft()).eq(false);

        if(!(person.Address instanceof Address)) {
            expect(true).eq(false);
        }
    });

    it('missing data fails decode', async () => {
        let person = new Person({ FirstName: 'Test', LastName: 'TestLast'});
        let firstName: any = undefined;
        person.FirstName = firstName;
        let result = person.getType().decode(person);
        expect(result.isLeft()).eq(true);
    });

    it('assigned address decodes properly', async () => {
        let address = new Address({ StreetAddress1: "123 Test st. "});
        let person = new Person({ FirstName: 'Test', LastName: 'TestLast', Address: address });
        let result = person.getType().decode(person);
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
});

