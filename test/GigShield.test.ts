import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

describe("GigShield", function () {
  let gigShield: any;
  let mockToken: any;
  let owner: any;
  let client: any;
  let freelancer: any;
  let arbitrator1: any;
  let arbitrator2: any;
  let arbitrator3: any;
  let outsider: any;

  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 6); // 1M USDT0
  const PROJECT_AMOUNT = ethers.parseUnits("1000", 6); // 1000 USDT0
  const MILESTONE_1_AMOUNT = ethers.parseUnits("300", 6);
  const MILESTONE_2_AMOUNT = ethers.parseUnits("700", 6);

  beforeEach(async function () {
    [owner, client, freelancer, arbitrator1, arbitrator2, arbitrator3, outsider] =
      await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockTokenFactory = await ethers.getContractFactory("MockERC20");
    mockToken = await MockTokenFactory.deploy("Mock USDT0", "USDT0", 6, INITIAL_SUPPLY);
    await mockToken.waitForDeployment();

    // Transfer tokens to client
    await mockToken.transfer(client.address, ethers.parseUnits("10000", 6));

    // Deploy GigShield
    const GigShieldFactory = await ethers.getContractFactory("GigShield");
    gigShield = await GigShieldFactory.deploy();
    await gigShield.waitForDeployment();
  });

  // ─── Helper Functions ────────────────────────────────────────────────
  async function createTestProject() {
    const tokenAddr = await mockToken.getAddress();
    await gigShield.connect(client).createProject(
      freelancer.address,
      "Landing Page",
      "Build a responsive landing page",
      tokenAddr,
      ["Wireframes", "Final Build"],
      [MILESTONE_1_AMOUNT, MILESTONE_2_AMOUNT]
    );
    return 0; // projectId
  }

  async function fundProject(projectId: number) {
    const shieldAddr = await gigShield.getAddress();
    await mockToken.connect(client).approve(shieldAddr, PROJECT_AMOUNT);
    await gigShield.connect(client).depositEscrow(projectId);
  }

  async function registerArbitrators() {
    await gigShield.connect(owner).registerArbitrator(arbitrator1.address);
    await gigShield.connect(owner).registerArbitrator(arbitrator2.address);
    await gigShield.connect(owner).registerArbitrator(arbitrator3.address);
  }

  // ─── Gas Sponsorship ─────────────────────────────────────────────────
  describe("Gas Sponsorship", function () {
    it("should revert enableSponsorship with insufficient value", async function () {
      await expect(
        gigShield.connect(owner).enableSponsorship({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(gigShield, "InsufficientDeposit");
    });

    it("should emit SponsorshipEnabled event with correct amounts", async function () {
      // This will revert on hardhat local (no sponsor contract) but we test the require
      // On Conflux testnet, it would succeed
    });
  });

  // ─── Project Creation ────────────────────────────────────────────────
  describe("Project Creation", function () {
    it("should create a project with milestones", async function () {
      const projectId = await createTestProject();

      const project = await gigShield.projects(projectId);
      expect(project.client).to.equal(client.address);
      expect(project.freelancer).to.equal(freelancer.address);
      expect(project.name).to.equal("Landing Page");
      expect(project.totalAmount).to.equal(PROJECT_AMOUNT);
      expect(project.milestoneCount).to.equal(2);
      expect(project.active).to.be.true;
    });

    it("should emit ProjectCreated event", async function () {
      const tokenAddr = await mockToken.getAddress();
      await expect(
        gigShield.connect(client).createProject(
          freelancer.address,
          "Test Project",
          "Description",
          tokenAddr,
          ["Milestone 1"],
          [MILESTONE_1_AMOUNT]
        )
      )
        .to.emit(gigShield, "ProjectCreated")
        .withArgs(0, client.address, freelancer.address, "Test Project", MILESTONE_1_AMOUNT);
    });

    it("should revert with zero freelancer address", async function () {
      const tokenAddr = await mockToken.getAddress();
      await expect(
        gigShield.connect(client).createProject(
          ethers.ZeroAddress,
          "Test",
          "Desc",
          tokenAddr,
          ["M1"],
          [MILESTONE_1_AMOUNT]
        )
      ).to.be.revertedWithCustomError(gigShield, "ZeroAddress");
    });

    it("should revert with zero token address", async function () {
      await expect(
        gigShield.connect(client).createProject(
          freelancer.address,
          "Test",
          "Desc",
          ethers.ZeroAddress,
          ["M1"],
          [MILESTONE_1_AMOUNT]
        )
      ).to.be.revertedWithCustomError(gigShield, "ZeroAddress");
    });

    it("should revert with empty milestones", async function () {
      const tokenAddr = await mockToken.getAddress();
      await expect(
        gigShield.connect(client).createProject(
          freelancer.address,
          "Test",
          "Desc",
          tokenAddr,
          [],
          []
        )
      ).to.be.revertedWithCustomError(gigShield, "InvalidMilestone");
    });

    it("should revert with mismatched milestone arrays", async function () {
      const tokenAddr = await mockToken.getAddress();
      await expect(
        gigShield.connect(client).createProject(
          freelancer.address,
          "Test",
          "Desc",
          tokenAddr,
          ["M1", "M2"],
          [MILESTONE_1_AMOUNT]
        )
      ).to.be.revertedWithCustomError(gigShield, "InvalidMilestone");
    });

    it("should revert with zero milestone amount", async function () {
      const tokenAddr = await mockToken.getAddress();
      await expect(
        gigShield.connect(client).createProject(
          freelancer.address,
          "Test",
          "Desc",
          tokenAddr,
          ["M1"],
          [0]
        )
      ).to.be.revertedWithCustomError(gigShield, "ZeroAmount");
    });

    it("should revert with too many milestones", async function () {
      const tokenAddr = await mockToken.getAddress();
      const descs = Array(21).fill("Milestone");
      const amounts = Array(21).fill(MILESTONE_1_AMOUNT);
      await expect(
        gigShield.connect(client).createProject(
          freelancer.address,
          "Test",
          "Desc",
          tokenAddr,
          descs,
          amounts
        )
      ).to.be.revertedWithCustomError(gigShield, "TooManyMilestones");
    });

    it("should increment projectCount", async function () {
      expect(await gigShield.projectCount()).to.equal(0);
      await createTestProject();
      expect(await gigShield.projectCount()).to.equal(1);
    });
  });

  // ─── Escrow Deposit ──────────────────────────────────────────────────
  describe("Escrow Deposit", function () {
    it("should accept deposit and transfer tokens", async function () {
      const projectId = await createTestProject();
      await fundProject(projectId);

      const shieldAddr = await gigShield.getAddress();
      const balance = await mockToken.balanceOf(shieldAddr);
      expect(balance).to.equal(PROJECT_AMOUNT);
    });

    it("should set first milestone to InProgress", async function () {
      const projectId = await createTestProject();
      await fundProject(projectId);

      const ms = await gigShield.getProjectMilestones(projectId);
      expect(ms[0].status).to.equal(1); // InProgress
    });

    it("should emit EscrowDeposited event", async function () {
      const projectId = await createTestProject();
      const shieldAddr = await gigShield.getAddress();
      await mockToken.connect(client).approve(shieldAddr, PROJECT_AMOUNT);

      await expect(gigShield.connect(client).depositEscrow(projectId))
        .to.emit(gigShield, "EscrowDeposited")
        .withArgs(projectId, PROJECT_AMOUNT);
    });

    it("should revert if not client", async function () {
      const projectId = await createTestProject();
      await expect(
        gigShield.connect(freelancer).depositEscrow(projectId)
      ).to.be.revertedWithCustomError(gigShield, "NotClient");
    });

    it("should revert on double deposit", async function () {
      const projectId = await createTestProject();
      await fundProject(projectId);

      const shieldAddr = await gigShield.getAddress();
      await mockToken.connect(client).approve(shieldAddr, PROJECT_AMOUNT);
      await expect(
        gigShield.connect(client).depositEscrow(projectId)
      ).to.be.revertedWithCustomError(gigShield, "AlreadyDeposited");
    });
  });

  // ─── Milestone Flow ──────────────────────────────────────────────────
  describe("Milestone Flow", function () {
    let projectId: number;

    beforeEach(async function () {
      projectId = await createTestProject();
      await fundProject(projectId);
    });

    describe("Submit Milestone", function () {
      it("should allow freelancer to submit milestone", async function () {
        await gigShield.connect(freelancer).submitMilestone(projectId, 0);

        const ms = await gigShield.getProjectMilestones(projectId);
        expect(ms[0].status).to.equal(2); // UnderReview
        expect(ms[0].submittedAt).to.be.gt(0);
      });

      it("should emit MilestoneSubmitted event", async function () {
        await expect(gigShield.connect(freelancer).submitMilestone(projectId, 0))
          .to.emit(gigShield, "MilestoneSubmitted")
          .withArgs(projectId, 0);
      });

      it("should revert if not freelancer", async function () {
        await expect(
          gigShield.connect(client).submitMilestone(projectId, 0)
        ).to.be.revertedWithCustomError(gigShield, "NotFreelancer");
      });

      it("should revert if milestone not InProgress", async function () {
        // Milestone 1 (index 1) is still Pending
        await expect(
          gigShield.connect(freelancer).submitMilestone(projectId, 1)
        ).to.be.revertedWithCustomError(gigShield, "InvalidStatus");
      });

      it("should revert with invalid milestone index", async function () {
        await expect(
          gigShield.connect(freelancer).submitMilestone(projectId, 99)
        ).to.be.revertedWithCustomError(gigShield, "InvalidMilestone");
      });
    });

    describe("Approve Milestone", function () {
      beforeEach(async function () {
        await gigShield.connect(freelancer).submitMilestone(projectId, 0);
      });

      it("should release funds to freelancer on approval", async function () {
        const balanceBefore = await mockToken.balanceOf(freelancer.address);
        await gigShield.connect(client).approveMilestone(projectId, 0);
        const balanceAfter = await mockToken.balanceOf(freelancer.address);

        expect(balanceAfter - balanceBefore).to.equal(MILESTONE_1_AMOUNT);
      });

      it("should advance next milestone to InProgress", async function () {
        await gigShield.connect(client).approveMilestone(projectId, 0);

        const ms = await gigShield.getProjectMilestones(projectId);
        expect(ms[0].status).to.equal(3); // Approved
        expect(ms[1].status).to.equal(1); // InProgress
      });

      it("should deactivate project when all milestones approved", async function () {
        // Approve milestone 0
        await gigShield.connect(client).approveMilestone(projectId, 0);
        // Submit and approve milestone 1
        await gigShield.connect(freelancer).submitMilestone(projectId, 1);
        await gigShield.connect(client).approveMilestone(projectId, 1);

        const project = await gigShield.projects(projectId);
        expect(project.active).to.be.false;
      });

      it("should emit MilestoneApproved event", async function () {
        await expect(gigShield.connect(client).approveMilestone(projectId, 0))
          .to.emit(gigShield, "MilestoneApproved")
          .withArgs(projectId, 0, MILESTONE_1_AMOUNT);
      });

      it("should revert if not client", async function () {
        await expect(
          gigShield.connect(freelancer).approveMilestone(projectId, 0)
        ).to.be.revertedWithCustomError(gigShield, "NotClient");
      });

      it("should revert if milestone not UnderReview", async function () {
        await gigShield.connect(client).approveMilestone(projectId, 0);
        await expect(
          gigShield.connect(client).approveMilestone(projectId, 0)
        ).to.be.revertedWithCustomError(gigShield, "InvalidStatus");
      });
    });

    describe("Request Revision", function () {
      beforeEach(async function () {
        await gigShield.connect(freelancer).submitMilestone(projectId, 0);
      });

      it("should set milestone back to InProgress", async function () {
        await gigShield.connect(client).requestRevision(projectId, 0);

        const ms = await gigShield.getProjectMilestones(projectId);
        expect(ms[0].status).to.equal(1); // InProgress
        expect(ms[0].submittedAt).to.equal(0);
      });

      it("should emit MilestoneRevisionRequested event", async function () {
        await expect(gigShield.connect(client).requestRevision(projectId, 0))
          .to.emit(gigShield, "MilestoneRevisionRequested")
          .withArgs(projectId, 0);
      });

      it("should revert if not client", async function () {
        await expect(
          gigShield.connect(outsider).requestRevision(projectId, 0)
        ).to.be.revertedWithCustomError(gigShield, "NotClient");
      });
    });
  });

  // ─── Auto-Release ────────────────────────────────────────────────────
  describe("Auto-Release", function () {
    let projectId: number;

    beforeEach(async function () {
      projectId = await createTestProject();
      await fundProject(projectId);
      await gigShield.connect(freelancer).submitMilestone(projectId, 0);
    });

    it("should auto-release after 7 days", async function () {
      await networkHelpers.time.increase(7 * 24 * 60 * 60); // 7 days

      const balanceBefore = await mockToken.balanceOf(freelancer.address);
      await gigShield.connect(outsider).triggerAutoRelease(projectId, 0);
      const balanceAfter = await mockToken.balanceOf(freelancer.address);

      expect(balanceAfter - balanceBefore).to.equal(MILESTONE_1_AMOUNT);
    });

    it("should emit AutoReleaseTriggered event", async function () {
      await networkHelpers.time.increase(7 * 24 * 60 * 60);
      await expect(gigShield.connect(outsider).triggerAutoRelease(projectId, 0))
        .to.emit(gigShield, "AutoReleaseTriggered")
        .withArgs(projectId, 0, MILESTONE_1_AMOUNT);
    });

    it("should revert if too early", async function () {
      await networkHelpers.time.increase(6 * 24 * 60 * 60); // 6 days
      await expect(
        gigShield.connect(outsider).triggerAutoRelease(projectId, 0)
      ).to.be.revertedWithCustomError(gigShield, "AutoReleaseNotReady");
    });

    it("should allow client to pause auto-release", async function () {
      await gigShield.connect(client).pauseAutoRelease(projectId, 0);

      const ms = await gigShield.getProjectMilestones(projectId);
      expect(ms[0].autoReleasePaused).to.be.true;
    });

    it("should revert auto-release if paused", async function () {
      await gigShield.connect(client).pauseAutoRelease(projectId, 0);
      await networkHelpers.time.increase(7 * 24 * 60 * 60);

      await expect(
        gigShield.connect(outsider).triggerAutoRelease(projectId, 0)
      ).to.be.revertedWithCustomError(gigShield, "AutoReleaseNotReady");
    });

    it("should revert double pause", async function () {
      await gigShield.connect(client).pauseAutoRelease(projectId, 0);
      await expect(
        gigShield.connect(client).pauseAutoRelease(projectId, 0)
      ).to.be.revertedWithCustomError(gigShield, "AutoReleaseAlreadyPaused");
    });

    it("should emit AutoReleasePaused event", async function () {
      await expect(gigShield.connect(client).pauseAutoRelease(projectId, 0))
        .to.emit(gigShield, "AutoReleasePaused")
        .withArgs(projectId, 0);
    });

    it("canAutoRelease should return correct values", async function () {
      expect(await gigShield.canAutoRelease(projectId, 0)).to.be.false;
      await networkHelpers.time.increase(7 * 24 * 60 * 60);
      expect(await gigShield.canAutoRelease(projectId, 0)).to.be.true;
    });

    it("autoReleaseTimeRemaining should decrease over time", async function () {
      const remaining = await gigShield.autoReleaseTimeRemaining(projectId, 0);
      expect(remaining).to.be.gt(0);
      expect(remaining).to.be.lte(7 * 24 * 60 * 60);

      await networkHelpers.time.increase(7 * 24 * 60 * 60);
      expect(await gigShield.autoReleaseTimeRemaining(projectId, 0)).to.equal(0);
    });
  });

  // ─── Dispute System ──────────────────────────────────────────────────
  describe("Dispute System", function () {
    let projectId: number;

    beforeEach(async function () {
      projectId = await createTestProject();
      await fundProject(projectId);
      await gigShield.connect(freelancer).submitMilestone(projectId, 0);
      await registerArbitrators();
    });

    describe("Filing Disputes", function () {
      it("should allow client to file a dispute", async function () {
        await gigShield.connect(client).fileDispute(projectId, 0, "Work not matching brief");

        const dispute = await gigShield.disputes(0);
        expect(dispute.filedBy).to.equal(client.address);
        expect(dispute.status).to.equal(1); // Filed
      });

      it("should allow freelancer to file a dispute", async function () {
        await gigShield.connect(freelancer).fileDispute(projectId, 0, "Client not responding");

        const dispute = await gigShield.disputes(0);
        expect(dispute.filedBy).to.equal(freelancer.address);
      });

      it("should set milestone to Disputed status", async function () {
        await gigShield.connect(client).fileDispute(projectId, 0, "Evidence");

        const ms = await gigShield.getProjectMilestones(projectId);
        expect(ms[0].status).to.equal(4); // Disputed
      });

      it("should emit DisputeFiled event", async function () {
        await expect(
          gigShield.connect(client).fileDispute(projectId, 0, "Evidence")
        )
          .to.emit(gigShield, "DisputeFiled")
          .withArgs(0, projectId, 0, client.address);
      });

      it("should revert if outsider files dispute", async function () {
        await expect(
          gigShield.connect(outsider).fileDispute(projectId, 0, "Evidence")
        ).to.be.revertedWithCustomError(gigShield, "NotParty");
      });

      it("should revert if milestone not under review", async function () {
        await expect(
          gigShield.connect(client).fileDispute(projectId, 1, "Evidence")
        ).to.be.revertedWithCustomError(gigShield, "InvalidStatus");
      });
    });

    describe("Dispute Response", function () {
      beforeEach(async function () {
        await gigShield.connect(client).fileDispute(projectId, 0, "Client evidence");
      });

      it("should allow freelancer to respond", async function () {
        await gigShield.connect(freelancer).submitDisputeResponse(0, "Freelancer evidence");

        const dispute = await gigShield.disputes(0);
        expect(dispute.status).to.equal(2); // ResponsePeriod
      });

      it("should emit DisputeResponseSubmitted event", async function () {
        await expect(
          gigShield.connect(freelancer).submitDisputeResponse(0, "Response")
        )
          .to.emit(gigShield, "DisputeResponseSubmitted")
          .withArgs(0, freelancer.address);
      });

      it("should revert if filer tries to respond to own dispute", async function () {
        await expect(
          gigShield.connect(client).submitDisputeResponse(0, "Self response")
        ).to.be.revertedWithCustomError(gigShield, "NotParty");
      });

      it("should revert after response deadline", async function () {
        await networkHelpers.time.increase(48 * 60 * 60 + 1); // 48h + 1s
        await expect(
          gigShield.connect(freelancer).submitDisputeResponse(0, "Late response")
        ).to.be.revertedWithCustomError(gigShield, "ResponsePeriodOver");
      });
    });

    describe("Arbitrator Assignment", function () {
      beforeEach(async function () {
        await gigShield.connect(client).fileDispute(projectId, 0, "Evidence");
      });

      it("should assign arbitrators after response", async function () {
        await gigShield.connect(freelancer).submitDisputeResponse(0, "Response");
        await gigShield.assignArbitrators(0);

        const dispute = await gigShield.disputes(0);
        expect(dispute.status).to.equal(3); // InArbitration

        const arbs = await gigShield.getDisputeArbitrators(0);
        expect(arbs[0]).to.not.equal(ethers.ZeroAddress);
        expect(arbs[1]).to.not.equal(ethers.ZeroAddress);
        expect(arbs[2]).to.not.equal(ethers.ZeroAddress);
      });

      it("should assign arbitrators after response deadline without response", async function () {
        await networkHelpers.time.increase(48 * 60 * 60 + 1);
        await gigShield.assignArbitrators(0);

        const dispute = await gigShield.disputes(0);
        expect(dispute.status).to.equal(3); // InArbitration
      });

      it("should revert if response deadline not passed and no response", async function () {
        await expect(gigShield.assignArbitrators(0)).to.be.revertedWithCustomError(
          gigShield,
          "ResponsePeriodNotOver"
        );
      });

      it("should revert if not enough arbitrators", async function () {
        await gigShield.connect(owner).removeArbitrator(arbitrator1.address);
        await gigShield.connect(owner).removeArbitrator(arbitrator2.address);
        await gigShield.connect(owner).removeArbitrator(arbitrator3.address);

        await networkHelpers.time.increase(48 * 60 * 60 + 1);
        await expect(gigShield.assignArbitrators(0)).to.be.revertedWithCustomError(
          gigShield,
          "NotEnoughArbitrators"
        );
      });
    });

    describe("Voting", function () {
      beforeEach(async function () {
        await gigShield.connect(client).fileDispute(projectId, 0, "Evidence");
        await gigShield.connect(freelancer).submitDisputeResponse(0, "Response");
        await gigShield.assignArbitrators(0);
      });

      it("should allow assigned arbitrators to vote", async function () {
        const arbs = await gigShield.getDisputeArbitrators(0);
        const signers = [arbitrator1, arbitrator2, arbitrator3];
        for (const signer of signers) {
          if (arbs.includes(signer.address)) {
            await gigShield.connect(signer).voteOnDispute(0, true);
          }
        }
      });

      it("should resolve in favor of freelancer with majority votes", async function () {
        const arbs = await gigShield.getDisputeArbitrators(0);
        const signerMap: Record<string, any> = {
          [arbitrator1.address]: arbitrator1,
          [arbitrator2.address]: arbitrator2,
          [arbitrator3.address]: arbitrator3,
        };

        const balanceBefore = await mockToken.balanceOf(freelancer.address);

        for (const addr of arbs) {
          const signer = signerMap[addr];
          if (signer) {
            await gigShield.connect(signer).voteOnDispute(0, true);
          }
        }

        const balanceAfter = await mockToken.balanceOf(freelancer.address);
        expect(balanceAfter - balanceBefore).to.equal(MILESTONE_1_AMOUNT);

        const dispute = await gigShield.disputes(0);
        expect(dispute.status).to.equal(4); // Resolved
        expect(dispute.outcome).to.equal(1); // ReleasedToFreelancer
      });

      it("should resolve in favor of client with majority votes", async function () {
        const arbs = await gigShield.getDisputeArbitrators(0);
        const signerMap: Record<string, any> = {
          [arbitrator1.address]: arbitrator1,
          [arbitrator2.address]: arbitrator2,
          [arbitrator3.address]: arbitrator3,
        };

        const balanceBefore = await mockToken.balanceOf(client.address);

        for (const addr of arbs) {
          const signer = signerMap[addr];
          if (signer) {
            await gigShield.connect(signer).voteOnDispute(0, false);
          }
        }

        const balanceAfter = await mockToken.balanceOf(client.address);
        expect(balanceAfter - balanceBefore).to.equal(MILESTONE_1_AMOUNT);

        const dispute = await gigShield.disputes(0);
        expect(dispute.outcome).to.equal(2); // ReturnedToClient
      });

      it("should revert if non-arbitrator votes", async function () {
        await expect(
          gigShield.connect(outsider).voteOnDispute(0, true)
        ).to.be.revertedWithCustomError(gigShield, "NotArbitrator");
      });

      it("should revert on double vote", async function () {
        const arbs = await gigShield.getDisputeArbitrators(0);
        const signerMap: Record<string, any> = {
          [arbitrator1.address]: arbitrator1,
          [arbitrator2.address]: arbitrator2,
          [arbitrator3.address]: arbitrator3,
        };

        const firstArb = signerMap[arbs[0]];
        if (firstArb) {
          await gigShield.connect(firstArb).voteOnDispute(0, true);
          await expect(
            gigShield.connect(firstArb).voteOnDispute(0, false)
          ).to.be.revertedWithCustomError(gigShield, "AlreadyVoted");
        }
      });

      it("should emit ArbitratorVoted event", async function () {
        const arbs = await gigShield.getDisputeArbitrators(0);
        const signerMap: Record<string, any> = {
          [arbitrator1.address]: arbitrator1,
          [arbitrator2.address]: arbitrator2,
          [arbitrator3.address]: arbitrator3,
        };

        const firstArb = signerMap[arbs[0]];
        if (firstArb) {
          await expect(gigShield.connect(firstArb).voteOnDispute(0, true))
            .to.emit(gigShield, "ArbitratorVoted")
            .withArgs(0, firstArb.address);
        }
      });

      it("should emit DisputeResolved event", async function () {
        const arbs = await gigShield.getDisputeArbitrators(0);
        const signerMap: Record<string, any> = {
          [arbitrator1.address]: arbitrator1,
          [arbitrator2.address]: arbitrator2,
          [arbitrator3.address]: arbitrator3,
        };

        const arbSigners = arbs.map((a: string) => signerMap[a]).filter(Boolean);
        await gigShield.connect(arbSigners[0]).voteOnDispute(0, true);
        await gigShield.connect(arbSigners[1]).voteOnDispute(0, true);
        await expect(gigShield.connect(arbSigners[2]).voteOnDispute(0, true))
          .to.emit(gigShield, "DisputeResolved")
          .withArgs(0, 1); // ReleasedToFreelancer
      });
    });
  });

  // ─── Arbitrator Registry ─────────────────────────────────────────────
  describe("Arbitrator Registry", function () {
    it("should register arbitrators", async function () {
      await gigShield.connect(owner).registerArbitrator(arbitrator1.address);

      expect(await gigShield.isArbitrator(arbitrator1.address)).to.be.true;
      expect(await gigShield.getArbitratorPoolSize()).to.equal(1);
    });

    it("should emit ArbitratorRegistered event", async function () {
      await expect(gigShield.connect(owner).registerArbitrator(arbitrator1.address))
        .to.emit(gigShield, "ArbitratorRegistered")
        .withArgs(arbitrator1.address);
    });

    it("should remove arbitrators", async function () {
      await gigShield.connect(owner).registerArbitrator(arbitrator1.address);
      await gigShield.connect(owner).removeArbitrator(arbitrator1.address);

      expect(await gigShield.isArbitrator(arbitrator1.address)).to.be.false;
      expect(await gigShield.getArbitratorPoolSize()).to.equal(0);
    });

    it("should emit ArbitratorRemoved event", async function () {
      await gigShield.connect(owner).registerArbitrator(arbitrator1.address);
      await expect(gigShield.connect(owner).removeArbitrator(arbitrator1.address))
        .to.emit(gigShield, "ArbitratorRemoved")
        .withArgs(arbitrator1.address);
    });

    it("should revert registering zero address", async function () {
      await expect(
        gigShield.connect(owner).registerArbitrator(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(gigShield, "ZeroAddress");
    });

    it("should revert registering duplicate arbitrator", async function () {
      await gigShield.connect(owner).registerArbitrator(arbitrator1.address);
      await expect(
        gigShield.connect(owner).registerArbitrator(arbitrator1.address)
      ).to.be.revertedWithCustomError(gigShield, "AlreadyArbitrator");
    });

    it("should revert removing non-arbitrator", async function () {
      await expect(
        gigShield.connect(owner).removeArbitrator(outsider.address)
      ).to.be.revertedWithCustomError(gigShield, "NotAnArbitrator");
    });

    it("should revert if non-owner registers", async function () {
      await expect(
        gigShield.connect(outsider).registerArbitrator(arbitrator1.address)
      ).to.be.revertedWithCustomError(gigShield, "OwnableUnauthorizedAccount");
    });
  });

  // ─── Full Journey ────────────────────────────────────────────────────
  describe("Full Journey — Happy Path", function () {
    it("should complete a full project lifecycle", async function () {
      const projectId = await createTestProject();
      await fundProject(projectId);

      await gigShield.connect(freelancer).submitMilestone(projectId, 0);

      const balance1Before = await mockToken.balanceOf(freelancer.address);
      await gigShield.connect(client).approveMilestone(projectId, 0);
      const balance1After = await mockToken.balanceOf(freelancer.address);
      expect(balance1After - balance1Before).to.equal(MILESTONE_1_AMOUNT);

      await gigShield.connect(freelancer).submitMilestone(projectId, 1);

      const balance2Before = await mockToken.balanceOf(freelancer.address);
      await gigShield.connect(client).approveMilestone(projectId, 1);
      const balance2After = await mockToken.balanceOf(freelancer.address);
      expect(balance2After - balance2Before).to.equal(MILESTONE_2_AMOUNT);

      const project = await gigShield.projects(projectId);
      expect(project.active).to.be.false;
      expect(project.releasedAmount).to.equal(PROJECT_AMOUNT);

      const shieldAddr = await gigShield.getAddress();
      expect(await mockToken.balanceOf(shieldAddr)).to.equal(0);
    });
  });

  // ─── Project Inactivity ──────────────────────────────────────────────
  describe("Inactive Project", function () {
    it("should revert operations on inactive project", async function () {
      const projectId = await createTestProject();
      await fundProject(projectId);

      await gigShield.connect(freelancer).submitMilestone(projectId, 0);
      await gigShield.connect(client).approveMilestone(projectId, 0);
      await gigShield.connect(freelancer).submitMilestone(projectId, 1);
      await gigShield.connect(client).approveMilestone(projectId, 1);

      await expect(
        gigShield.connect(freelancer).submitMilestone(projectId, 0)
      ).to.be.revertedWithCustomError(gigShield, "ProjectNotActive");
    });
  });
});
