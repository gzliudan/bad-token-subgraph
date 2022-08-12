import { Address, BigDecimal, BigInt, Bytes, store } from '@graphprotocol/graph-ts';

import { Account, BlackList, AccountBlackList, Transaction, Erc20Contract, Erc20Balance, Erc20Approval, Erc20Transfer } from '../generated/schema';

import {
    BadToken as BadTokenContract,
    Transfer as TransferEvent,
    Approval as ApprovalEvent,
    BlacklistUpdated as BlacklistUpdatedEvent,
} from '../generated/BadToken/BadToken';

const DEFAULT_DECIMALS: u32 = 18;
const BIGINT_ZERO = BigInt.fromI32(0);
const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

function toDecimals(value: BigInt, decimals: u32): BigDecimal {
    const precision = BigInt.fromI32(10)
        .pow(<u8>decimals)
        .toBigDecimal();

    return value.divDecimal(precision);
}

function fetchAccount(address: Address): Account {
    const accountId = 'xdc' + address.toHexString().slice(2);
    let account = Account.load(accountId);

    if (account == null) {
        account = new Account(accountId);
        account.isErc20 = false;
        account.save();
    }

    return account;
}

function fetchBlackList(address: Address): BlackList {
    const blackListId = 'xdc' + address.toHexString().slice(2);
    let blackList = BlackList.load(blackListId);

    if (blackList == null) {
        blackList = new BlackList(blackListId);
        blackList.save();
    }

    return blackList;
}

export function createAccountBlackList(account: Account, blackList: BlackList): void {
    const accountBlackListId = account.id + '-' + blackList.id;
    let accountBlackList = AccountBlackList.load(accountBlackListId);

    if (accountBlackList == null) {
        accountBlackList = new AccountBlackList(accountBlackListId);
        accountBlackList.account = account.id;
        accountBlackList.blackList = blackList.id;
        accountBlackList.save();
    }
}

export function removeAccountBlackList(account: Account, blackList: BlackList): void {
    const accountBlackListId = account.id + '-' + blackList.id;
    store.remove('AccountBlackList', accountBlackListId);
}

function fetchErc20(address: Address): Erc20Contract {
    const contractId = 'xdc' + address.toHexString().slice(2);
    let contract = Erc20Contract.load(contractId);

    if (contract == null) {
        // const endpoint = BadTokenContract.bind(address);
        // const name = endpoint.try_name();
        // const symbol = endpoint.try_symbol();
        // const decimals = endpoint.try_decimals();

        contract = new Erc20Contract(contractId);
        // contract.name = name.reverted ? null : name.value;
        // contract.symbol = symbol.reverted ? null : symbol.value;
        // contract.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;
        // contract.totalSupply = fetchErc20Balance(contract, null).id;
        contract.name = 'Demo Gold Token';
        contract.symbol = 'DGLD';
        contract.decimals = DEFAULT_DECIMALS;
        contract.totalSupply = fetchErc20Balance(contract, null).id;
        contract.save();

        let account = fetchAccount(address);
        account.isErc20 = true;
        account.save();

        fetchBlackList(address);
    }

    return contract;
}

function fetchErc20Balance(contract: Erc20Contract, account: Account | null): Erc20Balance {
    const balanceId = contract.id + '-' + (account ? account.id : 'totalSupply');
    let balance = Erc20Balance.load(balanceId);

    if (balance == null) {
        balance = new Erc20Balance(balanceId);
        balance.contract = contract.id;
        balance.account = account ? account.id : null;
        balance.value = BIGDECIMAL_ZERO;
        balance.valueExact = BIGINT_ZERO;
        balance.save();
    }

    return balance;
}

function fetchErc20Approval(contract: Erc20Contract, owner: Account, spender: Account): Erc20Approval {
    const approvalId = contract.id + '-' + owner.id + '-' + spender.id;
    let approval = Erc20Approval.load(approvalId);

    if (approval == null) {
        approval = new Erc20Approval(approvalId);
        approval.contract = contract.id;
        approval.owner = owner.id;
        approval.spender = spender.id;
        approval.value = BIGDECIMAL_ZERO;
        approval.valueExact = BIGINT_ZERO;
    }

    return approval;
}

function fetchTransaction(hash: Bytes, timestamp: BigInt, blockNumber: BigInt): Transaction {
    const transactionId = hash.toHexString();
    let transaction = Transaction.load(transactionId);

    if (transaction == null) {
        transaction = new Transaction(transactionId);
        transaction.timestamp = timestamp;
        transaction.blockNumber = blockNumber;
        transaction.save();
    }

    return transaction;
}

// event Transfer(address indexed from, address indexed to, uint256 value);
export function handleTransfer(event: TransferEvent): void {
    const transaction = fetchTransaction(event.transaction.hash, event.block.timestamp, event.block.number);

    const erc20TransferId = transaction.id + '-' + event.logIndex.toString();
    let erc20Transfer = new Erc20Transfer(erc20TransferId);

    const contract = fetchErc20(event.address);
    erc20Transfer.emitter = contract.id;
    erc20Transfer.transaction = transaction.id;
    erc20Transfer.timestamp = event.block.timestamp;
    erc20Transfer.contract = contract.id;
    erc20Transfer.value = toDecimals(event.params.value, contract.decimals);
    erc20Transfer.valueExact = event.params.value;

    if (event.params.from == Address.zero()) {
        let totalSupply = fetchErc20Balance(contract, null);
        totalSupply.valueExact = totalSupply.valueExact.plus(event.params.value);
        totalSupply.value = toDecimals(totalSupply.valueExact, contract.decimals);
        totalSupply.save();
    } else {
        const fromAccount = fetchAccount(event.params.from);
        let balance = fetchErc20Balance(contract, fromAccount);
        balance.valueExact = balance.valueExact.minus(event.params.value);
        balance.value = toDecimals(balance.valueExact, contract.decimals);
        balance.save();

        erc20Transfer.from = fromAccount.id;
        erc20Transfer.fromBalance = balance.id;
    }

    if (event.params.to == Address.zero()) {
        let totalSupply = fetchErc20Balance(contract, null);
        totalSupply.valueExact = totalSupply.valueExact.minus(event.params.value);
        totalSupply.value = toDecimals(totalSupply.valueExact, contract.decimals);
        totalSupply.save();
    } else {
        const toAccount = fetchAccount(event.params.to);
        let balance = fetchErc20Balance(contract, toAccount);
        balance.valueExact = balance.valueExact.plus(event.params.value);
        balance.value = toDecimals(balance.valueExact, contract.decimals);
        balance.save();

        erc20Transfer.to = toAccount.id;
        erc20Transfer.toBalance = balance.id;
    }

    erc20Transfer.save();
}

// event Approval(address indexed owner, address indexed spender, uint256 value);
export function handleApproval(event: ApprovalEvent): void {
    const contract = fetchErc20(event.address);
    const owner = fetchAccount(event.params.owner);
    const spender = fetchAccount(event.params.spender);

    let approval = fetchErc20Approval(contract, owner, spender);
    approval.valueExact = event.params.value;
    approval.value = toDecimals(event.params.value, contract.decimals);
    approval.save();
}

// event BlacklistUpdated(address indexed user, bool value);
export function handleBlacklistUpdated(event: BlacklistUpdatedEvent): void {
    const user = fetchAccount(event.params.user);
    const blackList = fetchBlackList(event.address);

    if (event.params.value) {
        createAccountBlackList(user, blackList);
    } else {
        removeAccountBlackList(user, blackList);
    }
}
