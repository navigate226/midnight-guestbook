import {
  Contract,
  Witnesses,
  Guestbook,
  GuestbookStatus,
  Message,
} from "@guestbook/guestbook-contract";
import type { GuestbookPrivateState } from "@guestbook/guestbook-contract";

import { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";

export const GuestbookPrivateStateId = "guestbookPrivateState";
export type GuestbookPrivateStateId = typeof GuestbookPrivateStateId;
export type GuestbookContract = Contract<
  GuestbookPrivateState,
  Witnesses<GuestbookPrivateState>
>;

export type TokenCircuitKeys = Exclude<
  keyof GuestbookContract["impureCircuits"],
  number | symbol
>;

export type GuestbookContractProviders = MidnightProviders<
  TokenCircuitKeys,
  GuestbookPrivateStateId,
  GuestbookPrivateState
>;

export type DeployedGuestbookOnchainContract =
  FoundContract<GuestbookContract>;

export type DerivedGuestbookContractState = {
  readonly guestbooks: DerivedGuestbook[];
  readonly messages: DerivedMessage[];
};

export type DerivedGuestbook = {
  id: string;
  guestbook: Guestbook;
};

export type DerivedMessage = {
  id: string;
  message: Message;
};
