import * as t from 'io-ts';

import { ThrowReporter } from 'io-ts/lib/ThrowReporter';

export interface ITyped<P, A = any, O = any, I = t.mixed> {
    getType(): t.InterfaceType<P, A, O, I>;
}

function getDefault(type: t.Type<any, any, any>): any {
    const tag = (type as any)['_tag'];
    const tagContains = (search: string) => tag && tag.length > 0 ? tag.indexOf(search) != -1 : false;

    if(tag === "StringType")
    {
        return '';
    }

    if(tag === "NullType")
    {
        return null;
    }

    if(tag === "NumberType")
    {
        return 0;
    }
    
    if(tag === "BooleanType")
    {
        return false;
    }

    if(tag === "UndefinedType")
    {
        return undefined;
    }

    if(tagContains("ArrayType"))
    {
        return [];
    }

    if(    tag === "ObjectType" 
        || tag === "IntersectionType" 
        || tag === "KeyofType" 
        || tagContains("DictionaryType")
    )
    {
        return {};
    }

    if(    tag === "RefinementType" 
        || tag === "ExactType" 
        || tag === "ReadonlyType")
    {
        const rt = (type as any) as { type: any };
        return getDefault(rt.type);
    }

    if(type instanceof ClassType) {
        return new type.constructor();
    }

    if(tag === "LiteralType")
    {
        const lt = type as t.LiteralType<any>;
        return lt.value;
    }

    if(tag === "InterfaceType" || tag === "StrictType" || tag === "PartialType"){
        const t = type as t.InterfaceType<any>;
        const res: any = {};
        for(const p in t.props){
            res[p] = getDefault(t.props[p]);
        }

        return res;
    }

    //Default to the right most member of the union
    if(tag === "UnionType") {
        const u = type as t.UnionType<any>;
        const len = u.types.length;

        return getDefault(u.types[len - 1]);
    }

    if(tag === "TupleType") {
        const tt = type as t.TupleType<any>;
        const len = tt.types.length;
        const res = [];
        for(var i = 0; i < len; i++) {
            res.push(getDefault(tt.types[i]));
        }

        return res;
    }

    throw 'unsupported getDefault for type' + type;
}

function assignDefaults<P, A = any, O = any, I = t.mixed>(input: ITyped<P, A, O, I>) {
    const type = input.getType();
    const result = getDefault(type);
    Object.assign(input, result);
}

function applyPartial<P, A, O, I>(type: t.InterfaceType<P, A, O, I>, typed: ITyped<P, A, O, I>, partial: Partial<t.TypeOf<typeof type>>) {
    const target: any = typed;
    const input: any = partial;
    
    Object.keys(input).forEach((p: string) => {
        const value = input[p];
        const pt: t.Type<any> = (type.props as any)[p];
        const decodeResult = pt.decode(value);
        if(decodeResult.isLeft()){
            ThrowReporter.report(decodeResult);
        }

        target[p] = decodeResult.value;
    });
}

export type Constructor<T = {}> = new (...args: any[]) => T;

export function DeriveClass<P, A, O, I>(type: t.InterfaceType<P, A, O, I>)
: Constructor<t.TypeOf<typeof type> & ITyped<P, A, O, I>> {
    return class implements ITyped<P, A, O, I> {
        constructor(input?: Partial<t.TypeOf<typeof type>>) {
            assignDefaults(this);
            if(input){
                applyPartial(type, this, input);
            }
        }

        static getType() { return type; }
        public getType() { return type; }
    } as any;
}

export class ClassType<P, A, O, I> extends t.InterfaceType<P, A, O, I> {
    constructor(public constructor: Constructor<A>, i: t.InterfaceType<P, A, O, I>) {
        super(
            constructor.name, 
            i.is, 
            (input, ctx) => i.validate(input, ctx).map(x => new constructor(x)),
            i.encode, 
            i.props);
    }
}

function getTypeFromConstructor<A>(constructor: Constructor<A>) {
    let i = constructor as any;
    if(i.getType){
        return i.getType() as t.InterfaceType<any>;
    }

    return null;
}

export function ref<P, A, O = A, I = t.mixed>(constructor: Constructor<A>): ClassType<P, A, O, I> {
    let type = getTypeFromConstructor(constructor) as t.InterfaceType<P, A, O, I> | null;
    if(type !== null){
        const tag = (type as any)['_tag'];
        if(tag === "InterfaceType"){
            return new ClassType(constructor, type);
        }
    }

    throw 'constructor has no runtime type data!'
}

export function decode<A>(constructor: Constructor<A>, input: t.mixed)  {
    let type = getTypeFromConstructor(constructor);
    if(type !== null){
        const tag = (type as any)['_tag'];
        if(tag === "InterfaceType"){
            const decodeResult = type.decode(input);
            return decodeResult.map(x => new constructor(x));
        }
    }

    throw 'cannot decode.. constructor has no runtime type data!'
}