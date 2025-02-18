import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

// Initial token parameters
const NAME: string = "Lumix Token";
const SYMBOL: string = "LMX";
const DECIMALS: number = 18;
const INITIAL_SUPPLY: number = 10000; // 10k
const CAP: number = 100000; // 100k
const FAUCET_AMOUNT: number = 10;

// Utility function to parse token amounts according to decimals
const parseTokenAmount = (amount: number) =>
  ethers.parseUnits(amount.toString(), DECIMALS);

// Test suite for LumixToken contract
describe("LumixToken", function () {
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const token = await ethers.deployContract("LumixToken", [
      NAME,
      SYMBOL,
      DECIMALS,
      INITIAL_SUPPLY,
      CAP,
      FAUCET_AMOUNT,
    ]);

    await token.waitForDeployment();

    return { token, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);

      expect(await token.contractOwner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await token.balanceOf(owner.address);

      expect(await token.totalSupply()).to.equal(ownerBalance);
    });

    it("Should set the correct token parameters", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      expect(await token.name()).to.equal(NAME);
      expect(await token.symbol()).to.equal(SYMBOL);
      expect(await token.decimals()).to.equal(DECIMALS);
      expect(await token.cap()).to.equal(
        ethers.parseUnits(CAP.toString(), DECIMALS)
      );
      expect(await token.faucetAmount()).to.equal(
        ethers.parseUnits(FAUCET_AMOUNT.toString(), DECIMALS)
      );
    });
  });

  describe("Minting", function () {
    it("Should prevent minting when paused", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      await token.pause();

      await expect(token.mint(parseTokenAmount(100))).to.be.revertedWith(
        "Contract is paused"
      );
    });

    it("Should emit Mint event", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      const mintAmount = parseTokenAmount(100);

      await expect(token.mint(mintAmount))
        .to.emit(token, "Mint")
        .withArgs(owner.address, mintAmount);
    });

    it("Should allow owner to mint tokens", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      const mintAmount = parseTokenAmount(1000);

      await token.mint(mintAmount);

      expect(await token.totalSupply()).to.equal(
        parseTokenAmount(INITIAL_SUPPLY) + mintAmount
      );
    });

    it("Should prevent minting above cap", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      const mintAmount = parseTokenAmount(CAP + 1);

      await expect(token.mint(mintAmount)).to.be.revertedWith("Cap exceeded");
    });
  });

  describe("Burning", function () {
    it("Should prevent burning when paused", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      await token.pause();

      await expect(token.burn(parseTokenAmount(100))).to.be.revertedWith(
        "Contract is paused"
      );
    });

    it("Should emit Burn event", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      const burnAmount = parseTokenAmount(INITIAL_SUPPLY / 2);

      await expect(token.burn(burnAmount))
        .to.emit(token, "Burn")
        .withArgs(owner.address, burnAmount);
    });

    it("Should allow owner to burn tokens", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      const burnAmount = parseTokenAmount(1000);

      await token.burn(burnAmount);

      expect(await token.totalSupply()).to.equal(
        parseTokenAmount(INITIAL_SUPPLY) - burnAmount
      );
    });

    it("Should prevent burning more than balance", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await token.balanceOf(owner.address);
      const burnAmount = ownerBalance + parseTokenAmount(1);

      await expect(token.burn(burnAmount)).to.be.revertedWith(
        "Insufficient balance to burn"
      );
    });
  });

  describe("Pausing", function () {
    it("Should allow owner to pause and unpause", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      await token.pause();
      expect(await token.isPaused()).to.be.true;

      await token.unpause();
      expect(await token.isPaused()).to.be.false;
    });
  });

  describe("Ownership Transfer", function () {
    it("Should emit OwnershipTransferred event", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);

      await expect(token.transferOwnership(addr1.address))
        .to.emit(token, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);
    });

    it("Should allow owner to transfer ownership", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);

      await token.transferOwnership(addr1.address);

      expect(await token.contractOwner()).to.equal(addr1.address);
    });

    it("Should not allow non-owner to transfer ownership", async function () {
      const { token, addr1, addr2 } = await loadFixture(deployTokenFixture);

      await expect(
        token.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWith("Only owner can perform this action");
    });
  });

  describe("Transfers", function () {
    it("Should prevent transfers when paused", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);

      await token.pause();

      await expect(
        token.transfer(addr1.address, parseTokenAmount(100))
      ).to.be.revertedWith("Contract is paused");
    });

    it("Should emit Transfer event", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);
      const transferAmount = parseTokenAmount(INITIAL_SUPPLY / 2);

      await expect(token.transfer(addr1.address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });

    it("Should transfer tokens between accounts", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(
        deployTokenFixture
      );
      const amount = parseTokenAmount(50);

      await expect(
        token.transfer(addr1.address, amount)
      ).to.changeTokenBalances(token, [owner, addr1], [-amount, amount]);

      await expect(
        token.connect(addr1).transfer(addr2.address, amount)
      ).to.changeTokenBalances(token, [addr1, addr2], [-amount, amount]);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);
      const initialOwnerBalance = await token.balanceOf(owner.address);

      await expect(
        token.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("Insufficient balance");

      expect(await token.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });

  describe("Allowances", function () {
    it("Should prevent approvals when paused", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);

      await token.pause();

      await expect(
        token.approve(addr1.address, parseTokenAmount(100))
      ).to.be.revertedWith("Contract is paused");
    });

    it("Should emit Approval event", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);
      const approvalAmount = parseTokenAmount(100);

      await expect(token.approve(addr1.address, approvalAmount))
        .to.emit(token, "Approval")
        .withArgs(owner.address, addr1.address, approvalAmount);
    });

    it("Should update allowance after approve", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);
      const amount = parseTokenAmount(100);

      await token.approve(addr1.address, amount);

      expect(await token.allowance(owner.address, addr1.address)).to.equal(
        amount
      );
    });

    it("Should increase allowance for a spender", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);
      const increaseAmount = parseTokenAmount(100);

      await token.increaseAllowance(addr1.address, increaseAmount);

      expect(await token.allowance(owner.address, addr1.address)).to.equal(
        increaseAmount
      );
    });

    it("Should decrease allowance for a spender", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);
      const increaseAmount = parseTokenAmount(100);
      const decreaseAmount = parseTokenAmount(50);

      await token.increaseAllowance(addr1.address, increaseAmount);
      await token.decreaseAllowance(addr1.address, decreaseAmount);

      expect(await token.allowance(owner.address, addr1.address)).to.equal(
        increaseAmount - decreaseAmount
      );
    });

    it("Should revert when decreasing allowance below zero", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      const decreaseAmount = parseTokenAmount(50);

      await expect(
        token.decreaseAllowance(addr1.address, decreaseAmount)
      ).to.be.revertedWith("Decreased allowance below zero");
    });

    it("Should prevent transfers from allowance when paused", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(
        deployTokenFixture
      );

      await token.approve(addr1.address, parseTokenAmount(100));
      await token.pause();

      await expect(
        token
          .connect(addr1)
          .transferFrom(owner.address, addr2.address, parseTokenAmount(100))
      ).to.be.revertedWith("Contract is paused");
    });

    it("Should transfer tokens using allowance", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(
        deployTokenFixture
      );
      const amount = parseTokenAmount(INITIAL_SUPPLY / 2);

      await token.approve(addr1.address, amount);

      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, amount)
      ).to.changeTokenBalances(token, [owner, addr2], [-amount, amount]);
    });

    it("Should fail if trying to transfer more than allowed", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(
        deployTokenFixture
      );

      await token.approve(addr1.address, parseTokenAmount(99));

      await expect(
        token
          .connect(addr1)
          .transferFrom(owner.address, addr2.address, parseTokenAmount(100))
      ).to.be.revertedWith("Insufficient allowance");
    });
  });

  describe("Faucet", function () {
    it("Should prevent faucet claims when paused", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);

      await token.pause();

      await expect(token.connect(addr1).claimFaucet()).to.be.revertedWith(
        "Contract is paused"
      );
    });

    it("Should increase total supply after faucet claim", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);

      await token.connect(addr1).claimFaucet();

      expect(await token.totalSupply()).to.equal(
        parseTokenAmount(INITIAL_SUPPLY + FAUCET_AMOUNT)
      );
    });

    it("Should allow users to claim from faucet", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);

      await token.connect(addr1).claimFaucet();

      expect(await token.balanceOf(addr1.address)).to.equal(
        parseTokenAmount(FAUCET_AMOUNT)
      );
    });

    it("Should prevent multiple claims from same address", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);

      await token.connect(addr1).claimFaucet();

      await expect(token.connect(addr1).claimFaucet()).to.be.revertedWith(
        "Already claimed faucet"
      );
    });
  });
});
