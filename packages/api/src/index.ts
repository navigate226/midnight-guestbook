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

  archiveMessage: (
    id: string
  ) => Promise<FinalizedCallTxData<GuestbookContract, "archiveMessage">>;

  updateGuestbook: (
    id: string,
    title: string
  ) => Promise<FinalizedCallTxData<GuestbookContract, "updateGuestbook">>;

  writeMessage: (
    id: string,
    message: string
  ) => Promise<FinalizedCallTxData<GuestbookContract, "writeMessage">>;

  editMessage: (
    id: string,
    message: string
  ) => Promise<FinalizedCallTxData<GuestbookContract, "editMessage">>;

  canEditMessage: (messageId: string) => Promise<boolean>;

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
    private readonly providers: GuestbookContractProviders,
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
          archivedGuestbooks: utils.createDerivedGuestbooksArray(ledgerState.archievedGuestbooks),
          messages: utils.createDerivedMessagesArray(ledgerState.guestbooksMessages),
          archivedMessages: utils.createDerivedMessagesArray(ledgerState.archievedGuestbooksMessages),
          guestbookCounter: ledgerState.guestbookCounter,
          messageCounter: ledgerState.messageCounter,
          archivedGuestbookCounter: ledgerState.archivedGuestbookCounter,
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

    // Get all messages for this guestbook before archiving
    const messages = this.getMessagesForGuestbook(id);
    this.logger?.info(`Found ${messages.length} messages to archive`);

    const counterNum = utils.uuidStringToCounterNumber(id);
    const guestbookIdBytes = utils.numberToUint8Array(counterNum);
    
    // First, archive the guestbook
    const txData = await this.allReadyDeployedContract.callTx.archiveGuestbook(guestbookIdBytes);

    // Then archive all messages belonging to this guestbook
    for (const message of messages) {
      this.logger?.info(`Archiving message ${message.id}...`);
      await this.archiveMessage(message.id);
    }

    this.logger?.trace({
      transactionAdded: {
        circuit: "archiveGuestbook",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async archiveMessage(
    id: string
  ): Promise<FinalizedCallTxData<GuestbookContract, "archiveMessage">> {
    this.logger?.info(`Archiving message with id ${id}...`);

    const counterNum = utils.uuidStringToCounterNumber(id);
    const messageIdBytes = utils.numberToUint8Array(counterNum);
    
    const txData = await this.allReadyDeployedContract.callTx.archiveMessage(messageIdBytes);

    this.logger?.trace({
      transactionAdded: {
        circuit: "archiveMessage",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHeight: txData.public.blockHeight,
          blockHash: txData.public.blockHash,
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

  /**
   * Edit an existing message.
   * 
   * IMPORTANT: Only the original author of the message can edit it.
   * The contract will verify that the caller is the author using their local secret key.
   * If a non-author attempts to edit a message, the transaction will fail with an assertion error.
   * 
   * @param id - The message ID (as a UUID string)
   * @param message - The new message content
   * @returns Promise resolving to the finalized transaction data
   * @throws Error if the caller is not the message author or if the message doesn't exist
   */
  async editMessage(
    id: string,
    message: string
  ): Promise<FinalizedCallTxData<GuestbookContract, "editMessage">> {
    this.logger?.info(`Editing message with id ${id}...`);

    const counterNum = utils.uuidStringToCounterNumber(id);
    const txData = await this.allReadyDeployedContract.callTx.editMessage(utils.numberToUint8Array(counterNum), message);

    this.logger?.trace({
      transactionAdded: {
        circuit: "editMessage",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  /**
   * Check if the current user can edit a specific message.
   * 
   * This method verifies if the message author matches the current user's identity
   * by comparing guest commits. This is useful for UI/UX to show/hide edit buttons.
   * 
   * Note: This is a best-effort check for UX purposes. The actual authorization
   * is enforced by the smart contract. If this check passes but the transaction fails,
   * it means the user is not the author.
   * 
   * @param messageIdStr - The message ID (as a UUID string)
   * @returns Promise<boolean> - true if the current user might be the message author
   */
  async canEditMessage(messageIdStr: string): Promise<boolean> {
    try {
      const counterNum = utils.uuidStringToCounterNumber(messageIdStr);
      const messageIdBytes = utils.numberToUint8Array(counterNum);
      
      let currentState: DerivedGuestbookContractState | undefined;
      const subscription = this.state.subscribe((state) => {
        currentState = state;
      });
      subscription.unsubscribe();
      
      if (!currentState) {
        return false;
      }

      // Find the message
      const allMessages = [
        ...currentState.messages,
        ...currentState.archivedMessages,
      ];

      const targetMessage = allMessages.find((derivedMsg) => {
        return utils.arraysEqual(derivedMsg.message.id, messageIdBytes);
      });

      if (!targetMessage) {
        return false;
      }

      // Get the current user's private state to access their secret key
      const privateState = await this.providers.privateStateProvider.get(
        GuestbookPrivateStateId
      );
      
      if (!privateState) {
        return false;
      }

      // Generate the guest commit for the current user with the guestbook ID
      const guestbookIdBytes = targetMessage.message.guestbookId;
      
      try {
        const currentUserCommit = utils.generateGuestCommit(
          privateState.secretKey,
          guestbookIdBytes
        );

        // Compare with the message author
        return utils.arraysEqual(currentUserCommit, targetMessage.message.author);
      } catch (error) {
        // If guest commit generation fails, we can't verify but allow the attempt
        // The contract will enforce the actual check
        this.logger?.warn(`Could not generate guest commit for comparison: ${error}`);
        return true; // Optimistically allow - contract will enforce
      }
    } catch (error) {
      this.logger?.error(`Error checking edit permission: ${error}`);
      // Return true to allow the attempt - contract will enforce the actual check
      return true;
    }
  }

  getMessagesForGuestbook(guestbookIdStr: string): DerivedMessage[] {
    console.log(`[DEBUG] Fetching messages for guestbook ${guestbookIdStr}...`);
    
    const counterNum = utils.uuidStringToCounterNumber(guestbookIdStr);
    const guestbookIdBytes = utils.numberToUint8Array(counterNum);
    
    let currentState: DerivedGuestbookContractState | undefined;
    const subscription = this.state.subscribe((state) => {
      currentState = state;
    });
    subscription.unsubscribe();
    
    if (!currentState) {
      console.log(`[DEBUG] No state available yet`);
      return [];
    }

    const allMessages = [
      ...currentState.messages,
      ...currentState.archivedMessages,
    ];

    const currentMessages = allMessages.filter((derivedMsg) => {
      const msgGuestbookId = derivedMsg.message.guestbookId;
      return utils.arraysEqual(msgGuestbookId, guestbookIdBytes);
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
