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
    it('transfers token balances', async () => {
      let balanceOf;
      //Before transfer
      balanceOf = await token.balanceOf(deployer)
      console.log('deployer account:', deployer)
      console.log('sender balance before transfer', balanceOf.toString())
      balanceOf = await token.balanceOf(receiver)
      console.log('receiver account:', receiver)
      console.log('receiver balance before transfer', balanceOf.toString())
      //Transfer
      await token.transfer(receiver, tokens(100), { from: deployer })
      //After transfer
      balanceOf = await token.balanceOf(deployer)
      balanceOf.toString().should.equal(tokens(999900).toString())
      console.log('sender balance after transfer', balanceOf.toString())
      balanceOf = await token.balanceOf(receiver)
      balanceOf.toString().should.equal(tokens(100).toString())
      console.log('receiver balance after transfer', balanceOf.toString())

    })
  })
})
