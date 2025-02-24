```
blockchain-auction/
├── contracts/                  # Thư mục chứa các hợp đồng thông minh (smart contracts).
│   ├── Migrations.sol          # Hợp đồng quản lý các di chuyển (migrations) trên mạng lưới blockchain.
│   ├── NFTMinting.sol          # Hợp đồng thông minh để mint (tạo) NFT mới.
│   ├── NFTAuction.sol          # Hợp đồng thông minh cho chức năng đấu giá NFT.
├── src/                        # Thư mục chứa mã nguồn front-end của ứng dụng.
│   ├── components/             # Thư mục chứa các thành phần giao diện người dùng (UI components).
│   │   ├── Header.js           # Thành phần header của ứng dụng.
│   │   ├── AuctionList.js      # Thành phần hiển thị danh sách các phiên đấu giá.
│   │   ├── CreateAuction.js    # Thành phần để tạo một phiên đấu giá mới.
│   │   ├── MintNFT.js          # Thành phần để mint (tạo) một NFT mới.
│   │   └── WalletConnect.js    # Thành phần kết nối ví người dùng với ứng dụng.
│   ├── context/                # # Thư mục chứa các context của React để quản lý trạng thái toàn cục
│   │   ├── AccountContext.js   # Context quản lý thông tin tài khoản và ví người dùng
│   ├── pages/                  # Thư mục chứa các trang chính của ứng dụng.
│   │   ├── ConnectWallet.js    # Trang connect wallet   
│   │   ├── Home.js             # Trang chủ của ứng dụng.
│   │   ├── Auctions.js         # Trang hiển thị các phiên đấu giá.
│   │   ├── MyAuctions.js       # Trang hiển thị các phiên đấu giá của tôi.
│   │   └── Mint.js             # Trang mint (tạo) NFT.
│   ├── css/                    # Thư mục chứa các tệp CSS để định dạng giao diện người dùng.
│   │   └── styles.css          # Tệp CSS chính của ứng dụng.
│   ├── js/                     # Thư mục chứa các tệp JavaScript.
│   │   ├── App.js              # Tệp JavaScript chính của ứng dụng.
│   │   └── web3.js             # Tệp JavaScript để tương tác với Web3 và blockchain.
│   └── index.html              # Tệp HTML chính của ứng dụng.
├── test/                       # Thư mục chứa các tệp kiểm thử (tests) cho ứng dụng.
│   └── NFTAuction.test.js      # Tệp kiểm thử cho hợp đồng NFTAuction.
├── migrations/                 # Thư mục chứa các tệp di chuyển (migration scripts).
│   ├── 1_initial_migration.js  # Tệp di chuyển ban đầu.
│   └── 2_deploy_contracts.js   # Tệp triển khai các hợp đồng thông minh.
├── .env                        # Tệp cấu hình môi trường cho ứng dụng.
├── package.json                # Tệp cấu hình cho NPM, chứa thông tin về các phụ thuộc của dự án.
├── bs-config.js                # Tệp cấu hình cho Browsersync.
└── truffle-config.js           # Tệp cấu hình cho Truffle, một khung làm việc cho Ethereum.
```
