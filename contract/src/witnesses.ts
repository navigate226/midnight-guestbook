import { Ledger } from "./managed/guestbook/contract/index.cjs";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type GuestbookPrivateState = {
  readonly secretKey: Uint8Array;
};

export const guestbookPrivateState = (secretKey: Uint8Array) => ({
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