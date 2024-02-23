import {
	DERIVED,
	EFFECT,
	RENDER_EFFECT,
	SOURCE,
	PRE_EFFECT,
	EACH_BLOCK,
	EACH_ITEM_BLOCK,
	IF_BLOCK,
	HEAD_BLOCK,
	DYNAMIC_COMPONENT_BLOCK,
	DYNAMIC_ELEMENT_BLOCK,
	SNIPPET_BLOCK,
	STATE_SYMBOL
} from './constants.js';

// Put all internal types in this file. Once we convert to JSDoc, we can make this a d.ts file

export type SignalFlags =
	| typeof SOURCE
	| typeof DERIVED
	| typeof EFFECT
	| typeof PRE_EFFECT
	| typeof RENDER_EFFECT;
export type EffectType = typeof EFFECT | typeof PRE_EFFECT | typeof RENDER_EFFECT;

type EventCallback = (event: Event) => boolean;
export type EventCallbackMap = Record<string, EventCallback | EventCallback[]>;

export type Store<V> = {
	subscribe: (run: (value: V) => void) => () => void;
	set(value: V): void;
};

// For all the core internal objects, we use single-character property strings.
// This not only reduces code-size and parsing, but it also improves the performance
// when the JS VM JITs the code.

export type ComponentContext = {
	/** local signals (needed for beforeUpdate/afterUpdate) */
	d: null | Signal<any>[];
	/** props */
	s: Record<string, unknown>;
	/** exports (and props, if `accessors: true`) */
	x: Record<string, any> | null;
	/** effects */
	e: null | Array<EffectSignal>;
	/** mounted */
	m: boolean;
	/** parent */
	p: null | ComponentContext;
	/** context */
	c: null | Map<unknown, unknown>;
	/** runes */
	r: boolean;
	/** update_callbacks */
	u: null | {
		/** afterUpdate callbacks */
		a: Array<() => void>;
		/** beforeUpdate callbacks */
		b: Array<() => void>;
		/** onMount callbacks */
		m: Array<() => any>;
	};
};

// We keep two shapes rather than a single monomorphic shape to improve the memory usage.
// Source signals don't need the same shape as they simply don't do as much as computations
// (effects and derived signals). Thus we can improve the memory profile at the slight cost
// of some runtime performance.

export type SourceSignal<V = unknown> = {
	/** consumers: Signals that read from the current signal */
	c: null | ComputationSignal[];
	/** equals: For value equality */
	e: null | EqualsFunctions;
	/** flags: The types that the signal represent, as a bitwise value */
	f: SignalFlags;
	/** value: The latest value for this signal */
	v: V;
	// write version
	w: number;
};

export type SourceSignalDebug = {
	/** This is DEV only */
	inspect: Set<Function>;
};

export type ComputationSignal<V = unknown> = {
	/** block: The block associated with this effect/computed */
	b: null | Block;
	/** consumers: Signals that read from the current signal */
	c: null | ComputationSignal[];
	/** context: The associated component if this signal is an effect/computed */
	x: null | ComponentContext;
	/** dependencies: Signals that this signal reads from */
	d: null | Signal<V>[];
	/** destroy: Thing(s) that need destroying */
	y: null | (() => void) | Array<() => void>;
	/** equals: For value equality */
	e: null | EqualsFunctions;
	/** The types that the signal represent, as a bitwise value */
	f: SignalFlags;
	/** init: The function that we invoke for effects and computeds */
	i:
		| null
		| (() => V)
		| (() => void | (() => void))
		| ((b: Block, s: Signal) => void | (() => void));
	/** references: Anything that a signal owns */
	r: null | ComputationSignal[];
	/** value: The latest value for this signal, doubles as the teardown for effects */
	v: V;
	/** level: the depth from the root signal, used for ordering render/pre-effects topologically **/
	l: number;
	/** write version: used for unowned signals to track if their depdendencies are dirty or not **/
	w: number;
	parent: Signal | null;
};

export type BlockEffect<V = unknown> = ComputationSignal<V> & {
	in?: TransitionObject[];
	out?: TransitionObject[];
	dom?: TemplateNode | Array<TemplateNode>;
	ran?: boolean;
};

export type Signal<V = unknown> = SourceSignal<V> | ComputationSignal<V>;

export type SignalDebug<V = unknown> = SourceSignalDebug & Signal<V>;

export type EffectSignal = ComputationSignal<null | (() => void)>;

export type MaybeSignal<T = unknown> = T | Signal<T>;

export type UnwrappedSignal<T> = T extends Signal<infer U> ? U : T;

export type EqualsFunctions<T = any> = (a: T, v: T) => boolean;

export type BlockType =
	| typeof EACH_BLOCK
	| typeof EACH_ITEM_BLOCK
	| typeof IF_BLOCK
	| typeof SNIPPET_BLOCK
	| typeof HEAD_BLOCK
	| typeof DYNAMIC_COMPONENT_BLOCK
	| typeof DYNAMIC_ELEMENT_BLOCK;

export type TemplateNode = Text | Element | Comment;

export type Transition = {
	/** effect */
	e: EffectSignal;
	/** payload */
	p: null | TransitionPayload;
	/** init */
	i: (from?: DOMRect) => TransitionPayload;
	/** finished */
	f: (fn: () => void) => void;
	in: () => void;
	/** out */
	o: () => void;
	/** cancel */
	c: () => void;
	/** cleanup */
	x: () => void;
	/** direction */
	r: 'in' | 'out' | 'both' | 'key';
	/** dom */
	d: HTMLElement;
};

export type IfBlock = {
	/** value */
	v: boolean;
	/** dom */
	d: null | TemplateNode | Array<TemplateNode>;
	/** effect */
	e: null | EffectSignal;
	/** parent */
	p: Block;
	/** transition */
	r: null | ((transition: Transition) => void);
	/** consequent transitions */
	c: null | Set<Transition>;
	/** alternate transitions */
	a: null | Set<Transition>;
	/** effect */
	ce: null | EffectSignal;
	/** effect */
	ae: null | EffectSignal;
	/** type */
	t: typeof IF_BLOCK;
};

export type HeadBlock = {
	/** dom */
	d: null | TemplateNode | Array<TemplateNode>;
	/** effect */
	e: null | ComputationSignal;
	/** parent */
	p: Block;
	/** transition */
	r: null | ((transition: Transition) => void);
	/** type */
	t: typeof HEAD_BLOCK;
};

export type DynamicElementBlock = {
	/** dom */
	d: null | TemplateNode | Array<TemplateNode>;
	/** effect */
	e: null | ComputationSignal;
	/** parent */
	p: Block;
	/** transition */
	r: null | ((transition: Transition) => void);
	/** type */
	t: typeof DYNAMIC_ELEMENT_BLOCK;
};

export type DynamicComponentBlock = {
	/** dom */
	d: null | TemplateNode | Array<TemplateNode>;
	/** effect */
	e: null | ComputationSignal;
	/** parent */
	p: Block;
	/** transition */
	r: null | ((transition: Transition) => void);
	/** type */
	t: typeof DYNAMIC_COMPONENT_BLOCK;
};

export type EachBlock = {
	/** anchor */
	a: Element | Comment;
	/** flags */
	f: number;
	/** dom */
	d: null | TemplateNode | Array<TemplateNode>;
	/** items */
	v: EachItemBlock[];
	/** effewct */
	e: null | ComputationSignal;
	/** parent */
	p: Block;
	/** transition */
	r: null | ((transition: Transition) => void);
	/** transitions */
	s: Array<EachItemBlock>;
	/** type */
	t: typeof EACH_BLOCK;
};

export type EachItemBlock = {
	/** transition */
	a: null | ((block: EachItemBlock, transitions: Set<Transition>) => void);
	/** dom */
	d: null | TemplateNode | Array<TemplateNode>;
	/** effect */
	e: ComputationSignal;
	/** item */
	v: any | Signal<any>;
	/** index */
	i: number | Signal<number>;
	/** key */
	k: unknown;
	/** parent */
	p: EachBlock;
	/** transition */
	r: null | ((transition: Transition) => void);
	/** transitions */
	s: null | Set<Transition>;
	/** type */
	t: typeof EACH_ITEM_BLOCK;
};

export type SnippetBlock = {
	/** dom */
	d: null | TemplateNode | Array<TemplateNode>;
	/** parent */
	p: Block;
	/** effect */
	e: null | ComputationSignal;
	/** transition */
	r: null;
	/** type */
	t: typeof SNIPPET_BLOCK;
};

export type Block =
	| IfBlock
	| DynamicElementBlock
	| DynamicComponentBlock
	| HeadBlock
	| EachBlock
	| EachItemBlock
	| SnippetBlock;

export type TransitionFn<P> = (
	element: Element,
	props: P,
	options: { direction?: 'in' | 'out' | 'both' }
) => TransitionPayload;

export type AnimateFn<P> = (
	element: Element,
	rects: { from: DOMRect; to: DOMRect },
	props: P,
	options: {}
) => TransitionPayload;

export type TransitionPayload = {
	delay?: number;
	duration?: number;
	easing?: (t: number) => number;
	css?: (t: number, u: number) => string;
	tick?: (t: number, u: number) => string;
};

export type StoreReferencesContainer = Record<
	string,
	{
		store: Store<any> | null;
		last_value: any;
		unsubscribe: Function;
		value: Signal<any>;
	}
>;

export type ActionPayload<P> = { destroy?: () => void; update?: (value: P) => void };

export type Render = {
	/** dom */
	d: null | TemplateNode | Array<TemplateNode>;
	/** effect */
	e: null | EffectSignal;
	/** transitions */
	s: Set<Transition>;
	/** prev */
	p: Render | null;
};

export type Raf = {
	tick: (callback: (time: DOMHighResTimeStamp) => void) => any;
	now: () => number;
};

export interface Task {
	abort(): void;
	promise: Promise<void>;
}

export type TaskCallback = (now: number) => boolean | void;

export type TaskEntry = { c: TaskCallback; f: () => void };

export interface ProxyMetadata<T = Record<string | symbol, any>> {
	/** A map of signals associated to the properties that are reactive */
	s: Map<string | symbol, SourceSignal<any>>;
	/** A version counter, used within the proxy to signal changes in places where there's no other way to signal an update */
	v: SourceSignal<number>;
	/** `true` if the proxified object is an array */
	a: boolean;
	/** Immutable: Whether to use a source or mutable source under the hood */
	i: boolean;
	/** The associated proxy */
	p: ProxyStateObject<T>;
	/** The original target this proxy was created for */
	t: T;
	/** Dev-only — the components that 'own' this state, if any */
	o: null | Set<Function>;
}

export type ProxyStateObject<T = Record<string | symbol, any>> = T & {
	[STATE_SYMBOL]: ProxyMetadata;
};

// TODO remove the other transition types once we're
// happy we don't need them, and rename this
export interface TransitionObject {
	global: boolean;
	to(target: number, callback?: () => void): void;
}
