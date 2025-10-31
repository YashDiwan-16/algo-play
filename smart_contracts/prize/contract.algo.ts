import {
  type Account,
  arc4,
  assert,
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
  gameCid = GlobalState<bytes>();
  owner = GlobalState<Account>();
  rewardPer100 = GlobalState<uint64>();
  playsSinceLastReward = GlobalState<uint64>();
  pendingOwner = GlobalState<uint64>();
  totalPool = GlobalState<uint64>();
  initialized = GlobalState<boolean>();

  @arc4.abimethod()
  init(gameCid: bytes, owner: Account, rewardPer100: uint64): void {
    this.gameCid.value = gameCid;
    this.owner.value = owner;
    this.rewardPer100.value = rewardPer100;
    this.playsSinceLastReward.value = Uint64(0);
    this.pendingOwner.value = Uint64(0);
    this.totalPool.value = Uint64(0);
    this.initialized.value = true;
  }

  @arc4.abimethod()
  recordPlay(): void {
    assert(this.initialized.value, "Not initialized");
    this.playsSinceLastReward.value += Uint64(1);
    while (this.playsSinceLastReward.value >= Uint64(100)) {
      this.pendingOwner.value += this.rewardPer100.value;
      this.playsSinceLastReward.value -= Uint64(100);
    }
  }

  @arc4.abimethod({ readonly: true })
  getPending(): uint64 {
    return this.pendingOwner.value;
  }

  @arc4.abimethod()
  fundPool(paymentAmount: uint64): void {
    assert(this.initialized.value, "Not initialized");
    const payTxn = gtxn.PaymentTxn(Uint64(0));

    assert(payTxn.amount === paymentAmount, "Payment mismatch");
    this.totalPool.value += paymentAmount;
  }

  @arc4.abimethod({ readonly: true })
  getPoolBalance(): uint64 {
    return this.totalPool.value;
  }

  @arc4.abimethod()
  claimRewards(): void {
    assert(this.initialized.value, "Not initialized");
    assert(Txn.sender === this.owner.value, "Only owner can claim");

    const claimable = this.pendingOwner.value;
    assert(claimable > Uint64(0), "Nothing to claim");
    assert(this.totalPool.value >= claimable, "Not enough pool");

    itxn
      .payment({
        receiver: this.owner.value,
        amount: claimable,
        fee: 0,
      })
      .submit();

    this.totalPool.value -= claimable;
    this.pendingOwner.value = Uint64(0);
  }
}
