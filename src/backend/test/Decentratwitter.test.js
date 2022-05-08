const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Decentratwitter", () => {
  let decentratwitter;
  let deployer, user1, user2, users;
  let URI = "SampleURI";
  let postHash = "Samplehash";

  beforeEach(async () => {
    //Get signers from development accounts
    [deployer, user1, user2, ...users] = await ethers.getSigners();
    //Deploy the contract
    const DecentratwitterFactory = await ethers.getContractFactory(
      "Decentratwitter"
    );
    decentratwitter = await DecentratwitterFactory.deploy();
    // user1 mints an nft
    await decentratwitter.connect(user1).mint(URI);
  });
  describe("Deployment", () => {
    it("Should track name and symbol", async () => {
      const nftName = "Decentratwitter";
      const nftSymbol = "DT";
      expect(await decentratwitter.name()).to.equal(nftName);
      expect(await decentratwitter.symbol()).to.equal(nftSymbol);
    });
  });

  describe("Minting", () => {
    it("Should track each minted NFT", async () => {
      expect(await decentratwitter.tokenCount()).to.equal(1);
      expect(await decentratwitter.balanceOf(user1.address)).to.equal(1);
      expect(await decentratwitter.tokenURI(1)).to.equal(URI);
      //user2 mints an NFT
      await decentratwitter.connect(user2).mint(URI);
      expect(await decentratwitter.tokenCount()).to.equal(2);
      expect(await decentratwitter.balanceOf(user2.address)).to.equal(1);
      expect(await decentratwitter.tokenURI(2)).to.equal(URI);
    });
  });

  describe("Setting profiles", () => {
    it("Should allow users to select which NFT they own to represent their profile", async () => {
      await decentratwitter.connect(user1).mint(URI);
      await decentratwitter.connect(user1).setProfile(1);

      expect(await decentratwitter.profiles(user1.address)).to.equal(1);

      //Fail case

      await expect(
        decentratwitter.connect(user2).setProfile(1)
      ).to.be.revertedWith(
        "Must own the nft you want to select as your profile"
      );
    });
  });

  describe("Tipping posts", () => {
    it("Should allow users to tip posts and track each posts tip amount", async () => {
      //user1 uploads a post
      await decentratwitter.connect(user1).uploadPost(postHash);
      //Track user1 balance before tipping
      const initAuthorBal = await ethers.provider.getBalance(user1.address);
      const tipAmount = ethers.utils.parseEther("1")// 1 ether = 10**18 wei

      await expect (decentratwitter.connect(user2).tipPostOwner(1, {value:tipAmount})).to.emit(decentratwitter, "PostTipped").withArgs(1,postHash,tipAmount,user1.address);
      // check that tip amount is tracked

      const post = await decentratwitter.posts(1);
      expect(post.tipAmount).to.equal(tipAmount);

      const finalAuthorBal = await ethers.provider.getBalance(user1.address)
      expect(finalAuthorBal).to.equal(initAuthorBal.add(tipAmount));

      // Fail case #1

      await expect(decentratwitter.connect(user2). tipPostOwner(2)).to.be.revertedWith('Invalid post id');

      // Fail case #2

      await expect(decentratwitter.connect(user1).tipPostOwner(1)).to.be.revertedWith('Cannot tip your own post');
      
    });
  });
});
