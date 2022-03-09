import { ether, tokens, EVM_REVERT, ETHER_ADDRESS } from './helpers'

const Token = artifacts.require('./Token')
const Exchange = artifacts.require('./Exchange')
require('chai').use(require('chai-as-promised')).should()


contract('Exchange', ([deployer, feeAccount, user1, user2 ]) => {
  let token
  let exchange
  const feePercent = 10

  beforeEach(async () => {
    token = await Token.new()
    exchange = await Exchange.new(feeAccount, feePercent)
    token.transfer(user1, tokens(100), { from: deployer })
  })
  describe('depositing Ether', async() => {
    let result
    let amount
    beforeEach(async() => {
      amount = ether(1)
      result = await exchange.depositEther({ from: user1, value: amount})
    })
    it('tracks Ether deposit', async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1)
      balance.toString().should.equal(amount.toString())
    })
    it('emits Deposit event', async () => {
      const log = result.logs[0]
      log.event.should.equal('Deposit')
      const event = log.args
      event.token.should.equal(ETHER_ADDRESS, 'Ether address is correct')
      event.user.should.equal(user1, 'user address is correct')
      event.amount.toString().should.equal(ether(1).toString(), 'amount is correct')
      event.balance.toString().should.equal(ether(1).toString(), 'balance is correct')
    })
  })
  describe('withdrawing Ether', async() => {
    let result
    let amount
    beforeEach(async () => {
      amount = ether(1)
      await exchange.depositEther({ from: user1, value: amount })
    })
    describe('success', async () => {
      beforeEach(async () => {
        result = await exchange.withdrawEther(amount, { from: user1 })
      })
      it('withdraws correct amount of Ether', async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1)
        balance.toString().should.equal('0')
      })
      it('emits Withdraw event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Withdraw')
        const event = log.args
        event.token.should.equal(ETHER_ADDRESS, 'Ether address is correct')
        event.user.should.equal(user1, 'user address is correct')
        event.amount.toString().should.equal(amount.toString(), 'withdraw amount is correct')
        event.balance.toString().should.equal('0', 'balance is correct')
      })
    })
    describe('failure', async () => {
      it('rejects withdraws for insuffecient balances', async () => {
        await exchange.withdrawEther(ether(100), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
    })
  })
  describe('deployment', () => {
    it('tracks the fee account', async () => {
      const result = await exchange.feeAccount()
      result.should.equal(feeAccount)
    })
    it('tracks the fee percent', async () => {
      const result = await exchange.feePercent()
      result.toString().should.equal(feePercent.toString())
    })

  })
  describe('fallback', () => {
    it('reverts when Ether is sent', async () => {
      await exchange.sendTransaction({ value: 1, from: user1}).should.be.rejectedWith(EVM_REVERT)
    })
  })

  describe('depositing tokens', () => {
    let result
    let amount
    beforeEach(async () => {
      amount = tokens(10)
      await token.approve(exchange.address, amount, { from:  user1 })
      result = await exchange.depositToken(token.address, amount, { from: user1})
    })
    describe('success', () => {
      it('tracks token deposit', async () => {
        let balance
        //Check exchange token balance
        balance = await token.balanceOf(exchange.address)
        balance.toString().should.equal(amount.toString())
        //Check tokens on exchange
        balance = await exchange.tokens(token.address, user1)
        balance.toString().should.equal(amount.toString())
      })
      it('emits Deposit event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Deposit')
        const event = log.args
        event.token.should.equal(token.address, 'token address is correct')
        event.user.should.equal(user1, 'user address is correct')
        event.amount.toString().should.equal(tokens(10).toString(), 'amount is correct')
        event.balance.toString(). should.equal(tokens(10).toString(), 'balance is correct')
      })
    })
    describe('failure', () => {
      it('rejects Ether deposits', async() => {
        await exchange.depositToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
      it('fails when no tokens are approved', async() => {
        await exchange.depositToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
    })

  })

  describe('withdraw tokens', async () => {
    let result
    let amount
    beforeEach(async () => {
      amount = tokens(10)
      await token.approve(exchange.address, amount, { from: user1 })
      await exchange.depositToken(token.address, amount, { from: user1 })

      result = await exchange.withdrawToken(token.address, amount, { from: user1 })
    })
    describe('success', async () => {
      it('withdraws token', async() => {
        const balance = await exchange.tokens(token.address, user1)
        balance.toString().should.equal('0')
      })
      it('emits Withdraw event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Withdraw')
        const event = log.args
        event.token.should.equal(token.address, 'token address is correct')
        event.user.should.equal(user1, 'user address is correct')
        event.amount.toString().should.equal(amount.toString(), 'amount is correct')
        event.balance.toString().should.equal('0', 'balance is correct')
      })
    })
    describe('failure', async () => {
      it('rejects Ether withdraws', async () => {
        await exchange.withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
      it('fails for insufficient balances', async () => {
        await exchange.withdrawToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
      })
    })
    describe('checking balances', async () => {
      beforeEach(async () => {
        exchange.depositEther({ from: user1, value: ether(1) })
      })
      it('returns user balance', async () => {
        const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
        result.toString().should.equal(ether(1).toString())
      })
    })
    describe('making orders', async () => {
      let result
      beforeEach(async () => {
        result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
      })
      it('tracks newly created order', async () => {
        const orderCount = await exchange.orderCount()
        orderCount.toString().should.equal('1')
        const order = await exchange.orders('1')
        order.id.toString().should.equal('1', 'order id is correct')
        order.user.should.equal(user1, 'user is correct')
        order.tokenGet.should.equal(token.address, 'tokenGet is correct')
        order.amountGet.toString().should.equal(tokens(1).toString(), 'token amount is correct')
        order.tokenGive.should.equal(ETHER_ADDRESS, 'token give is correct')
        order.amountGive.toString().should.equal(ether(1).toString(), 'amount give is correct')
        order.timestamp.toString().length.should.be.at.least(1, 'timestamp is correct')
      })
      it('emits Order event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Order')
        const event = log.args
        event.id.toString().should.equal('1', 'id is correct')
        event.user.should.equal(user1, 'user is correct')
        event.tokenGet.should.equal(token.address, 'token get is correct')
        event.amountGet.toString().should.equal(tokens(1).toString(), 'amount get is correct')
        event.tokenGive.should.equal(ETHER_ADDRESS, 'token give is correct')
        event.amountGive.toString().should.equal(ether(1).toString(), 'amount give is correct')
        event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
      })
    })
    describe('order actions', async () => {
      beforeEach(async () => {
        //user1 deposits ether
        await exchange.depositEther({from: user1, value: ether(1)})
        //give tokens to user2
        await token.transfer(user2, tokens(100), { from: deployer })
        await token.approve(exchange.address, tokens(2), {from: user2})
        //user2 deposits tokens
        await exchange.depositToken(token.address, tokens(2), { from: user2 })
        //user1 makes order to buy tokens with ether
        await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
      })
      describe('filling orders', async () => {
        let result;
        describe('success', async () => {
          beforeEach(async () => {
            result = await exchange.fillOrder('1', { from: user2 })
          })
          it('executes trade and charges fee', async () => {
            let balance
            balance = await exchange.balanceOf(token.address, user1)
            balance.toString().should.equal(tokens(1).toString(), 'user1 received tokens')
            balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
            balance.toString().should.equal(ether(1).toString(), 'user2 received Ether')
            balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
            balance.toString().should.equal('0', 'user1 Ether deducted')
            balance = await exchange.balanceOf(token.address, user2)
            balance.toString().should.equal(tokens(0.9).toString(), 'user2 tokens deducted with fee applied')
            const feeAccount = await exchange.feeAccount()
            balance = await exchange.balanceOf(token.address, feeAccount)
            balance.toString().should.equal(tokens(0.1).toString(), 'feeAccount received fee')
          })
        })

      })
      describe('cancelling orders', async () => {
        let result
        describe('success', async () => {
          beforeEach(async () => {
            result = await exchange.cancelOrder('1', { from: user1 })
          })
          it('updates cancelled orders', async () => {
            const orderCancelled = await exchange.orderCancelled(1)
            orderCancelled.should.equal(true)
          })
          it('emits Cancel event', async () => {
            const log = result.logs[0]
            log.event.should.equal('Cancel')
            const event = log.args
            event.id.toString().should.equal('1', 'id is correct')
            event.user.should.equal(user1, 'user is correct')
            event.tokenGet.should.equal(token.address, 'token get is correct')
            event.amountGet.toString().should.equal(tokens(1).toString(), 'amount get is correct')
            event.tokenGive.should.equal(ETHER_ADDRESS, 'token give is correct')
            event.amountGive.toString().should.equal(ether(1).toString(), 'amount give is correct')
            event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
          })
        })
        describe('failure', async () => {
          it('rejects invalid order ids', async () => {
            const invalidOrderId = 99999
            await exchange.cancelOrder(invalidOrderId, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
          })
          it('rejects unauthorized cancelations', async () => {
            await exchange.cancelOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
          })
        })
      })
    })
  })

})
