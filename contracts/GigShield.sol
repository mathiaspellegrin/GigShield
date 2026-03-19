// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ISponsorWhitelistControl.sol";

/// @title GigShield — Trustless Freelance Escrow
/// @notice Milestone-based escrow with auto-release timers and on-chain arbitration
/// @dev Uses USDT0 (ERC20) for payments. Gas sponsored via Conflux built-in sponsorship.
contract GigShield is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Constants ───────────────────────────────────────────────────────
    ISponsorWhitelistControl constant SPONSOR =
        ISponsorWhitelistControl(0x0888000000000000000000000000000000000001);

    uint256 public constant AUTO_RELEASE_PERIOD = 7 days;
    uint256 public constant DISPUTE_RESPONSE_PERIOD = 48 hours;
    uint256 public constant MAX_ARBITRATORS_PER_DISPUTE = 3;
    uint256 public constant MAX_MILESTONES = 20;

    // ─── Types ───────────────────────────────────────────────────────────
    enum MilestoneStatus {
        Pending,       // Created, not started
        InProgress,    // Freelancer working
        UnderReview,   // Freelancer submitted, awaiting client approval
        Approved,      // Client approved, funds released
        Disputed       // In dispute
    }

    enum DisputeStatus {
        None,
        Filed,          // Dispute filed, waiting for response
        ResponsePeriod, // Other party responding
        InArbitration,  // Arbitrators voting
        Resolved        // Resolved
    }

    enum DisputeOutcome {
        None,
        ReleasedToFreelancer,
        ReturnedToClient
    }

    struct Milestone {
        string description;
        uint256 amount;
        MilestoneStatus status;
        uint256 submittedAt;      // When freelancer marked complete
        bool autoReleasePaused;   // Client can pause once
    }

    struct Project {
        address client;
        address freelancer;
        string name;
        string description;
        address paymentToken;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 milestoneCount;
        uint256 createdAt;
        bool active;
        bool funded;
    }

    struct Dispute {
        uint256 projectId;
        uint256 milestoneIndex;
        DisputeStatus status;
        address filedBy;
        string clientEvidence;
        string freelancerEvidence;
        uint256 filedAt;
        uint256 responseDeadline;
        address[3] arbitrators;
        uint8 votesForFreelancer;
        uint8 votesForClient;
        uint8 totalVotes;
        DisputeOutcome outcome;
    }

    // ─── State ───────────────────────────────────────────────────────────
    uint256 public projectCount;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Milestone[]) public milestones;
    mapping(uint256 => Dispute) public disputes; // disputeId => Dispute
    uint256 public disputeCount;
    mapping(uint256 => uint256) public milestoneDispute; // encodeKey(projectId, milestoneIdx) => disputeId

    // Arbitrator registry
    address[] public arbitratorPool;
    mapping(address => bool) public isArbitrator;
    mapping(uint256 => mapping(address => bool)) public hasVoted; // disputeId => arbitrator => voted

    // ─── Events ──────────────────────────────────────────────────────────
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed client,
        address indexed freelancer,
        string name,
        uint256 totalAmount
    );
    event EscrowDeposited(uint256 indexed projectId, uint256 amount);
    event MilestoneSubmitted(uint256 indexed projectId, uint256 milestoneIndex);
    event MilestoneApproved(uint256 indexed projectId, uint256 milestoneIndex, uint256 amount);
    event MilestoneRevisionRequested(uint256 indexed projectId, uint256 milestoneIndex);
    event AutoReleaseTriggered(uint256 indexed projectId, uint256 milestoneIndex, uint256 amount);
    event AutoReleasePaused(uint256 indexed projectId, uint256 milestoneIndex);
    event DisputeFiled(uint256 indexed disputeId, uint256 indexed projectId, uint256 milestoneIndex, address filedBy);
    event DisputeResponseSubmitted(uint256 indexed disputeId, address responder);
    event ArbitratorsAssigned(uint256 indexed disputeId, address[3] arbitrators);
    event ArbitratorVoted(uint256 indexed disputeId, address arbitrator);
    event DisputeResolved(uint256 indexed disputeId, DisputeOutcome outcome);
    event ArbitratorRegistered(address indexed arbitrator);
    event ArbitratorRemoved(address indexed arbitrator);
    event SponsorshipEnabled(uint256 gasAmount, uint256 collateralAmount);

    // ─── Errors ──────────────────────────────────────────────────────────
    error NotClient();
    error NotFreelancer();
    error NotParty();
    error ProjectNotActive();
    error InvalidMilestone();
    error InvalidStatus();
    error InsufficientDeposit();
    error AlreadyDeposited();
    error AutoReleaseNotReady();
    error AutoReleaseAlreadyPaused();
    error NotArbitrator();
    error AlreadyVoted();
    error DisputeNotInArbitration();
    error NotEnoughArbitrators();
    error TooManyMilestones();
    error ZeroAddress();
    error ZeroAmount();
    error ResponsePeriodNotOver();
    error ResponsePeriodOver();
    error AlreadyArbitrator();
    error NotAnArbitrator();

    // ─── Modifiers ───────────────────────────────────────────────────────
    modifier onlyClient(uint256 _projectId) {
        if (msg.sender != projects[_projectId].client) revert NotClient();
        _;
    }

    modifier onlyFreelancer(uint256 _projectId) {
        if (msg.sender != projects[_projectId].freelancer) revert NotFreelancer();
        _;
    }

    modifier onlyParty(uint256 _projectId) {
        Project storage p = projects[_projectId];
        if (msg.sender != p.client && msg.sender != p.freelancer) revert NotParty();
        _;
    }

    modifier projectActive(uint256 _projectId) {
        if (!projects[_projectId].active) revert ProjectNotActive();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────
    constructor() Ownable(msg.sender) {}

    // ─── Sponsorship ─────────────────────────────────────────────────────

    /// @notice Enable Conflux gas sponsorship for this contract
    /// @dev Requires >= 2 CFX. Splits evenly between gas and collateral sponsorship.
    function enableSponsorship() external payable onlyOwner {
        if (msg.value < 2 ether) revert InsufficientDeposit();
        uint256 half = msg.value / 2;
        SPONSOR.setSponsorForGas{value: half}(address(this), 0.5 ether);
        SPONSOR.setSponsorForCollateral{value: msg.value - half}(address(this));
        emit SponsorshipEnabled(half, msg.value - half);
    }

    // ─── Project Management ──────────────────────────────────────────────

    /// @notice Create a new escrow project with milestones
    /// @param _freelancer Address of the freelancer
    /// @param _name Project name
    /// @param _description Project description
    /// @param _paymentToken ERC20 token address (e.g. USDT0)
    /// @param _milestoneDescriptions Array of milestone descriptions
    /// @param _milestoneAmounts Array of milestone amounts (must match descriptions length)
    function createProject(
        address _freelancer,
        string calldata _name,
        string calldata _description,
        address _paymentToken,
        string[] calldata _milestoneDescriptions,
        uint256[] calldata _milestoneAmounts
    ) external returns (uint256 projectId) {
        if (_freelancer == address(0)) revert ZeroAddress();
        if (_paymentToken == address(0)) revert ZeroAddress();
        if (_milestoneDescriptions.length == 0) revert InvalidMilestone();
        if (_milestoneDescriptions.length != _milestoneAmounts.length) revert InvalidMilestone();
        if (_milestoneDescriptions.length > MAX_MILESTONES) revert TooManyMilestones();

        uint256 total = 0;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            if (_milestoneAmounts[i] == 0) revert ZeroAmount();
            total += _milestoneAmounts[i];
        }

        projectId = projectCount++;
        Project storage p = projects[projectId];
        p.client = msg.sender;
        p.freelancer = _freelancer;
        p.name = _name;
        p.description = _description;
        p.paymentToken = _paymentToken;
        p.totalAmount = total;
        p.milestoneCount = _milestoneDescriptions.length;
        p.createdAt = block.timestamp;
        p.active = true;

        for (uint256 i = 0; i < _milestoneDescriptions.length; i++) {
            milestones[projectId].push(Milestone({
                description: _milestoneDescriptions[i],
                amount: _milestoneAmounts[i],
                status: MilestoneStatus.Pending,
                submittedAt: 0,
                autoReleasePaused: false
            }));
        }

        emit ProjectCreated(projectId, msg.sender, _freelancer, _name, total);
    }

    /// @notice Deposit the full escrow amount for a project
    /// @param _projectId The project to fund
    function depositEscrow(uint256 _projectId)
        external
        onlyClient(_projectId)
        projectActive(_projectId)
    {
        Project storage p = projects[_projectId];
        if (p.funded) revert AlreadyDeposited();

        p.funded = true;
        IERC20(p.paymentToken).safeTransferFrom(msg.sender, address(this), p.totalAmount);

        // Mark first milestone as in progress
        milestones[_projectId][0].status = MilestoneStatus.InProgress;

        emit EscrowDeposited(_projectId, p.totalAmount);
    }

    // ─── Milestone Flow ──────────────────────────────────────────────────

    /// @notice Freelancer submits a milestone for client review
    /// @param _projectId The project ID
    /// @param _milestoneIndex Index of the milestone to submit
    function submitMilestone(uint256 _projectId, uint256 _milestoneIndex)
        external
        onlyFreelancer(_projectId)
        projectActive(_projectId)
    {
        Milestone storage m = _getMilestone(_projectId, _milestoneIndex);
        if (m.status != MilestoneStatus.InProgress) revert InvalidStatus();

        m.status = MilestoneStatus.UnderReview;
        m.submittedAt = block.timestamp;

        emit MilestoneSubmitted(_projectId, _milestoneIndex);
    }

    /// @notice Client approves a milestone — releases funds to freelancer
    /// @param _projectId The project ID
    /// @param _milestoneIndex Index of the milestone to approve
    function approveMilestone(uint256 _projectId, uint256 _milestoneIndex)
        external
        nonReentrant
        onlyClient(_projectId)
        projectActive(_projectId)
    {
        Milestone storage m = _getMilestone(_projectId, _milestoneIndex);
        if (m.status != MilestoneStatus.UnderReview) revert InvalidStatus();

        m.status = MilestoneStatus.Approved;
        _releaseFunds(_projectId, _milestoneIndex);
        _advanceNextMilestone(_projectId, _milestoneIndex);
    }

    /// @notice Client requests a revision on a submitted milestone
    /// @param _projectId The project ID
    /// @param _milestoneIndex Index of the milestone
    function requestRevision(uint256 _projectId, uint256 _milestoneIndex)
        external
        onlyClient(_projectId)
        projectActive(_projectId)
    {
        Milestone storage m = _getMilestone(_projectId, _milestoneIndex);
        if (m.status != MilestoneStatus.UnderReview) revert InvalidStatus();

        m.status = MilestoneStatus.InProgress;
        m.submittedAt = 0;

        emit MilestoneRevisionRequested(_projectId, _milestoneIndex);
    }

    /// @notice Trigger auto-release if client hasn't responded in time
    /// @param _projectId The project ID
    /// @param _milestoneIndex Index of the milestone
    function triggerAutoRelease(uint256 _projectId, uint256 _milestoneIndex)
        external
        nonReentrant
        projectActive(_projectId)
    {
        Milestone storage m = _getMilestone(_projectId, _milestoneIndex);
        if (m.status != MilestoneStatus.UnderReview) revert InvalidStatus();
        if (m.autoReleasePaused) revert AutoReleaseNotReady();
        if (block.timestamp < m.submittedAt + AUTO_RELEASE_PERIOD) revert AutoReleaseNotReady();

        m.status = MilestoneStatus.Approved;
        _releaseFunds(_projectId, _milestoneIndex);
        _advanceNextMilestone(_projectId, _milestoneIndex);

        emit AutoReleaseTriggered(_projectId, _milestoneIndex, m.amount);
    }

    /// @notice Client pauses the auto-release timer (once per milestone)
    /// @param _projectId The project ID
    /// @param _milestoneIndex Index of the milestone
    function pauseAutoRelease(uint256 _projectId, uint256 _milestoneIndex)
        external
        onlyClient(_projectId)
        projectActive(_projectId)
    {
        Milestone storage m = _getMilestone(_projectId, _milestoneIndex);
        if (m.status != MilestoneStatus.UnderReview) revert InvalidStatus();
        if (m.autoReleasePaused) revert AutoReleaseAlreadyPaused();

        m.autoReleasePaused = true;
        emit AutoReleasePaused(_projectId, _milestoneIndex);
    }

    // ─── Dispute System ──────────────────────────────────────────────────

    /// @notice File a dispute on a milestone
    /// @param _projectId The project ID
    /// @param _milestoneIndex Index of the disputed milestone
    /// @param _evidence Evidence string (link or description)
    function fileDispute(
        uint256 _projectId,
        uint256 _milestoneIndex,
        string calldata _evidence
    )
        external
        onlyParty(_projectId)
        projectActive(_projectId)
        returns (uint256 disputeId)
    {
        Milestone storage m = _getMilestone(_projectId, _milestoneIndex);
        if (m.status != MilestoneStatus.UnderReview) revert InvalidStatus();

        m.status = MilestoneStatus.Disputed;

        disputeId = disputeCount++;
        Dispute storage d = disputes[disputeId];
        d.projectId = _projectId;
        d.milestoneIndex = _milestoneIndex;
        d.status = DisputeStatus.Filed;
        d.filedBy = msg.sender;
        d.filedAt = block.timestamp;
        d.responseDeadline = block.timestamp + DISPUTE_RESPONSE_PERIOD;

        // Store evidence based on who filed
        Project storage p = projects[_projectId];
        if (msg.sender == p.client) {
            d.clientEvidence = _evidence;
        } else {
            d.freelancerEvidence = _evidence;
        }

        uint256 key = _disputeKey(_projectId, _milestoneIndex);
        milestoneDispute[key] = disputeId;

        emit DisputeFiled(disputeId, _projectId, _milestoneIndex, msg.sender);
    }

    /// @notice Submit response evidence to a dispute
    /// @param _disputeId The dispute ID
    /// @param _evidence Response evidence string
    function submitDisputeResponse(uint256 _disputeId, string calldata _evidence) external {
        Dispute storage d = disputes[_disputeId];
        if (d.status != DisputeStatus.Filed) revert InvalidStatus();
        if (block.timestamp > d.responseDeadline) revert ResponsePeriodOver();

        Project storage p = projects[d.projectId];
        if (msg.sender == p.client && d.filedBy != p.client) {
            d.clientEvidence = _evidence;
        } else if (msg.sender == p.freelancer && d.filedBy != p.freelancer) {
            d.freelancerEvidence = _evidence;
        } else {
            revert NotParty();
        }

        d.status = DisputeStatus.ResponsePeriod;
        emit DisputeResponseSubmitted(_disputeId, msg.sender);
    }

    /// @notice Assign arbitrators and move to arbitration phase
    /// @dev Can be called after response deadline or after response submitted
    /// @param _disputeId The dispute ID
    function assignArbitrators(uint256 _disputeId) external {
        Dispute storage d = disputes[_disputeId];
        if (d.status != DisputeStatus.Filed && d.status != DisputeStatus.ResponsePeriod)
            revert InvalidStatus();

        // If still in Filed status, response deadline must have passed
        if (d.status == DisputeStatus.Filed) {
            if (block.timestamp < d.responseDeadline) revert ResponsePeriodNotOver();
        }

        if (arbitratorPool.length < MAX_ARBITRATORS_PER_DISPUTE) revert NotEnoughArbitrators();

        // Select 3 pseudo-random arbitrators (exclude parties)
        Project storage p = projects[d.projectId];
        uint256 assigned = 0;
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, _disputeId)));

        for (uint256 i = 0; i < arbitratorPool.length && assigned < 3; i++) {
            uint256 idx = (seed + i) % arbitratorPool.length;
            address candidate = arbitratorPool[idx];
            if (candidate != p.client && candidate != p.freelancer) {
                d.arbitrators[assigned] = candidate;
                assigned++;
            }
        }

        if (assigned < 3) revert NotEnoughArbitrators();

        d.status = DisputeStatus.InArbitration;
        emit ArbitratorsAssigned(_disputeId, d.arbitrators);
    }

    /// @notice Arbitrator casts a vote on a dispute
    /// @param _disputeId The dispute ID
    /// @param _voteForFreelancer True = release to freelancer, false = return to client
    function voteOnDispute(uint256 _disputeId, bool _voteForFreelancer) external {
        Dispute storage d = disputes[_disputeId];
        if (d.status != DisputeStatus.InArbitration) revert DisputeNotInArbitration();
        if (!_isAssignedArbitrator(_disputeId, msg.sender)) revert NotArbitrator();
        if (hasVoted[_disputeId][msg.sender]) revert AlreadyVoted();

        hasVoted[_disputeId][msg.sender] = true;
        d.totalVotes++;

        if (_voteForFreelancer) {
            d.votesForFreelancer++;
        } else {
            d.votesForClient++;
        }

        emit ArbitratorVoted(_disputeId, msg.sender);

        // If all 3 have voted, resolve
        if (d.totalVotes == MAX_ARBITRATORS_PER_DISPUTE) {
            _resolveDispute(_disputeId);
        }
    }

    // ─── Arbitrator Registry ─────────────────────────────────────────────

    /// @notice Register a new arbitrator
    /// @param _arbitrator Address to register
    function registerArbitrator(address _arbitrator) external onlyOwner {
        if (_arbitrator == address(0)) revert ZeroAddress();
        if (isArbitrator[_arbitrator]) revert AlreadyArbitrator();

        isArbitrator[_arbitrator] = true;
        arbitratorPool.push(_arbitrator);
        emit ArbitratorRegistered(_arbitrator);
    }

    /// @notice Remove an arbitrator from the pool
    /// @param _arbitrator Address to remove
    function removeArbitrator(address _arbitrator) external onlyOwner {
        if (!isArbitrator[_arbitrator]) revert NotAnArbitrator();

        isArbitrator[_arbitrator] = false;

        // Remove from array by swapping with last element
        for (uint256 i = 0; i < arbitratorPool.length; i++) {
            if (arbitratorPool[i] == _arbitrator) {
                arbitratorPool[i] = arbitratorPool[arbitratorPool.length - 1];
                arbitratorPool.pop();
                break;
            }
        }
        emit ArbitratorRemoved(_arbitrator);
    }

    // ─── View Functions ──────────────────────────────────────────────────

    /// @notice Get all milestones for a project
    function getProjectMilestones(uint256 _projectId) external view returns (Milestone[] memory) {
        return milestones[_projectId];
    }

    /// @notice Get the number of arbitrators in the pool
    function getArbitratorPoolSize() external view returns (uint256) {
        return arbitratorPool.length;
    }

    /// @notice Get dispute arbitrators
    function getDisputeArbitrators(uint256 _disputeId) external view returns (address[3] memory) {
        return disputes[_disputeId].arbitrators;
    }

    /// @notice Check if auto-release is available for a milestone
    function canAutoRelease(uint256 _projectId, uint256 _milestoneIndex) external view returns (bool) {
        Milestone storage m = milestones[_projectId][_milestoneIndex];
        return m.status == MilestoneStatus.UnderReview
            && !m.autoReleasePaused
            && m.submittedAt > 0
            && block.timestamp >= m.submittedAt + AUTO_RELEASE_PERIOD;
    }

    /// @notice Get remaining time before auto-release (0 if ready)
    function autoReleaseTimeRemaining(uint256 _projectId, uint256 _milestoneIndex) external view returns (uint256) {
        Milestone storage m = milestones[_projectId][_milestoneIndex];
        if (m.submittedAt == 0 || m.autoReleasePaused) return type(uint256).max;
        uint256 deadline = m.submittedAt + AUTO_RELEASE_PERIOD;
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }

    // ─── Internal Functions ──────────────────────────────────────────────

    function _getMilestone(uint256 _projectId, uint256 _milestoneIndex)
        internal
        view
        returns (Milestone storage)
    {
        if (_milestoneIndex >= projects[_projectId].milestoneCount) revert InvalidMilestone();
        return milestones[_projectId][_milestoneIndex];
    }

    function _releaseFunds(uint256 _projectId, uint256 _milestoneIndex) internal {
        Project storage p = projects[_projectId];
        uint256 amount = milestones[_projectId][_milestoneIndex].amount;
        p.releasedAmount += amount;

        IERC20(p.paymentToken).safeTransfer(p.freelancer, amount);

        emit MilestoneApproved(_projectId, _milestoneIndex, amount);

        // If all funds released, deactivate project
        if (p.releasedAmount >= p.totalAmount) {
            p.active = false;
        }
    }

    function _advanceNextMilestone(uint256 _projectId, uint256 _milestoneIndex) internal {
        uint256 nextIdx = _milestoneIndex + 1;
        if (nextIdx < projects[_projectId].milestoneCount) {
            milestones[_projectId][nextIdx].status = MilestoneStatus.InProgress;
        }
    }

    function _resolveDispute(uint256 _disputeId) internal {
        Dispute storage d = disputes[_disputeId];
        d.status = DisputeStatus.Resolved;

        Project storage p = projects[d.projectId];
        Milestone storage m = milestones[d.projectId][d.milestoneIndex];

        if (d.votesForFreelancer > d.votesForClient) {
            d.outcome = DisputeOutcome.ReleasedToFreelancer;
            m.status = MilestoneStatus.Approved;
            uint256 amount = m.amount;
            p.releasedAmount += amount;
            IERC20(p.paymentToken).safeTransfer(p.freelancer, amount);
            _advanceNextMilestone(d.projectId, d.milestoneIndex);
        } else {
            d.outcome = DisputeOutcome.ReturnedToClient;
            m.status = MilestoneStatus.Approved; // Mark as resolved
            uint256 amount = m.amount;
            p.releasedAmount += amount; // Count as handled
            IERC20(p.paymentToken).safeTransfer(p.client, amount);
            _advanceNextMilestone(d.projectId, d.milestoneIndex);
        }

        // Deactivate project if all funds handled
        if (p.releasedAmount >= p.totalAmount) {
            p.active = false;
        }

        emit DisputeResolved(_disputeId, d.outcome);
    }

    function _isAssignedArbitrator(uint256 _disputeId, address _addr) internal view returns (bool) {
        Dispute storage d = disputes[_disputeId];
        return d.arbitrators[0] == _addr || d.arbitrators[1] == _addr || d.arbitrators[2] == _addr;
    }

    function _disputeKey(uint256 _projectId, uint256 _milestoneIndex) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(_projectId, _milestoneIndex)));
    }
}
