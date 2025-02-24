const NFTMinting = artifacts.require("NFTMinting");
const NFTAuction = artifacts.require("NFTAuction");

contract("NFTAuction - Complete Flow", accounts => {
    let nftMinting, nftAuction;
    const creator = accounts[0];
    const bidder1 = accounts[1];
    const bidder2 = accounts[2];
    
    beforeEach(async () => {
        nftMinting = await NFTMinting.new({ from: creator });
        nftAuction = await NFTAuction.new({ from: creator });
        // Mint NFT và approve cho auction contract
        await nftMinting.mintNFT({ from: creator });
        await nftMinting.approve(nftAuction.address, 0, { from: creator });
    });

    it("should handle complete auction flow correctly", async () => {
        // 1. Tạo đấu giá
        const startPrice = web3.utils.toWei("1", "ether");
        await nftAuction.createAuction(
            nftMinting.address, 
            0, 
            startPrice, 
            1, 
            { from: creator }
        );

        // 2. Lưu balance ban đầu của các người tham gia
        const initialCreatorBalance = BigInt(await web3.eth.getBalance(creator));
        const initialBidder1Balance = BigInt(await web3.eth.getBalance(bidder1));
        const initialBidder2Balance = BigInt(await web3.eth.getBalance(bidder2));

        // 3. Bidder1 đặt giá 2 ETH
        const bid1Amount = web3.utils.toWei("2", "ether");
        await nftAuction.bid(1, { 
            from: bidder1, 
            value: bid1Amount 
        });

        // 4. Lưu balance trước khi bidder2 đặt giá
        const balanceBeforeRefund = BigInt(await web3.eth.getBalance(bidder1));

        // 5. Bidder2 đặt giá cao hơn 3 ETH
        const bid2Amount = web3.utils.toWei("3", "ether");
        await nftAuction.bid(1, { 
            from: bidder2, 
            value: bid2Amount 
        });

        // 6. Kiểm tra bidder1 đã được hoàn tiền
        const balanceAfterRefund = BigInt(await web3.eth.getBalance(bidder1));
        const refundAmount = BigInt(bid1Amount);
        
        // So sánh số dư sau khi được hoàn tiền phải gần bằng với:
        // Số dư trước đó + số tiền hoàn lại
        const difference = balanceAfterRefund - (balanceBeforeRefund + refundAmount);
        
        // Cho phép sai số nhỏ do gas fee
        assert.isTrue(
            difference > BigInt(-1000000000000000) && difference < BigInt(1000000000000000),
            "Bidder1 should receive refund approximately equal to their bid"
        );

        // 7. Tăng thời gian để kết thúc đấu giá
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [120],
            id: Date.now()
        }, () => {});
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: Date.now()
        }, () => {});

        // 8. Kết thúc đấu giá
        await nftAuction.finalizeAuction(1, { from: creator });

        // 9. Kiểm tra creator đã nhận được tiền
        const finalCreatorBalance = BigInt(await web3.eth.getBalance(creator));
        assert.isTrue(
            finalCreatorBalance > initialCreatorBalance, 
            "Creator should receive payment"
        );

        // 10. Kiểm tra NFT đã được chuyển cho người thắng cuộc (bidder2)
        const finalNFTOwner = await nftMinting.ownerOf(0);
        assert.equal(
            finalNFTOwner, 
            bidder2, 
            "NFT should be transferred to highest bidder"
        );

        // 11. Kiểm tra số dư của bidder2
        const finalBidder2Balance = BigInt(await web3.eth.getBalance(bidder2));
        assert.isTrue(
            initialBidder2Balance > finalBidder2Balance, 
            "Bidder2 balance should decrease after winning auction"
        );

        // 12. Kiểm tra trạng thái đấu giá
        const auction = await nftAuction.auctions(1);
        assert.isTrue(auction.ended, "Auction should be marked as ended");
        assert.equal(auction.highestBidder, bidder2, "Highest bidder should be bidder2");
        assert.equal(
            BigInt(auction.highestBid).toString(), 
            BigInt(bid2Amount).toString(), 
            "Highest bid should be 3 ETH"
        );
    });

    it("should handle auction with no bids correctly", async () => {
        // 1. Tạo đấu giá
        await nftAuction.createAuction(
            nftMinting.address, 
            0, 
            web3.utils.toWei("1", "ether"), 
            1, 
            { from: creator }
        );

        // 2. Tăng thời gian để kết thúc đấu giá
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [120],
            id: Date.now()
        }, () => {});
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: Date.now()
        }, () => {});

        // 3. Kết thúc đấu giá
        await nftAuction.finalizeAuction(1, { from: creator });

        // 4. Kiểm tra NFT được trả về cho creator
        const finalNFTOwner = await nftMinting.ownerOf(0);
        assert.equal(
            finalNFTOwner, 
            creator, 
            "NFT should be returned to creator if no bids"
        );
    });
});
