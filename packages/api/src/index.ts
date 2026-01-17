import { combineLatest, concat, from, map, Observable, tap, shareReplay } from "rxjs";
import { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import {
  deployContract,
  FinalizedCallTxData,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import {
  Contract,
  ledger,
  Ledger,
  GuestbookPrivateState,
  createGuestbookPrivateState,
  witnesses,
} from "@guestbook/guestbook-contract";
import { type Logger } from "pino";
import * as utils from "./utils.js";
import {
  GuestbookContract,
  GuestbookContractProviders,
  GuestbookPrivateStateId,
  DeployedGuestbookOnchainContract,
  DerivedGuestbookContractState,
  DerivedMessage,
} from "./common-types.js";

const GuestbookContractInstance: GuestbookContract = new Contract(
  witnesses
);

export interface DeployedGuestbookAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state: Observable<DerivedGuestbookContractState>;

  createGuestbook: (
    title: string,
    creationDate: number
  ) => Promise<FinalizedCallTxData<GuestbookContract, "createGuestbook">>;

  archiveGuestbook: (
    id: string
  )  => Promise<FinalizedCallTxData<GuestbookContract, "archiveGuestbook">>;

  updateGuestbook: (
    id: string,
    title: string
  ) => Promise<FinalizedCallTxData<GuestbookContract, "updateGuestbook">>;

  writeMessage: (
    id: string,
    message: string
  ) => Promise<FinalizedCallTxData<GuestbookContract, "writeMessage">>;

  getMessagesForGuestbook: (guestbookId: string) => DerivedMessage[];
}

/**
 * NB: Declaring a class implements a given type, means it must contain all defined properties and methods, then take on other extra properties or class
 */

export class GuestbookAPI implements DeployedGuestbookAPI {
  deployedContractAddress: string;
  state: Observable<DerivedGuestbookContractState>;

  // Within the constructor set the two properties of the API Class Object
  // Using access modifiers on parameters create a property instances for that parameter and stores it as part of the object
  /**
   * @param allReadyDeployedContract
   * @param logger becomes accessible s if they were decleared as static properties as part of the class
   */
  private constructor(
    providers: GuestbookContractProviders,
    public readonly allReadyDeployedContract: DeployedGuestbookOnchainContract,
    private logger?: Logger
  ) {
    this.deployedContractAddress =
      allReadyDeployedContract.deployTxData.public.contractAddress;

    // Set the state property
    this.state = combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, {
            type: "all",
          })
          .pipe(
            map((contractState) => ledger(contractState.data)),
            tap((ledgerState) =>
              logger?.trace({
                ledgerStaeChanged: {
                  ledgerState: {
                    ...ledgerState,
                  },
                },
              })
            )
          ),
        concat(
          from(providers.privateStateProvider.get(GuestbookPrivateStateId))
        ),
      ],
      (ledgerState, privateState) => {
        return {
          guestbooks: utils.createDerivedGuestbooksArray(ledgerState.guestbooks),
          messages: utils.createDerivedMessagesArray(ledgerState.guestbooksMessages),
        };
      }
    ).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  static async deployGuestbookContract(
    providers: GuestbookContractProviders,
    logger?: Logger
  ): Promise<GuestbookAPI> {
    logger?.info("deploy contract");
    /**
     * Should deploy a new contract to the blockchain
     * Return the newly deployed contract
     * Log the resulting data about of the newly deployed contract using (logger)
     */
    const deployedContract = await deployContract<GuestbookContract>(
      providers,
      {
        contract: GuestbookContractInstance,
        initialPrivateState: await GuestbookAPI.getPrivateState(providers),
        privateStateId: GuestbookPrivateStateId,
      }
    );

    logger?.trace("Deployment successfull", {
      contractDeployed: {
        finalizedDeployTxData: deployedContract.deployTxData.public,
      },
    });

    return new GuestbookAPI(providers, deployedContract, logger);
  }

  static async joinGuestbookContract(
    providers: GuestbookContractProviders,
    contractAddress: string,
    logger?: Logger
  ): Promise<GuestbookAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });
    /**
     * Should deploy a new contract to the blockchain
     * Return the newly deployed contract
     * Log the resulting data about of the newly deployed contract using (logger)
     */
    const existingContract = await findDeployedContract<GuestbookContract>(
      providers,
      {
        contract: GuestbookContractInstance,
        contractAddress: contractAddress,
        privateStateId: GuestbookPrivateStateId,
        initialPrivateState: await GuestbookAPI.getPrivateState(providers),
      }
    );

    logger?.trace("Found Contract...", {
      contractJoined: {
        finalizedDeployTxData: existingContract.deployTxData.public,
      },
    });
    return new GuestbookAPI(providers, existingContract, logger);
  }

  // export const getCounterLedgerState = async (
  //   providers: CounterProviders,
  //   contractAddress: ContractAddress,
  // ): Promise<bigint | null> => {
  //   assertIsContractAddress(contractAddress);
  //   logger.info('Checking contract ledger state...');
  //   const state = await providers.publicDataProvider
  //     .queryContractState(contractAddress)
  //     .then((contractState) => (contractState != null ? Counter.ledger(contractState.data).round : null));
  //   logger.info(`Ledger state: ${state}`);
  //   return state;
  // };

  async createGuestbook(
    title: string
  ): Promise<FinalizedCallTxData<GuestbookContract, "createGuestbook">> {
    this.logger?.info(`Creating guestbook with ID ...`); // understand how to read guestbookCounter value and add it here

    const txData = await this.allReadyDeployedContract.callTx.createGuestbook(title, BigInt(Date.now()));

    this.logger?.trace({
      transactionAdded: {
        circuit: "createCampaign",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async archiveGuestbook(
    id: string
  ): Promise<FinalizedCallTxData<GuestbookContract, "archiveGuestbook">> {
    this.logger?.info(`Archiving guestbook with id ${id}...`);

    const counterNum = utils.uuidStringToCounterNumber(id);
    const txData = await this.allReadyDeployedContract.callTx.archiveGuestbook(utils.numberToUint8Array(counterNum));

    this.logger?.trace({
      transactionAdded: {
        circuit: "endCampaign",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async updateGuestbook(
    id: string,
    title: string
  ): Promise<FinalizedCallTxData<GuestbookContract, "updateGuestbook">> {
    this.logger?.info(`Updating guestbook with id ${id}...`);

    const counterNum = utils.uuidStringToCounterNumber(id);
    const txData = await this.allReadyDeployedContract.callTx.updateGuestbook(utils.numberToUint8Array(counterNum), title);

    this.logger?.trace({
      transactionAdded: {
        circuit: "updateGuestbook",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async writeMessage(
    id: string,
    message: string
  ): Promise<FinalizedCallTxData<GuestbookContract, "writeMessage">> {
    this.logger?.info(`Writing message on guestbook with id ${id}...`);

    const counterNum = utils.uuidStringToCounterNumber(id);
    const txData = await this.allReadyDeployedContract.callTx.writeMessage(utils.numberToUint8Array(counterNum), message);

    this.logger?.trace({
      transactionAdded: {
        circuit: "writeMessage",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  getMessagesForGuestbook(guestbookIdStr: string): DerivedMessage[] {
    console.log(`[DEBUG] Fetching messages for guestbook ${guestbookIdStr}...`);
    
    // Convert the UUID string back to the counter number
    // The guestbook ID is stored as a counter value in messages
    const counterNum = utils.uuidStringToCounterNumber(guestbookIdStr);
    const guestbookIdBytes = utils.numberToUint8Array(counterNum);
    
    console.log(`[DEBUG] Converted to counter: ${counterNum}`);
    console.log(`[DEBUG] Target bytes (first 16): ${Array.from(guestbookIdBytes).slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
    
    // Get current state - need to use a shared replay or BehaviorSubject pattern
    // For now, access via a manual peek using the subscription's last emitted value
    let currentState: DerivedGuestbookContractState | undefined;
    const subscription = this.state.subscribe((state) => {
      currentState = state;
    });
    
    // Give subscription a tick to receive the value
    subscription.unsubscribe();
    
    if (!currentState) {
      console.log(`[DEBUG] No state available yet`);
      return [];
    }
    
    console.log(`[DEBUG] Total messages in state: ${currentState.messages.length}`);
    const currentMessages = currentState.messages.filter((derivedMsg) => {
      const msgGuestbookId = derivedMsg.message.guestbookId;
      console.log(`[DEBUG] Message ${derivedMsg.id} guestbookId (first 16): ${Array.from(msgGuestbookId).slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
      const matches = utils.arraysEqual(msgGuestbookId, guestbookIdBytes);
      console.log(`[DEBUG] Match result: ${matches}`);
      return matches;
    });
    console.log(`[DEBUG] Filtered messages count: ${currentMessages.length}`);
    
    return currentMessages;
  }

  // Used to get the private state from the wallets privateState Provider
  private static async getPrivateState(
    providers: GuestbookContractProviders
  ): Promise<GuestbookPrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get(
      GuestbookPrivateStateId
    );
    return (
      existingPrivateState ??
      createGuestbookPrivateState(utils.randomNonceBytes(32))
    );
  }
}

export * as utils from "./utils.js";

export * from "./common-types.js";
