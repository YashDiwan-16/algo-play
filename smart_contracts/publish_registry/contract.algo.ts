import {
  arc4,
  Bytes,
  type bytes,
  Contract,
  GlobalState,
  Uint64,
  type uint64,
} from "@algorandfoundation/algorand-typescript";

export class PublishRegistry extends Contract {
  // Global state (one game per app instance)
  gameCid = GlobalState<bytes>();
  version = GlobalState<bytes>();
  owner = GlobalState<bytes>();
  parentCid = GlobalState<bytes>();
  timestamp = GlobalState<uint64>();

  // register(gameCid, version, owner, parentCid) -> void
  @arc4.abimethod()
  register(
    gameCid: bytes,
    version: bytes,
    owner: bytes,
    parentCid: bytes
  ): void {
    // Store the latest registration details
    this.gameCid.value = gameCid;
    this.version.value = version;
    this.owner.value = owner;
    this.parentCid.value = parentCid;
    this.timestamp.value = Uint64(0);
  }

  // getGameInfo(gameCid) -> (version, owner, parentCid, timestamp)
  @arc4.abimethod({ readonly: true })
  getGameInfo(gameCid: bytes): [bytes, bytes, bytes, uint64] {
    // Require that the queried gameCid matches current app's gameCid
    if (this.gameCid.value !== gameCid) {
      // On mismatch, return defaults (or revert/abort as desired)
      return [Bytes(""), Bytes(""), Bytes(""), Uint64(0)];
    }
    return [
      this.version.value,
      this.owner.value,
      this.parentCid.value,
      this.timestamp.value,
    ];
  }

  // getParentCid(gameCid) -> parentCid
  @arc4.abimethod({ readonly: true })
  getParentCid(gameCid: bytes): bytes {
    if (this.gameCid.value !== gameCid) {
      return Bytes("");
    }
    return this.parentCid.value;
  }

  // isOwner(gameCid, address) -> bool
  @arc4.abimethod({ readonly: true })
  isOwner(gameCid: bytes, address: bytes): boolean {
    if (this.gameCid.value !== gameCid) {
      return false;
    }
    return this.owner.value === address;
  }
}
