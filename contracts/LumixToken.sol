// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Author: @ayushnagarcodes
contract LumixToken {
    address private _contractOwner;
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    uint256 private _totalSupply;
    uint256 private immutable _cap;
    uint256 private immutable _faucetAmount;
    bool private _paused;

    mapping(address => uint256) private _balances;
    mapping(address owner => mapping(address spender => uint256))
        private _allowances;
    mapping(address => bool) private _hasClaimedFaucet;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event Mint(address indexed to, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event Burn(address indexed burner, uint256 value);

    modifier onlyOwner() {
        require(
            msg.sender == _contractOwner,
            "Only owner can perform this action"
        );
        _;
    }

    modifier notZeroAddress(address account, string memory action) {
        string memory errorMessage = string.concat(action, " zero address");
        require(account != address(0), errorMessage);
        _;
    }

    modifier whenNotPaused() {
        require(!_paused, "Contract is paused");
        _;
    }

    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be > 0");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply,
        uint256 cap_,
        uint256 faucetAmount_
    ) {
        require(bytes(name_).length > 0, "Name cannot be empty");
        require(bytes(symbol_).length > 0, "Symbol cannot be empty");
        require(decimals_ > 0 && decimals_ <= 18, "Invalid decimals");
        require(initialSupply > 0, "Initial supply must be > 0");
        require(cap_ >= initialSupply, "Cap must be >= initial supply");

        _contractOwner = msg.sender;
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _totalSupply = initialSupply * (10 ** _decimals);
        _cap = cap_ * (10 ** _decimals);
        _faucetAmount = faucetAmount_ * (10 ** _decimals);
        _paused = false;
        _balances[msg.sender] = _totalSupply;

        emit Mint(msg.sender, _totalSupply);
        emit Transfer(address(0), msg.sender, _totalSupply);
    }

    function contractOwner() public view returns (address) {
        return _contractOwner;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function cap() public view returns (uint256) {
        return _cap;
    }

    function faucetAmount() public view returns (uint256) {
        return _faucetAmount;
    }

    function isPaused() public view returns (bool) {
        return _paused;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    // Returns the amount of tokens that spender is allowed to spend on behalf of owner
    function allowance(
        address owner,
        address spender
    ) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    function transferOwnership(
        address newOwner
    ) public onlyOwner notZeroAddress(newOwner, "Transfer ownership to") {
        address oldOwner = _contractOwner;
        _contractOwner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function mint(
        uint256 amount
    ) public onlyOwner whenNotPaused validAmount(amount) returns (bool) {
        require(_totalSupply + amount <= _cap, "Cap exceeded");

        _totalSupply += amount;
        _balances[_contractOwner] += amount;

        emit Mint(_contractOwner, amount);
        emit Transfer(address(0), _contractOwner, amount);
        return true;
    }

    function burn(
        uint256 amount
    ) public onlyOwner whenNotPaused validAmount(amount) returns (bool) {
        require(
            _balances[_contractOwner] >= amount,
            "Insufficient balance to burn"
        );

        _totalSupply -= amount;
        _balances[_contractOwner] -= amount;

        emit Burn(_contractOwner, amount);
        emit Transfer(_contractOwner, address(0), amount);
        return true;
    }

    function pause() public onlyOwner {
        _paused = true;
    }

    function unpause() public onlyOwner {
        _paused = false;
    }

    function transfer(
        address to,
        uint256 amount
    )
        public
        notZeroAddress(to, "Transfer to")
        whenNotPaused
        validAmount(amount)
        returns (bool)
    {
        require(_balances[msg.sender] >= amount, "Insufficient balance");

        _balances[msg.sender] -= amount;
        _balances[to] += amount;

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    // Approves spender to spend tokens on behalf of msg.sender
    function approve(
        address spender,
        uint256 amount
    )
        public
        notZeroAddress(spender, "Approve to")
        whenNotPaused
        validAmount(amount)
        returns (bool)
    {
        require(amount <= _cap, "Cap exceeded");

        _allowances[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);
        return true;
    }

    // Transfers tokens from owner to another address using the allowance mechanism
    function transferFrom(
        address owner,
        address to,
        uint256 amount
    )
        public
        notZeroAddress(owner, "Transfer from")
        notZeroAddress(to, "Transfer to")
        whenNotPaused
        validAmount(amount)
        returns (bool)
    {
        require(_balances[owner] >= amount, "Insufficient balance");
        require(
            _allowances[owner][msg.sender] >= amount,
            "Insufficient allowance"
        );

        _balances[owner] -= amount;
        _balances[to] += amount;
        _allowances[owner][msg.sender] -= amount;

        emit Transfer(owner, to, amount);
        return true;
    }

    function increaseAllowance(
        address spender,
        uint256 amount
    )
        public
        notZeroAddress(spender, "Approve to")
        whenNotPaused
        validAmount(amount)
        returns (bool)
    {
        _allowances[msg.sender][spender] += amount;

        emit Approval(msg.sender, spender, _allowances[msg.sender][spender]);
        return true;
    }

    function decreaseAllowance(
        address spender,
        uint256 amount
    )
        public
        notZeroAddress(spender, "Approve to")
        whenNotPaused
        validAmount(amount)
        returns (bool)
    {
        uint256 currentAllowance = _allowances[msg.sender][spender];
        require(currentAllowance >= amount, "Decreased allowance below zero");

        _allowances[msg.sender][spender] = currentAllowance - amount;

        emit Approval(msg.sender, spender, _allowances[msg.sender][spender]);
        return true;
    }

    function claimFaucet() public whenNotPaused returns (bool) {
        require(!_hasClaimedFaucet[msg.sender], "Already claimed faucet");
        require(_totalSupply + _faucetAmount <= _cap, "Cap exceeded");

        _totalSupply += _faucetAmount;
        _balances[msg.sender] += _faucetAmount;
        _hasClaimedFaucet[msg.sender] = true;

        emit Mint(msg.sender, _faucetAmount);
        emit Transfer(address(0), msg.sender, _faucetAmount);
        return true;
    }
}
