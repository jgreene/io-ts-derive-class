import { expect } from 'chai';
import 'mocha';

import * as t from 'io-ts'
import * as m from './index'
import { PathReporter } from 'io-ts/lib/PathReporter'

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
    ID: t.number,
    FirstName: t.string,
    LastName: t.string,
    Address: m.ref(Address)
});

class Person extends m.DeriveClass(PersonType) {}

describe('Person tests', async () => {

    it('constructor with missing data fills in defaults', async () => {
        let person = new Person({ FirstName: 'Test', LastName: 'TestLast'});
        let type = person.Address.City.getType();

        let result = PersonType.decode(person);
        console.log(PathReporter.report(result));
        expect(result.isLeft()).eq(false);

        if(!(person.Address instanceof Address)) {
            expect(true).eq(false);
        }
    });

});

