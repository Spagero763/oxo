// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OXOArcade
 * @notice Stake escrow for OXO, a single-player noughts & crosses game played
 *         against an off-chain bot. Because the opponent is a bot, there is no
 *         second on-chain party to enforce the result, so settlement is
 *         server-authoritative: a trusted `relayer` reports each game's outcome
 *         and the contract pays out from a house pool funded by the owner.
 *
 *         Trust model (documented on purpose):
 *           - The player's stake is held by the contract while a game is open.
 *           - On a WIN the player receives stake * payout (the extra comes from
 *             the house pool). On a DRAW the stake is refunded. On a LOSS the
 *             stake is forfeited to the house pool.
 *           - If the relayer never settles, the player can reclaim their stake
 *             permissionlessly after STALE_TIMEOUT. Funds are never frozen.
 *
 *         Self-contained (no imports) so it compiles in Remix with zero setup.
 */
contract OXOArcade {
    // --- modes -------------------------------------------------------------
    enum Mode {
        Normal, // index 0
        Hard // index 1
    }

    // payout is a multiplier on the stake, scaled by 100 (200 = 2x, 300 = 3x)
    uint256 public constant PAYOUT_DENOMINATOR = 100;
    mapping(Mode => uint256) public payoutNumerator;

    // --- outcomes ----------------------------------------------------------
    uint8 public constant OUTCOME_LOSE = 0;
    uint8 public constant OUTCOME_DRAW = 1;
    uint8 public constant OUTCOME_WIN = 2;

    // a player can reclaim an unsettled stake after this long
    uint256 public constant STALE_TIMEOUT = 1 hours;

    uint256 public minStake = 1e12; // 0.000001 CELO

    struct Game {
        address player;
        uint128 stake;
        uint64 createdAt;
        Mode mode;
        bool settled;
    }

    mapping(bytes32 => Game) public games;

    address public owner;
    address public relayer;
    uint256 public houseBalance; // CELO available to cover winnings

    // simple reentrancy guard
    uint256 private _lock = 1;

    // --- events ------------------------------------------------------------
    event Staked(bytes32 indexed gameId, address indexed player, uint256 stake, Mode mode);
    event Settled(bytes32 indexed gameId, address indexed player, uint8 outcome, uint256 payout);
    event StaleRefunded(bytes32 indexed gameId, address indexed player, uint256 stake);
    event HouseFunded(address indexed from, uint256 amount);
    event HouseWithdrawn(address indexed to, uint256 amount);
    event RelayerChanged(address indexed relayer);
    event MinStakeChanged(uint256 minStake);
    event PayoutChanged(Mode mode, uint256 numerator);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer, "not relayer");
        _;
    }

    modifier nonReentrant() {
        require(_lock == 1, "reentrant");
        _lock = 2;
        _;
        _lock = 1;
    }

    constructor(address _relayer) {
        owner = msg.sender;
        relayer = _relayer == address(0) ? msg.sender : _relayer;
        payoutNumerator[Mode.Normal] = 200; // 2x
        payoutNumerator[Mode.Hard] = 300; // 3x
    }

    // --- player ------------------------------------------------------------

    /// @notice Open a game by staking CELO. `gameId` must be unique per game.
    function stake(bytes32 gameId, Mode mode) external payable nonReentrant {
        require(msg.value >= minStake, "stake too low");
        require(msg.value <= type(uint128).max, "stake too high");
        require(games[gameId].player == address(0), "game exists");

        // the house must be able to cover a win on this stake
        uint256 maxWinnings = (msg.value * payoutNumerator[mode]) / PAYOUT_DENOMINATOR - msg.value;
        require(houseBalance >= maxWinnings, "house cannot cover");

        games[gameId] = Game({
            player: msg.sender,
            stake: uint128(msg.value),
            createdAt: uint64(block.timestamp),
            mode: mode,
            settled: false
        });

        emit Staked(gameId, msg.sender, msg.value, mode);
    }

    /// @notice Reclaim a stake if the relayer never settled the game in time.
    function claimStaleRefund(bytes32 gameId) external nonReentrant {
        Game storage g = games[gameId];
        require(g.player != address(0), "no game");
        require(!g.settled, "already settled");
        require(block.timestamp >= g.createdAt + STALE_TIMEOUT, "not stale yet");

        uint256 amount = g.stake;
        g.settled = true;
        _send(g.player, amount);
        emit StaleRefunded(gameId, g.player, amount);
    }

    // --- relayer -----------------------------------------------------------

    /// @notice Settle a game's result. Called by the trusted relayer.
    function settle(bytes32 gameId, uint8 outcome) external onlyRelayer nonReentrant {
        Game storage g = games[gameId];
        require(g.player != address(0), "no game");
        require(!g.settled, "already settled");
        require(outcome <= OUTCOME_WIN, "bad outcome");

        g.settled = true;
        uint256 stakeAmount = g.stake;
        uint256 payout;

        if (outcome == OUTCOME_WIN) {
            payout = (stakeAmount * payoutNumerator[g.mode]) / PAYOUT_DENOMINATOR;
            uint256 winnings = payout - stakeAmount; // drawn from the house
            houseBalance -= winnings;
            _send(g.player, payout);
        } else if (outcome == OUTCOME_DRAW) {
            payout = stakeAmount; // refund
            _send(g.player, payout);
        } else {
            // LOSS: stake joins the house pool
            houseBalance += stakeAmount;
            payout = 0;
        }

        emit Settled(gameId, g.player, outcome, payout);
    }

    // --- owner / house -----------------------------------------------------

    function fundHouse() external payable {
        require(msg.value > 0, "no value");
        houseBalance += msg.value;
        emit HouseFunded(msg.sender, msg.value);
    }

    function withdrawHouse(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= houseBalance, "exceeds house");
        houseBalance -= amount;
        _send(owner, amount);
        emit HouseWithdrawn(owner, amount);
    }

    function setRelayer(address _relayer) external onlyOwner {
        require(_relayer != address(0), "zero relayer");
        relayer = _relayer;
        emit RelayerChanged(_relayer);
    }

    function setMinStake(uint256 _minStake) external onlyOwner {
        minStake = _minStake;
        emit MinStakeChanged(_minStake);
    }

    function setPayout(Mode mode, uint256 numerator) external onlyOwner {
        require(numerator >= PAYOUT_DENOMINATOR, "payout < 1x");
        payoutNumerator[mode] = numerator;
        emit PayoutChanged(mode, numerator);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        owner = newOwner;
    }

    // --- internal ----------------------------------------------------------

    function _send(address to, uint256 amount) private {
        (bool ok, ) = payable(to).call{value: amount}("");
        require(ok, "transfer failed");
    }

    /// @dev Direct transfers top up the house pool.
    receive() external payable {
        houseBalance += msg.value;
        emit HouseFunded(msg.sender, msg.value);
    }
}
