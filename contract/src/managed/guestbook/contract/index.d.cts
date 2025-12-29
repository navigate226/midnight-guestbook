import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Guestbook = { id: Uint8Array;
                          title: Uint8Array;
                          creationDate: bigint;
                          owner: Uint8Array;
                          messageAmmount: bigint;
                          status: GuestbookStatus
                        };

export enum GuestbookStatus { Open = 0, Archived = 1 }

export type Witnesses<T> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, T>): [T, Uint8Array];
}

export type ImpureCircuits<T> = {
  createGuestbook(context: __compactRuntime.CircuitContext<T>,
                  guestbookTitle_0: Uint8Array,
                  guestbookCreationDate_0: bigint): __compactRuntime.CircuitResults<T, []>;
  archiveGuestbook(context: __compactRuntime.CircuitContext<T>,
                   guestbookId_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  updateGuestbook(context: __compactRuntime.CircuitContext<T>,
                  guestbookId_0: Uint8Array,
                  newTitle_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  writeMessage(context: __compactRuntime.CircuitContext<T>,
               guestbookId_0: Uint8Array,
               guestMessage_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
}

export type PureCircuits = {
}

export type Circuits<T> = {
  createGuestbook(context: __compactRuntime.CircuitContext<T>,
                  guestbookTitle_0: Uint8Array,
                  guestbookCreationDate_0: bigint): __compactRuntime.CircuitResults<T, []>;
  archiveGuestbook(context: __compactRuntime.CircuitContext<T>,
                   guestbookId_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  updateGuestbook(context: __compactRuntime.CircuitContext<T>,
                  guestbookId_0: Uint8Array,
                  newTitle_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  writeMessage(context: __compactRuntime.CircuitContext<T>,
               guestbookId_0: Uint8Array,
               guestMessage_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
}

export type Ledger = {
  readonly guestbookCounter: bigint;
  readonly messageCounter: bigint;
  guestbooks: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Guestbook;
    [Symbol.iterator](): Iterator<[Uint8Array, Guestbook]>
  };
  guests: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined
  };
  guestbooksMessages: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { id: Uint8Array, message: Uint8Array };
    [Symbol.iterator](): Iterator<[Uint8Array, { id: Uint8Array, message: Uint8Array }]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;
