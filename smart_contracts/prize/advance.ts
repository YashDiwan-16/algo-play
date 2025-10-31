import {
  type Account,
  arc4,
  assert,
  BoxMap,
  type bytes,
  Contract,
  GlobalState,
  gtxn,
  itxn,
  Txn,
  Uint64,
  type uint64,
} from "@algorandfoundation/algorand-typescript";

export class Prize extends Contract {
  // Global state for the contract
  totalPool = GlobalState<uint64>({ initialValue: Uint64(0) });
  initialized = GlobalState<boolean>({ initialValue: false });

  // Box storage for individual games (use a non-empty keyPrefix)
  gamePlays = BoxMap<bytes, uint64>({ keyPrefix: "plays" }); // gameCid -> play count
  gameOwners = BoxMap<bytes, Account>({ keyPrefix: "owners" }); // gameCid -> owner
  gameRewards = BoxMap<bytes, uint64>({ keyPrefix: "rewards" }); // gameCid -> pending rewards

  @arc4.abimethod()
  init(): void {
    this.totalPool.value = Uint64(0);
    this.initialized.value = true;
  }

  @arc4.abimethod()
  registerGame(gameCid: bytes, owner: Account): void {
    assert(this.initialized.value, "Not initialized");

    // Initialize game if not already registered
    if (!this.gameOwners(gameCid).exists) {
      this.gameOwners(gameCid).value = owner;
      this.gamePlays(gameCid).value = Uint64(0);
      this.gameRewards(gameCid).value = Uint64(0);
    }
  }

  @arc4.abimethod()
  recordPlay(gameCid: bytes): void {
    assert(this.initialized.value, "Not initialized");
    assert(this.gameOwners(gameCid).exists, "Game not registered");

    // Increment play count
    const currentPlays = this.gamePlays(gameCid).value;
    const newPlays = currentPlays + Uint64(1);
    this.gamePlays(gameCid).value = newPlays;

    // Check if we've reached 100 plays for a reward
    if (newPlays % Uint64(100) === Uint64(0)) {
      const currentRewards = this.gameRewards(gameCid).value;
      this.gameRewards(gameCid).value = currentRewards + Uint64(10_000_000); // 10 ALGO
    }
  }

  @arc4.abimethod({ readonly: true })
  getGamePlays(gameCid: bytes): uint64 {
    assert(this.initialized.value, "Not initialized");
    if (!this.gamePlays(gameCid).exists) {
      return Uint64(0);
    }
    return this.gamePlays(gameCid).value;
  }

  @arc4.abimethod({ readonly: true })
  getGameRewards(gameCid: bytes): uint64 {
    assert(this.initialized.value, "Not initialized");
    if (!this.gameRewards(gameCid).exists) {
      return Uint64(0);
    }
    return this.gameRewards(gameCid).value;
  }

  @arc4.abimethod()
  fundPool(): void {
    assert(this.initialized.value, "Not initialized");
    const payTxn = gtxn.PaymentTxn(Uint64(0));
    assert(
      payTxn.receiver === Txn.applicationId.address,
      "Payment must be to contract"
    );
    this.totalPool.value += payTxn.amount;
  }

  @arc4.abimethod({ readonly: true })
  getPoolBalance(): uint64 {
    return this.totalPool.value;
  }

  @arc4.abimethod()
  claimRewards(gameCid: bytes): void {
    assert(this.initialized.value, "Not initialized");
    assert(this.gameOwners(gameCid).exists, "Game not registered");
    assert(
      Txn.sender === this.gameOwners(gameCid).value,
      "Only game owner can claim"
    );

    const claimable = this.gameRewards(gameCid).value;
    assert(claimable > Uint64(0), "Nothing to claim");
    assert(this.totalPool.value >= claimable, "Not enough pool");

    itxn
      .payment({
        receiver: this.gameOwners(gameCid).value,
        amount: claimable,
        fee: 0,
      })
      .submit();

    this.totalPool.value -= claimable;
    this.gameRewards(gameCid).value = Uint64(0);
  }
}
