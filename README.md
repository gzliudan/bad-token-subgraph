# bad-token-subgraph

The subgraph for BadToken on blockchain XinFin and Apothem

## 1. Setup work environment

### 1.1 Resolve host name `graph-node` by edit hosts file

- Linux: `/etc/hosts`
- Windows: `C:\Windows\System32\drivers\etc\hosts`

test:

```bash
ping graph-node
```

### 1.2 Install node and yarn

Suggest to use node v18, the package.json requires:

- node: >=18.0.0
- yarn: >=8.6.0

## 2. Clone this repo

```shell
git clone https://github.com/gzliudan/bad-token-subgraph
cd bad-token-subgraph
yarn
```

## 3. Build and deploy

### 3.1 For apothem chain

```shell
yarn make:apothem && yarn create:apothem && yarn deploy:apothem
```

### 3.2 For xinfin chain

```shell
yarn make:xinfin && yarn create:xinfin && yarn deploy:xinfin
```

## 4. Query

Endpoints:

- apothem network: <http://graph-node:8000/subgraphs/name/gzliudan/bad-token-subgraph-apothem>
- xinfin network: <http://graph-node:8000/subgraphs/name/gzliudan/bad-token-subgraph-xinfin>

Query statement:

```graphql
{
    erc20Contracts(first: 5) {
        id
        name
        symbol
        decimals
        totalSupply {
            value
            valueExact
        }
    }
    blackLists(first: 5) {
        id
        members {
            account {
                id
            }
        }
    }
    accounts(first: 5) {
        id
        isErc20
        blackLists {
            id
        }
        Erc20balances {
            id
            value
            valueExact
        }
    }
}
```
