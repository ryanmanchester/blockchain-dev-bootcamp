const Token = artifacts.require("Token")
const Exchange = artifacts.require("Exchange")

//Utils
const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

const tokens = (n) => {
  return new web3.utils.BN(
    web3.utils.toWei(n.toString(), 'ether')
  )
}

const ether = (n) => tokens(n)
const wait = (seconds) => {
  const miliseconds = seconds * 1000
  return new Promise(resolve => setTimeout(resolve, miliseconds))
}


module.exports = async function(callback) {
  try{
    //Fetch accounts from wallet
    const accounts = await web3.eth.getAccounts()
    //Fetch deployed token
    const token = await Token.deployed()
    console.log("Token fetched", token.address)
    //Fetch deployed exchange
    const exchange = await Exchange.deployed()
    console.log("Exchange fetched", exchange.address)
    //Give tokens to account1
    const sender = accounts[0]
    const receiver = accounts[1]
    let amount = web3.utils.toWei('10000', 'ether') //10,000 tokens

    await token.transfer(receiver, amount, {from: sender})
    console.log(`Transferred ${amount} tokens from ${sender} to ${receiver}`)

    const user1 = accounts[0]
    const user2 = accounts[1]

    //User1 deposits Ether
    amount = 1
    await exchange.depositEther({from: user1, value: ether(amount)})
    console.log(`Deposited ${amount} Ether from ${user1}`)
    //User2 approves tokens
    amount = 10000
    await token.approve(exchange.address, tokens(amount), { from: user2 })
    console.log(`Approved ${amount} tokens from ${user2}`)
    //User2 deposits tokens
    await exchange.depositToken(token.address, tokens(amount), { from: user2 })
    console.log(`Deposited ${amount} tokens from ${user2}`)

    //Seed a cancelled order
    //User1 makes order to get tokens
    let result
    let orderId
    result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, ether(0.1), { from: user1 })
    console.log(`Made order for ${user1}`)

    //User1 cancels order
    orderId = result.logs[0].args.id
    await exchange.cancelOrder(orderId, { from: user1 })
    console.log(`Cancelled order from ${user1}`)

    //Seeds filled order
    //User1 makes order
    result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, ether(0.1), { from: user1 })
    console.log(`Made order for ${user1}`)

    //User2 fills order
    orderId = result.logs[0].args.id
    await exchange.fillOrder(orderId, {from: user2})
    console.log(`Filled order from ${user1}`)

    //Wait 1 sed
    await wait(1)
    //User1 makes another order
    result = await exchange.makeOrder(token.address, tokens(50), ETHER_ADDRESS, ether(0.01), {from: user1})
    console.log(`Made order for ${user1}`)

    //User2 fills order
    orderId = result.logs[0].args.id
    await exchange.fillOrder(orderId, {from: user2})
    console.log(`Filled order for ${user1}`)

    await wait(1)

    //Final order
    result = await exchange.makeOrder(token.address, tokens(200), ETHER_ADDRESS, ether(0.15), {from: user1})
    console.log(`Final order for ${user1}`)

    orderId = result.logs[0].args.id
    await exchange.fillOrder(orderId, { from: user2 })
    console.log(`Filled final order for ${user1}`)

    await wait(1)
    //Seed open orders
    //User 1 makes 10 orders
    for(let i = 1; i <= 10; i++) {
      result = await exchange.makeOrder(token.address, tokens(10 * i), ETHER_ADDRESS, ether(0.01), {from: user1})
      console.log(`Made order from ${user1}`)
      await wait(1)
    }
    for(let i = 1; i <= 10; i++) {
      result = await exchange.makeOrder(ETHER_ADDRESS, ether(0.01), token.address, tokens(10 * i), {from: user2})
      console.log(`Made order from ${user2}`)
      await wait(1)
    }
  }
  catch(err){
    console.log(err)
  }
  callback()
}
