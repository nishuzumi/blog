# zk-SNARKs 简介

> 本文翻译自 [Consensys](https://consensys.net/blog/developers/introduction-to-zk-snarks/)  
> 翻译者：[@BoxMrChen](https://twitter.com/home)

在这篇文章中，我们的目标是从实用的角度对 zk-SNARKs 进行概述。我们将把实际的数学问题视为一个黑箱，并试图围绕我们如何使用它们来发展一些直觉。我们还将展示一项关于[ 在以太坊中集成 zk-SNARKs 的最近工作的简单应用 ](https://blog.ethereum.org/2017/01/19/update-integrating-zcash-ethereum/)。

## 零知识证明

零知识证明的目标是让验证者能够确信证明者掌握了一个满足某种关系的秘密参数，也就是所谓的见证人，而无需向验证者或任何其他人揭示这个见证人。

我们可以更具体地将其想象为一个程序，标记为 C ，接收两个输入： `C(x, w)`。输入 x 是公开输入，而 w 是秘密见证输入。程序的输出是布尔值，即 true 或 false 。然后，目标是给定特定的公开输入 x ，证明证明者知道一个秘密输入 w ，使得 `C(x,w) == true` 。

我们将专门讨论非交互式零知识证明。这意味着证明本身是一块可以在无需证明者任何交互的情况下进行验证的数据。

## 示例程序

假设 Bob 得到了某个值的哈希 H ，他希望有证据证明 Alice 知道哈希为 H 的值 s 。通常，Alice 会通过给 Bob s 来证明这一点，然后 Bob 会计算哈希并检查它是否等于 H 。

然而，假设 Alice 不想向 Bob 透露 s 的值，而只是想证明她知道这个值。她可以使用 `zk-SNARK` 来实现这一点。

我们可以使用以下程序来描述 Alice 的情况，这里以 Javascript 函数的形式编写：

```
function C(x, w) {  return ( sha256(w) == x );}
```

> 这个程序不涉及任何 ZK 内容，他只是用于表示我们想要达到的效果是什么样。我们可以将其视为一个黑盒，我们将在下一节中讨论如何使用 zk-SNARKs 来构建这样的程序。

换句话说：该程序接收一个公共哈希 x 和一个秘密值 w ，如果 w 的 SHA-256 哈希等于 x ，则返回 true 。

将 Alice 的问题通过函数 `C(x,w)`进行翻译，我们可以看到 Alice 需要创建一个证明，证明她拥有 s ，使得 `C(H, s) == true` ，而无需揭示 s 。这就是 zk-SNARKs 解决的一般问题。

## zk-SNARK 的定义

一个 zk-SNARK 由三个算法 G, P, V 组成，定义如下：

_密钥生成器 G_ 由一个秘密参数 `lambda` 和一个程序 C 组成 ，并生成两个公开可用的密钥，一个 _proving key_ pk（证明密钥） ，和一个 _verification key_ vk（验证密钥） 。这些密钥是公开参数，只需要使用程序 C 生成一次。

_证明者 P_ 将证明密钥 pk 、公共输入 x 和见证 w 作为输入。该算法生成一个证明 `prf = P(pk, x, w)` ，证明者知道一个见证 w ，并且该见证满足程序的要求。

_验证器 V_ 计算 `V(vk, x, prf)` ，如果证明是正确的，它将返回 true ，否则返回 false 。因此，如果证明者知道一个满足 C(x,w) == true 的见证 w ，这个函数就会返回真。

请注意在生成器中使用的秘密参数 lambda 。这个参数有时使得在现实世界的应用中使用 zk-SNARKs 变得棘手。原因在于，任何知道这个参数的人都可以生成假的证明。具体来说，给定任何程序 C 和公开输入 x ，知道 lambda 的人可以生成一个证明 fake_prf ，使得 `V(vk, x, fake_prf)` 评估为 true ，而无需知道秘密 w 。

因此，实际运行生成器需要一个非常安全的过程，以确保没有人了解并保存参数。这就是 Zcash 团队进行[极其复杂的仪式](https://electriccoin.co/blog/the-design-of-the-ceremony/)以生成证明密钥和验证密钥的原因，同时确保“有毒废料” lambda 在过程中被销毁。

## 针对示例程序的 zk-SNARK

在实际操作中， Alice 和 Bob 如何使用 zk-SNARK，以便 Alice 证明她知道上述示例中的秘密值？
首先，如上所述，我们将使用由以下函数定义的程序：

```javascript
function C(x, w) {
  return sha256(w) == x;
}
```

首先，Bob 需要运行生成器 G，以创建证明密钥 pk 和验证密钥 vk。首先，随机生成 lambda，并将其作为输入：

```
(pk, vk) = G(C, lambda)
```

请小心处理参数 lambda，因为如果 Alice 知道 lambda 的值，她将能够创建假的证明。Bob 将与 Alice 分享 pk 和 vk。

Alice 现在将扮演证明者的角色。她需要证明她知道哈希值为已知哈希 H 的值 s。她运行证明算法 P，使用输入 pk、H 和 s 来生成证明 prf：

```
prf = P(pk, H, s)
```

接下来，Alice 将证明 prf 呈现给 Bob ，Bob 运行验证函数 `V(vk, H, prf)`。在这种情况下，由于 Alice 正确地知道了秘密 s，所以会返回真值。Bob 可以确信 Alice 知道这个秘密，但 Alice 并不需要向 Bob 透露这个秘密。

## 可重用的证明和验证密钥

在我们上述的例子中，如果 Bob 想向 Alice 证明他知道一个秘密，那么他就不能使用 zk-SNARK，因为 Alice 无法知道 Bob 是否保存了 lambda 参数。Bob 完全有可能伪造证据。

如果一个程序对许多人有用（比如 Zcash 的例子），一个独立于 Alice 和 Bob 的可信赖的独立团队可以运行生成器，创建证明密钥 pk 和验证密钥 vk，而且这样做没有人会了解到 lambda。

任何相信该团队没有作弊的人，都可以在未来的互动中使用这些密钥。

## 以太坊中的 zk-SNARKs

开发者已经开始将 zk-SNARKs 集成到以太坊中。这看起来是什么样子呢？具体来说，你可以将验证算法的构建模块以预编译合约的形式添加到以太坊中。具体操作如下：在链下运行生成器，生成证明密钥和验证密钥。然后，任何证明者都可以使用证明密钥创建证明，这也是在链下完成的。然后，你可以在智能合约内部运行通用验证算法，使用证明、验证密钥和公开输入作为输入参数。然后，你可以使用验证算法的结果来触发其他链上活动。

## 示例：保密交易

以下是一个简单的例子，说明了 zk-SNARKs 如何帮助提高以太坊的隐私性。假设我们有一个简单的代币合约。通常，一个代币合约的核心是将地址映射到余额：

```javascript
mapping (address => uint256) balances;
```

我们将保留相同的基本核心，只是将余额替换为余额的哈希值：

```javascript
mapping (address => bytes32) balanceHashes;
```

我们不会隐藏交易的发送者或接收者。但我们会隐藏余额和发送的金额。这种属性有时被称为保密交易。

我们将使用两个 zk-SNARKs 来将代币从一个账户发送到另一个账户。发送者和接收者各创建一个证明。

通常在一个代币合约中，为了使大小值的交易有效，我们需要验证以下内容：

```
balances[fromAddress] >= value
```

我们的 zk-SNARKs 需要证明这一点是成立的，以及更新后的哈希值与更新后的余额相匹配。

主要的思想是，发送者将使用他们的 _初始余额_ 和 _值_ 作为私有数据。使用 _初始余额_、_结束余额_ 和 _值的哈希_ 作为公开数据。同样，接收者将使用 _初始余额_ 和 _值_ 作为私有数据。使用 _初始余额_ 、 _结束余额_ 和 _值的哈希_ 作为公开数据。

以下是发送者的 zk-SNARK 程序，其中如前所述，x 代表公开数据，w 代表私有数据。

```javascript
/**
 * @param x 公开数据
 * @param w 私有数据
 */
function senderFunction(x, w) {
  return (
    w.senderBalanceBefore > w.value && // 确保发送者有足够的余额
    sha256(w.value) == x.hashValue && // 确保发送的值与公开的哈希值匹配
    sha256(w.senderBalanceBefore) == x.hashSenderBalanceBefore && // 确保发送者的初始余额与公开的哈希值匹配
    sha256(w.senderBalanceBefore - w.value) == x.hashSenderBalanceAfter // 确保发送者的结束余额与公开的哈希值匹配
  );
}
```

接受者的 zk-SNARK 程序如下：

```javascript
/**
 * @param x 公开数据
 * @param w 私有数据
 */
function receiverFunction(x, w) {
  return (
    sha256(w.value) == x.hashValue &&
    sha256(w.receiverBalanceBefore) == x.hashReceiverBalanceBefore &&
    sha256(w.receiverBalanceBefore + w.value) == x.hashReceiverBalanceAfter
  );
}
```

这些程序会检查发送余额是否大于正在发送的值，并检查所有哈希是否匹配。一组受信任的人员将为我们的 zk-SNARKs 生成证明和验证密钥。我们称它们为 _confTxSenderPk_、_confTxSenderVk_、_confTxReceiverPk_ 和 _confTxReceiverVk_。 _confTxSenderPk_ 和 _confTxReceiverPk_ 将被用于生成证明，而 _confTxSenderVk_ 和 _confTxReceiverVk_ 将被用于验证证明。

在代币合约中使用 zk-SNARKs 可能会是这样的：

```solidity
function transfer(address _to, bytes32 hashValue, bytes32 hashSenderBalanceAfter, bytes32 hashReceiverBalanceAfter, bytes zkProofSender, bytes zkProofReceiver) {
  bytes32 hashSenderBalanceBefore = balanceHashes[msg.sender];
  bytes32 hashReceiverBalanceBefore = balanceHashes[_to];

  bool senderProofIsCorrect = zksnarkverify(confTxSenderVk, [hashSenderBalanceBefore, hashSenderBalanceAfter, hashValue], zkProofSender);

bool receiverProofIsCorrect = zksnarkverify(confTxReceiverVk, [hashReceiverBalanceBefore, hashReceiverBalanceAfter, hashValue], zkProofReceiver);

  if(senderProofIsCorrect && receiverProofIsCorrect) {
    balanceHashes[msg.sender] = hashSenderBalanceAfter;
    balanceHashes[_to] = hashReceiverBalanceAfter;
  }
}
```

因此，区块链上唯一更新的只是余额的哈希值，而不是余额本身。然而，我们可以知道所有的余额都被正确地更新了，因为我们可以自己检查证明已经被验证过了。

通过上面的例子，我们也可以看到，在区块链上我们只进行了余额的 Hash 存储，而没有暴露真实的余额，这就对数据进行了保密，我们除了知道两者之间发生了交易，但是我们不知道具体交易金额，这就保证了交易的隐私性。

## 详细信息

上述的保密交易方案主要是为了给出一个实际的例子，说明我们如何在以太坊上使用 zk-SNARKs。要创建一个健全的保密交易方案，我们需要解决一些问题：

- 用户需要在客户端跟踪他们的余额，如果你失去余额数据，那么你就失去了这个账户的控制权。余额或许可以用来自签名密钥的密钥加密并存储在链上。
- 余额需要使用 32 字节的数据并熵编码，以防止反向解析哈希以计算余额。
- 需要处理向未使用地址发送的边缘情况。
- 发件人需要与收件人进行交互才能发送。我们可能会有一个系统，发件人可以使用他们的证明来启动交易。然后，收件人可以在区块链上看到他们有一个“待处理的入账交易”，并可以完成它。
