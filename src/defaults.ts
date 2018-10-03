import * as t from 'io-ts';
import * as moment from 'moment';

import { ClassType } from './index';

export interface ITypeDefault {
    isMatch: (type: t.Type<any>) => boolean;
    getDefault: (type: t.Type<any>) => any;
}

const getTag = (type: t.Type<any>) => (type as any)['_tag']
const doesTagContain = (type: t.Type<any>, search: string) => {
    const tag = getTag(type);
    return tag && tag.length > 0 ? tag.indexOf(search) != -1 : false;
};

class TagDefault implements ITypeDefault {
    
    constructor(public tag: string, public defaultValue: any){}

    isMatch: (type: t.Type<any, any, t.mixed>) => boolean = (type) => {
        const tag = getTag(type);
        return tag === this.tag;
    }
    getDefault: (type: t.Type<any, any, t.mixed>) => any = (type) => this.defaultValue;
}

class TagContainsDefault implements ITypeDefault {
    
    constructor(public tag: string, public defaultValue: any){}

    isMatch: (type: t.Type<any, any, t.mixed>) => boolean = (type) => {
        return doesTagContain(type, this.tag);
    }
    getDefault: (type: t.Type<any, any, t.mixed>) => any = (type) => this.defaultValue;
}

class InnerTypeDefault implements ITypeDefault {
    
    constructor(public tag: string){}

    isMatch: (type: t.Type<any, any, t.mixed>) => boolean = (type) => {
        const tag = getTag(type);
        return tag === this.tag;
    }
    getDefault: (type: t.Type<any, any, t.mixed>) => any = (type) => {
        const rt = (type as any) as { type: any };
        return getDefault(rt.type);
    }
}

class ClassTypeDefault implements ITypeDefault {
    isMatch: (t: t.Type<any, any, t.mixed>) => boolean = (t) => {
        return (t instanceof ClassType)
    }
    getDefault: (t: t.Type<any, any, t.mixed>) => any = (t) => {
        if(t instanceof ClassType){
            return new t.cons();
        }
        throw new Error('Not a ClassType! Should not have matched');
    }
}

class LiteralTypeDefault implements ITypeDefault {
    isMatch: (t: t.Type<any, any, t.mixed>) => boolean = (t) => {
        let tag = getTag(t);
        return tag === 'LiteralType';
    };
    getDefault: (t: t.Type<any, any, t.mixed>) => any = (t) => {
        const lt = t as t.LiteralType<any>;
        return lt.value;
    }
}

class InterfaceTypeDefault implements ITypeDefault {
    typesToMatch = ['InterfaceType', 'StrictType', 'PartialType']

    isMatch: (t: t.Type<any, any, t.mixed>) => boolean = (t) => {
        let tag = getTag(t);
        return this.typesToMatch.indexOf(tag) !== -1;
    }
    getDefault: (t: t.Type<any, any, t.mixed>) => any = (type) => {
        const t = type as t.InterfaceType<any>;
        const res: any = {};
        for(const p in t.props){
            res[p] = getDefault(t.props[p]);
        }

        return res;
    }
}

class UnionTypeDefault implements ITypeDefault {

    isMatch: (t: t.Type<any, any, t.mixed>) => boolean = (t) => {
        let tag = getTag(t);
        return tag === 'UnionType';
    }
    getDefault: (t: t.Type<any, any, t.mixed>) => any = (type) => {
        const u = type as t.UnionType<any>;
        const len = u.types.length;

        return getDefault(u.types[len - 1]);
    }
}

class TupleTypeDefault implements ITypeDefault {

    isMatch: (t: t.Type<any, any, t.mixed>) => boolean = (t) => {
        let tag = getTag(t);
        return tag === 'TupleType';
    }
    getDefault: (t: t.Type<any, any, t.mixed>) => any = (type) => {
        const tt = type as t.TupleType<any>;
        const len = tt.types.length;
        const res = [];
        for(var i = 0; i < len; i++) {
            res.push(getDefault(tt.types[i]));
        }

        return res;
    }
}

class DateTimeTypeDefault implements ITypeDefault {

    isMatch: (t: t.Type<any, any, t.mixed>) => boolean = (t) => {
        let tag = getTag(t);
        return tag === 'DateTime';
    }
    getDefault: (t: t.Type<any, any, t.mixed>) => any = (type) => {
        return moment();
    }
}

export const tagDefault = (tag: string, defaultValue: any) => new TagDefault(tag, defaultValue);
export const tagContainsDefault = (tag: string, defaultValue: any) => new TagContainsDefault(tag, defaultValue);
export const innerTypeDefault = (tag: string) => new InnerTypeDefault(tag);

const defaultMap: Array<ITypeDefault> = [
    new DateTimeTypeDefault(),
    new TupleTypeDefault(),
    new InterfaceTypeDefault(),
    new ClassTypeDefault(),
    new LiteralTypeDefault(),
    innerTypeDefault('ReadonlyType'),
    innerTypeDefault('ExactType'),
    innerTypeDefault('RefinementType'),
    tagContainsDefault('DictionaryType', {}),
    tagDefault('KeyofType', {}),
    tagDefault('IntersectionType', {}),
    tagDefault('ObjectType', {}),
    tagContainsDefault('ArrayType', []),
    new UnionTypeDefault(),
    tagDefault('BooleanType', false),
    tagDefault('NumberType', 0),
    tagDefault('UndefinedType', undefined),
    tagDefault('NullType', null),
    tagDefault('StringType', ''),
]

export function registerDefault(typeDefault: ITypeDefault) {
    defaultMap.push(typeDefault);
}

export function getDefault(type: t.Type<any, any, any>): any {
    const len = defaultMap.length;
    //we loop in reverse so that the last registered match wins
    for(let i = len - 1; i >= 0; i--){
        const defaultHandler = defaultMap[i];
        if(defaultHandler.isMatch(type)){
            return defaultHandler.getDefault(type);
        }
    }

    throw new Error('unsupported getDefault for type' + JSON.stringify(type, null, 2));
}