pragma solidity^0.5.0;
import './Token.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';


contract Exchange {
  using SafeMath for uint256;

  address public feeAccount;
  uint256 public feePercent;
  address constant ETHER = address(0); //store Ether in tokens mapping with blank address
  mapping(address => mapping(address => uint256)) public tokens;
  mapping(uint256 => _Order) public orders;
  uint256 public orderCount;
  mapping(uint256 => bool) public orderCancelled;
  mapping(uint256 => bool) public orderFilled;

  event Deposit(address token, address user, uint256 amount, uint256 balance);
  event Withdraw(address token, address user, uint256 amount, uint256 balance);
  event Order(
    uint256 id,
    address user,
    address tokenGet,
    uint256 amountGet,
    address tokenGive,
    uint256 amountGive,
    uint256 timestamp
  );

  event Cancel(
    uint256 id,
    address user,
    address tokenGet,
    uint256 amountGet,
    address tokenGive,
    uint256 amountGive,
    uint256 timestamp
  );

  event Trade(
    uint256 id,
    address user,
    address tokenGet,
    uint256 amountGet,
    address tokenGive,
    uint256 amountGive,
    address userFill,
    uint256 timestamp
  );

  struct _Order {
    uint256 id;
    address user;
    address tokenGet;
    uint256 amountGet;
    address tokenGive;
    uint256 amountGive;
    uint256 timestamp;
  }

  //model order
  //store order
  //add order to storage

  constructor (address _feeAccount, uint256 _feePercent) public {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }
  //Fallbak: revert if Ether is sent to this smart contract by mistake
  function() external {
    revert();
  }
  function depositEther() payable public {
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  function withdrawEther(uint256 _amount) public {
    require(tokens[ETHER][msg.sender] >= _amount);
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
    msg.sender.transfer(_amount);
    emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
  }

  function depositToken(address _token, uint256 _amount) public {
    require(_token != ETHER);
    require(Token(_token).transferFrom(msg.sender, address(this), _amount));
    tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  function withdrawToken(address _token, uint256 _amount) public {
    require(_token != ETHER);
    require(tokens[_token][msg.sender] >= _amount);
    tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
    require(Token(_token).transfer(msg.sender, _amount));
    emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  function balanceOf(address _token, address _user) public view returns (uint256) {
    return tokens[_token][_user];
  }

  function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
    orderCount = orderCount.add(1);
    orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
    emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
  }
  function cancelOrder(uint256 _id) public {
    _Order storage _order = orders[_id];
    require(address(_order.user) == msg.sender);
    require(_order.id == _id);
    orderCancelled[_id] = true;
    emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, now);
  }

  function fillOrder(uint256 _id) public {
    require(_id > 0 && _id <= orderCount);
    require(!orderFilled[_id]);
    require(!orderCancelled[_id]);
    //Fetch order
    _Order storage _order = orders[id];
    _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
    //Mark order as filled
    orderFilled[_order.id] = true;
  }
  function _trade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
    uint256 _feeAmount = _amountGive.mul(feePercent).div(100);
    //Execute order
      //charge fees
    tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
    tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);
    tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);
    tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
    tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive);
    //emit Trade event
    emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, now);

  }
}
