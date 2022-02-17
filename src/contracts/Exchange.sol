pragma solidity^0.5.0;
import './Token.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';


contract Exchange {
  using SafeMath for uint256;

  address public feeAccount;
  uint256 public feePercent;
  address constant ETHER = address(0); //store Ether in tokens mapping with blank address
  event Deposit(address token, address user, uint256 amount, uint256 balance);
  mapping(address => mapping(address => uint256)) public tokens;
  constructor (address _feeAccount, uint256 _feePercent) public {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }
  function() external {
    revert();
  }
  function depositEther() payable public {
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  function depositToken(address _token, uint _amount) public {
    require(_token != ETHER);
    require(Token(_token).transferFrom(msg.sender, address(this), _amount));
    tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }
}
