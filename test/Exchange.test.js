import { tokens, EVM_REVERT } from './helpers'

const Token = artifacts.require('./Token')
const Exchange = artifacts.require('./Exchange')
require('chai').use(require('chai-as-promised')).should()


contract('Exchange', ([deployer, feeAccount, user1]) => {
  let token
  let exchange
  const feePercent = 10

  beforeEach(async () => {
    token = await Token.new()
    exchange = await Exchange.new(feeAccount, feePercent)
    token.transfer(user1, tokens(100), { from: deployer })
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
        balance = await token.balanceOf(exchange.address)
        balance.toString().should.equal(amount.toString())
        balance = await exchange.tokens(token.address, user1)
        balance.toString().should.equal(amount.toString())
      })
    })

  })

})
