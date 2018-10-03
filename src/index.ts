import * as t from 'io-ts';
import { ThrowReporter } from 'io-ts/lib/ThrowReporter';
import * as moment from 'moment';

import { getDefault } from './defaults';

export { getDefault, registerDefault, ITypeDefault, tagDefault, tagContainsDefault } from './defaults';

export type DateTime = moment.Moment

export class DateTimeType extends t.Type<DateTime>{
    readonly _tag: 'DateTime' = 'DateTime';
    constructor() {
        super(
            'DateTime',
            (mixed: any): mixed is DateTime => moment.isMoment(mixed),
            (mixed: any, context: any) => {
                if(typeof mixed === "string"){
                    const instance = moment(mixed);
                    return instance.isValid() ? t.success(instance) : t.failure(mixed, context)
                }
                else if(moment.isMoment(mixed)) {
                    const instance: moment.Moment = mixed as moment.Moment;
                    return instance.isValid() ? t.success(instance) : t.failure(mixed, context)
                }
                return t.failure(mixed, context);
            },
            instance => instance
        );
    }
}

export const DateTime = new DateTimeType();

export interface ITyped<P, A = any, O = any, I = t.mixed> {
    getType(): t.InterfaceType<P, A, O, I>;
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

export function DeriveClass<P, A, O, I>(type: t.InterfaceType<P, A, O, I>, defaults: Partial<t.TypeOf<typeof type>> | undefined = undefined)
: new (input?: Partial<t.TypeOf<typeof type>>) => t.TypeOf<typeof type> & ITyped<P, A, O, I> {
    return class implements ITyped<P, A, O, I> {
        constructor(input?: Partial<t.TypeOf<typeof type>>) {
            assignDefaults(this);
            if(defaults){
                applyPartial(type, this, defaults);
            }
            if(input){
                applyPartial(type, this, input);
            }
        }

        static getType() { return type; }
        public getType() { return type; }
    } as any;
}

export class ClassType<P, A, O, I> extends t.InterfaceType<P, A, O, I> {
    constructor(public cons: Constructor<A>, i: t.InterfaceType<P, A, O, I>) {
        super(
            cons.name, 
            i.is, 
            (input, ctx) => i.validate(input, ctx).map(x => new cons(x)),
            i.encode, 
            i.props);
    }
}

function getTypeFromConstructor<A>(cons: Constructor<A>) {
    let i = cons as any;
    if(i.getType){
        return i.getType() as t.InterfaceType<any>;
    }

    return null;
}

export function ref<P, A, O = A, I = t.mixed>(cons: Constructor<A>): ClassType<P, A, O, I> {
    let type = getTypeFromConstructor(cons) as t.InterfaceType<P, A, O, I> | null;
    if(type !== null){
        const tag = (type as any)['_tag'];
        if(tag === "InterfaceType"){
            return new ClassType(cons, type);
        }
    }

    throw new Error('constructor has no runtime type data!');
}

export function decode<A>(cons: Constructor<A>, input: t.mixed)  {
    let type = getTypeFromConstructor(cons);
    if(type !== null){
        const tag = (type as any)['_tag'];
        if(tag === "InterfaceType"){
            const decodeResult = type.decode(input);
            return decodeResult.map(x => new cons(x));
        }
    }

    throw new Error('cannot decode.. constructor has no runtime type data!');
}

export function getType(input: any): t.InterfaceType<any> | null {
    if(input && input.getType) {
        let t = input.getType();
        if(t){
            const tag = (t as any)['_tag'];
            if(tag === "InterfaceType"){
                return t as t.InterfaceType<any>;
            }
        }
    }

    return null;
}