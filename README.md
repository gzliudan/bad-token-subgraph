# bad-token-subgraph

The subgraph for BadToken on blockchain XinFin and Apothem

## 1. Setup work environment

### 1.1 Resolve host name `graph-node` by edit hosts file:

-   Linux: `/etc/hosts`
-   Windows: `C:\Windows\System32\drivers\etc\hosts`

### 1.2 Install node and yarn

It is best to use the latest LTS version, the package.json requires:

-   node: >=14.0.0
-   yarn: >=1.22.0

## 2. Clone this repo

```shell
git clone https://github.com/gzliudan/bad-token-subgraph
cd bad-token-subgraph
yarn
```

## 3. Build and deploy

### For apothem chain

```shell
yarn make:apothem && yarn create:apothem && yarn deploy:apothem
```

### For xinfin chain

```shell
yarn make:xinfin && yarn create:xinfin && yarn deploy:xinfin
```
