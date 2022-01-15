import { tokens } from './helpers'

const Token = artifacts.require('./Token')
require('chai').use(require('chai-as-promised')).should()


contract('Token', ([deployer, receiver]) => {
  let token
  const name = "DApp Token"
  const symbol = "DApp"
  const decimals = '18'
  const totalSupply = tokens(1000000).toString()

  beforeEach(async () => {
    token = await Token.new()
  })

  describe('deployment', () => {
    it('tracks the name', async () => {
      const result = await token.name()
      result.should.equal(name)
    })
    it('tracks the symbol', async () => {
      const result = await token.symbol()
      result.should.equal(symbol)
    })
    it('tracks the decimals', async () => {
      const result = await token.decimals()
      result.toString().should.equal(decimals)
    })
    it('tracks the total supply', async () => {
      const result = await token.totalSupply()
      result.toString().should.equal(totalSupply)
    })
    it('assigns total supply to deployer', async () => {
      const result = await token.balanceOf(deployer)
      result.toString().should.equal(totalSupply)
    })
  })

  describe('transfers tokens', () => {
    let amount
    let result

    beforeEach(async () => {
      amount = tokens(100)
      result = await token.transfer(receiver, amount, { from: deployer })
    })
    it('transfers token balances', async () => {
      let balanceOf;

      balanceOf = await token.balanceOf(deployer)
      balanceOf = await token.balanceOf(receiver)

      balanceOf = await token.balanceOf(deployer)
      balanceOf.toString().should.equal(tokens(999900).toString())
      balanceOf = await token.balanceOf(receiver)
      balanceOf.toString().should.equal(tokens(100).toString())

    })
    it('emits transfer event', async () => {
      const log = result.logs[0]
      log.event.should.equal('Transfer')
      const event = log.args
      event.from.toString().should.equal(deployer, 'from is correct')
      event.to.toString().should.equal(receiver, 'to is correct')
      event.value.toString().should.equal(amount.toString(), 'value is correct')
    })
  })
})
