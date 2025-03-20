const NFTMinting = artifacts.require("NFTMinting");
const NFTAuction = artifacts.require("NFTAuction");
const NFTVerifier = artifacts.require("NFTVerifier");

module.exports = function (deployer) {
  // Deploy NFTVerifier trước
  deployer.deploy(NFTVerifier).then(function() {
    // Sau đó deploy NFTMinting
    return deployer.deploy(NFTMinting);
  }).then(function() {
    // Cuối cùng deploy NFTAuction với địa chỉ của NFTMinting
    return deployer.deploy(NFTAuction, NFTMinting.address);
  });
};