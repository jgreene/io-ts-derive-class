import * as t from 'io-ts'

export interface ITyped<P, A = any, O = any, I = t.mixed> {
    getType(): t.InterfaceType<P, A, O, I>;
}

function getDefault(type: t.Type<any>): any {
    if(type instanceof t.StringType)
    {
        return '';
    }

    if(type instanceof t.NumberType)
    {
        return 0;
    }
    
    if(type instanceof t.BooleanType)
    {
        return false;
    }

    if(type instanceof t.ArrayType){
        return [];
    }

    if(type instanceof t.ObjectType)
    {
        return {};
    }

    if(type instanceof t.DictionaryType)
    {
        return {};
    }

    if(type instanceof ClassType) {
        return new type.constructor();
    }

    if(type instanceof t.InterfaceType){
        const res: any = {};
        for(const p in type.props){
            res[p] = getDefault(type.props[p]);
        }

        return res;
    }

    return undefined;
}

function assignDefaults<P, A = any, O = any, I = t.mixed>(input: ITyped<P, A, O, I>) {
    const type = input.getType();
    const result = getDefault(type);
    Object.assign(input, result);
}

export type Constructor<T = {}> = new (...args: any[]) => T;

export function DeriveClass<P, A, O, I>(type: t.InterfaceType<P, A, O, I>)
: Constructor<t.TypeOf<typeof type> & ITyped<P, A, O, I>> {
    return class implements ITyped<P, A, O, I> {
        constructor(input?: Partial<t.TypeOf<typeof type>>) {
            assignDefaults(this);
            if(input){
                Object.assign(this, input);
            }
        }

        static getType() { return type; }
        public getType() { return type; }
    } as any;
}

export class ClassType<P, A, O, I> extends t.InterfaceType<P, A, O, I> {
    constructor(public constructor: Constructor<A>, i: t.InterfaceType<P, A, O, I>) {
        super(constructor.name, i.is, i.validate, i.encode, i.props);
    }
}

export function ref<P, A, O, I>(input: Constructor<A>): ClassType<P, A, O, I> {
    let i = input as any;
    if(i.getType){
        const type = i.getType() as t.InterfaceType<P, A, O, I>;
        if(type instanceof t.InterfaceType){
            return new ClassType(i, type);
        }
    }
    return null as any;
}