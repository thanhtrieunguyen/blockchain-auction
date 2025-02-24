const NFTMinting = artifacts.require("NFTMinting");
const NFTAuction = artifacts.require("NFTAuction");

module.exports = function (deployer) {
  deployer.deploy(NFTMinting).then(function() {
    return deployer.deploy(NFTAuction, NFTMinting.address);
  });
};