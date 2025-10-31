import {
  type Account,
  abimethod,
  assert,
  Contract,
  GlobalState,
  itxn,
  Txn,
  Uint64,
  type uint64,
} from "@algorandfoundation/algorand-typescript";

export class AiPoolGameV2 extends Contract {
  owner = GlobalState<Account>();
  gameStatus = GlobalState<uint64>({ initialValue: Uint64(0) }); // 0 = waiting, 1 = active, 2 = finished
  totalPool = GlobalState<uint64>({ initialValue: Uint64(0) });
  humanStake = GlobalState<uint64>({ initialValue: Uint64(0) });
  botCount = GlobalState<uint64>({ initialValue: Uint64(0) });
  currentGamePool = GlobalState<uint64>({ initialValue: Uint64(0) });
  winner = GlobalState<uint64>({ initialValue: Uint64(0) }); // 0 = none, 1 = human, 2 = bots, 3 = draw

  @abimethod({ onCreate: "require" })
  init(): void {
    this.owner.value = Txn.sender;
    // Other state fields are already initialized via initialValue
  }

  @abimethod()
  fundPool(amount: uint64): void {
    assert(Txn.sender === this.owner.value, "Only owner can fund");
    assert(this.gameStatus.value === Uint64(0), "Game must be waiting");
    this.totalPool.value += amount;
  }

  @abimethod()
  joinGame(stake: uint64, botCount: uint64): void {
    assert(this.gameStatus.value === Uint64(0), "Game already started");
    assert(stake > Uint64(0), "Stake must be > 0");

    const botStake: uint64 = stake * botCount;
    assert(this.totalPool.value >= botStake, "Not enough pool funds");

    // Deduct bot stake
    this.totalPool.value -= botStake;

    // Track game state
    this.humanStake.value = stake;
    this.botCount.value = botCount;
    this.currentGamePool.value = stake + botStake;
    this.gameStatus.value = Uint64(1); // active
    this.winner.value = Uint64(0);
  }

  @abimethod()
  endGame(humanWon: uint64): void {
    assert(this.gameStatus.value === Uint64(1), "No active game");
    assert(
      humanWon === Uint64(0) ||
        humanWon === Uint64(1) ||
        humanWon === Uint64(2),
      "Invalid winner flag: 0=bots, 1=human, 2=draw"
    );

    if (humanWon === Uint64(1)) {
      // Human wins: send pool to human
      itxn
        .payment({
          receiver: Txn.sender,
          amount: this.currentGamePool.value,
          fee: 1000, // Standard minimum fee in microAlgos
        })
        .submit();

      this.winner.value = Uint64(1);
    } else if (humanWon === Uint64(0)) {
      // Bots win: add pool back to AI pool
      this.totalPool.value += this.currentGamePool.value;
      this.winner.value = Uint64(2);
    } else {
      // Draw: refund human stake and add bot stake back to AI pool
      itxn
        .payment({
          receiver: Txn.sender,
          amount: this.humanStake.value,
          fee: 1000, // Standard minimum fee in microAlgos
        })
        .submit();

      // Add bot stake back to AI pool
      const botStake: uint64 =
        this.currentGamePool.value - this.humanStake.value;
      this.totalPool.value += botStake;
      this.winner.value = Uint64(3); // draw
    }

    this.gameStatus.value = Uint64(2); // finished
  }

  @abimethod()
  resetGame(): void {
    assert(Txn.sender === this.owner.value, "Only owner can reset");
    assert(this.gameStatus.value === Uint64(2), "Game not finished yet");

    this.gameStatus.value = Uint64(0);
    this.humanStake.value = Uint64(0);
    this.botCount.value = Uint64(0);
    this.currentGamePool.value = Uint64(0);
    this.winner.value = Uint64(0);
  }

  @abimethod()
  emergencyWithdraw(): void {
    assert(Txn.sender === this.owner.value, "Only owner can withdraw");
    assert(
      this.gameStatus.value === Uint64(0) ||
        this.gameStatus.value === Uint64(1),
      "Game must be waiting or active"
    );

    if (this.gameStatus.value === Uint64(0)) {
      // Withdraw from waiting pool
      itxn
        .payment({
          receiver: this.owner.value,
          amount: this.totalPool.value,
          fee: 1000, // Standard minimum fee in microAlgos
        })
        .submit();
      this.totalPool.value = Uint64(0);
    } else {
      // Emergency withdraw during active game (for draw conditions)
      // Refund human stake and withdraw remaining AI pool
      if (this.humanStake.value > Uint64(0)) {
        itxn
          .payment({
            receiver: Txn.sender, // Human player gets their stake back
            amount: this.humanStake.value,
            fee: 1000,
          })
          .submit();
      }

      // Owner gets the AI pool funds
      itxn
        .payment({
          receiver: this.owner.value,
          amount: this.totalPool.value,
          fee: 1000,
        })
        .submit();

      // Reset all game state
      this.gameStatus.value = Uint64(2); // finished
      this.totalPool.value = Uint64(0);
      this.humanStake.value = Uint64(0);
      this.botCount.value = Uint64(0);
      this.currentGamePool.value = Uint64(0);
      this.winner.value = Uint64(3); // emergency draw
    }
  }

  @abimethod({ readonly: true })
  getTotalPool(): uint64 {
    return this.totalPool.value;
  }

  @abimethod({ readonly: true })
  getGameStatus(): uint64 {
    return this.gameStatus.value;
  }

  @abimethod({ readonly: true })
  getWinner(): uint64 {
    return this.winner.value;
  }
}
