import { Ledger } from "./managed/guestbook/contract/index.cjs";
import {
  MerkleTreePath,
  WitnessContext,
} from "@midnight-ntwrk/compact-runtime";

export type GuestbookPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createGuestbookPrivateState = (secretKey: Uint8Array) => ({
  secretKey,
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, GuestbookPrivateState>): [
    GuestbookPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],
};