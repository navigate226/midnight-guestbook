import { Guestbook, type GuestbookPrivateState } from '@midnight-ntwrk/guestbook-contract';
import type { ImpureCircuitId, MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js-contracts';

export type GuestbookCircuits = ImpureCircuitId<Guestbook.Contract<GuestbookPrivateState>>;

export const GuestbookPrivateStateId = 'GuestbookPrivateState';

export type GuestbookProviders = MidnightProviders<GuestbookCircuits, typeof GuestbookPrivateStateId, GuestbookPrivateState>;

export type GuestbookContract = Guestbook.Contract<GuestbookPrivateState>;

export type DeployedGuestbookContract = DeployedContract<GuestbookContract> | FoundContract<GuestbookContract>;