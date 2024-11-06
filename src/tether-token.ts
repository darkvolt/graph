import {
  AddedBlackList as AddedBlackListEvent,
  RemovedBlackList as RemovedBlackListEvent,
  Transfer as TransferEvent,
} from "../generated/TetherToken/TetherToken"
import {
  AddedBlackList,
  RemovedBlackList,
  Transfer,
  Holder, BlackList
} from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts";


export function handleAddedBlackList(event: AddedBlackListEvent): void {
  let entity = new AddedBlackList(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity._user = event.params._user

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let blackList = BlackList.load(event.params._user)
  if (!blackList){
    blackList = new BlackList(event.params._user)
    blackList.isBlackListed = true
    blackList.addBlackList = [entity.id]
    blackList.removeBlackList = []
  }else {
    blackList.isBlackListed = true
    blackList.addBlackList = blackList.addBlackList.concat([entity.id])
  }
  blackList.save()
}

export function handleRemovedBlackList(event: RemovedBlackListEvent): void {
  let entity = new RemovedBlackList(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity._user = event.params._user

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let blackList = BlackList.load(event.params._user)
  if (blackList){
    blackList.isBlackListed = false
    blackList.removeBlackList = blackList.removeBlackList.concat([entity.id])
  }else {
    blackList = new BlackList(event.params._user)
    blackList.isBlackListed = false
    blackList.addBlackList = []
    blackList.removeBlackList = [entity.id]
  }
  blackList.save()
}


export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value

  let holderFrom = Holder.load(event.params.from)
  if (!holderFrom){
    holderFrom = new Holder(event.params.from)
    const zero = BigInt.zero()
    holderFrom.balance = zero.minus(event.params.value)
    if (event.params.from.toHexString().toLowerCase() === '0xFc99f58A8974A4bc36e60E2d490Bb8D72899ee9f'.toLowerCase()){
      holderFrom.accountType = 'okxWeb3User'
    }else {
      holderFrom.accountType = 'onChain'
    }
    holderFrom.save()
  }else {
    let bal = holderFrom.balance
    holderFrom.balance = bal.minus(event.params.value)
    holderFrom.save()
  }
  
  let holderTo = Holder.load(event.params.to)
  if (!holderTo){
    holderTo = new Holder(event.params.to)
    holderTo.balance = event.params.value
    if (event.params.from.toHexString().toLowerCase() === '0xFc99f58A8974A4bc36e60E2d490Bb8D72899ee9f'.toLowerCase()){
      holderTo.accountType = 'okxWeb3User'
    }else {
      holderTo.accountType = 'onChain'
    }
    holderTo.save()
  }else {
    let bal = holderTo.balance
    holderTo.balance = bal.plus(event.params.value)
    holderTo.save()
  }

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
