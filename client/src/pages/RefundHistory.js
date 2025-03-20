import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Form, InputGroup, Card, Badge, Spinner, Pagination, Nav } from 'react-bootstrap';
import { useWeb3 } from '../contexts/Web3Context';
import { shortenAddress, formatDateTime } from '../utils/formatters';
import NFTAuctionABI from '../abis/NFTAuctionABI.json';
import { FaSearch, FaHistory, FaEthereum, FaUserCircle, FaUsers, FaExchangeAlt } from 'react-icons/fa';
import '../css/RefundHistory.css';

const RefundHistory = () => {
    const { web3, accounts } = useWeb3();
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [viewMode, setViewMode] = useState('myRefunds'); // 'myRefunds' or 'allRefunds'

    // Lấy dữ liệu sự kiện hoàn tiền từ blockchain
    useEffect(() => {
        const fetchRefunds = async () => {
            if (!web3) return;
            
            try {
                setLoading(true);
                
                // Địa chỉ contract từ .env hoặc cấu hình của bạn
                const contractAddress = process.env.REACT_APP_NFT_AUCTION_ADDRESS;
                const nftAuction = new web3.eth.Contract(NFTAuctionABI, contractAddress);
                
                // Lấy tất cả sự kiện Refunded
                const events = await nftAuction.getPastEvents('Refunded', {
                    fromBlock: 0,
                    toBlock: 'latest'
                });
                
                console.log('Refund events:', events);
                
                // Xử lý từng sự kiện để lấy thêm thông tin
                const refundDetails = await Promise.all(events.map(async (event) => {
                    try {
                        const blockNumber = event.blockNumber;
                        const block = await web3.eth.getBlock(blockNumber);
                        const timestamp = block ? Number(block.timestamp) : Math.floor(Date.now() / 1000);
                        
                        return {
                            transactionHash: event.transactionHash,
                            blockNumber: blockNumber,
                            bidder: event.returnValues.bidder,
                            amount: web3.utils.fromWei(event.returnValues.amount.toString(), 'ether'),
                            timestamp: timestamp * 1000,
                            date: new Date(timestamp * 1000)
                        };
                    } catch (error) {
                        console.error('Error processing refund event:', error);
                        return null;
                    }
                }));
                
                // Lọc bỏ các sự kiện lỗi và sắp xếp theo thời gian giảm dần
                const validRefunds = refundDetails
                    .filter(refund => refund !== null)
                    .sort((a, b) => b.timestamp - a.timestamp);
                
                setRefunds(validRefunds);
            } catch (error) {
                console.error('Error fetching refund history:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchRefunds();
    }, [web3]);
    
    // Lọc dữ liệu dựa trên view mode và từ khóa tìm kiếm
    const filteredRefunds = refunds.filter(refund => {
        // Lọc theo chế độ xem (view mode)
        if (viewMode === 'myRefunds' && accounts && accounts[0]) {
            const isMyRefund = refund.bidder.toLowerCase() === accounts[0].toLowerCase();
            if (!isMyRefund) return false;
        }
        
        // Lọc theo từ khóa tìm kiếm
        return refund.bidder.toLowerCase().includes(searchTerm.toLowerCase()) ||
               refund.transactionHash.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    // Tính toán phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRefunds.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRefunds.length / itemsPerPage);
    
    // Reset về trang đầu khi chuyển chế độ xem hoặc tìm kiếm
    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode, searchTerm]);
    
    // Tạo các nút phân trang
    const pageItems = [];
    for (let number = 1; number <= totalPages; number++) {
        pageItems.push(
            <Pagination.Item key={number} active={number === currentPage} onClick={() => setCurrentPage(number)}>
                {number}
            </Pagination.Item>
        );
    }

    // Tính tổng số ETH đã hoàn tiền dựa trên chế độ xem hiện tại
    const totalRefunded = filteredRefunds.reduce((total, refund) => total + parseFloat(refund.amount), 0);

    return (
        <Container fluid className="refund-container">
            <div className="refund-header">
                <h1 className="refund-title"><FaHistory className="icon-title" /> Lịch sử hoàn tiền</h1>
            </div>
            
            <Container className="content-wrapper">
                {/* Tab Navigation */}
                <Nav variant="pills" className="refund-tabs" activeKey={viewMode} onSelect={(key) => setViewMode(key)}>
                    <Nav.Item>
                        <Nav.Link eventKey="myRefunds">
                            <FaUserCircle className="tab-icon" /> Giao dịch của tôi
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="allRefunds">
                            <FaUsers className="tab-icon" /> Tất cả giao dịch
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
                
                <Row className="stats-row">
                    <Col lg={4} md={6} sm={12} className="mb-4">
                        <Card className="stats-card">
                            <Card.Body>
                                <div className="stats-icon">
                                    <FaExchangeAlt />
                                </div>
                                <div className="stats-content">
                                    <Card.Title>Tổng số giao dịch</Card.Title>
                                    <Card.Text className="stats-value">{filteredRefunds.length}</Card.Text>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4} md={6} sm={12} className="mb-4">
                        <Card className="stats-card">
                            <Card.Body>
                                <div className="stats-icon">
                                    <FaEthereum />
                                </div>
                                <div className="stats-content">
                                    <Card.Title>Tổng ETH đã hoàn</Card.Title>
                                    <Card.Text className="stats-value">{totalRefunded.toFixed(4)} ETH</Card.Text>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4} md={12} sm={12} className="mb-4">
                        <Card className="stats-card">
                            <Card.Body>
                                <div className="stats-icon">
                                    {loading ? <Spinner animation="border" size="sm" /> : <span className="status-dot online"></span>}
                                </div>
                                <div className="stats-content">
                                    <Card.Title>Trạng thái</Card.Title>
                                    <Card.Text className="stats-value">
                                        {loading ? "Đang tải dữ liệu" : "Đã cập nhật"}
                                    </Card.Text>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                
                {/* View mode indicator */}
                <div className="mb-4 mode-indicator">
                    {viewMode === 'myRefunds' ? (
                        <div className="view-badge">
                            <FaUserCircle /> Đang xem: Giao dịch hoàn tiền của tôi
                        </div>
                    ) : (
                        <div className="view-badge all">
                            <FaUsers /> Đang xem: Tất cả giao dịch hoàn tiền trong hệ thống
                        </div>
                    )}
                </div>
                
                {/* Search bar */}
                <div className="search-container mb-4">
                    <InputGroup>
                        <InputGroup.Text className="search-icon">
                            <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                            className="search-box"
                            placeholder="Tìm kiếm theo địa chỉ ví hoặc mã giao dịch..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </div>
                
                {/* Refund table */}
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-animation">
                            <Spinner animation="border" variant="primary" />
                        </div>
                        <p className="loading-text">Đang tải dữ liệu hoàn tiền...</p>
                    </div>
                ) : filteredRefunds.length > 0 ? (
                    <div className="table-container">
                        <Table responsive className="refund-table">
                            <thead>
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Người nhận hoàn tiền</th>
                                    <th>Số lượng (ETH)</th>
                                    <th>Mã giao dịch</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((refund, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className="time-cell">
                                                <span className="date">{formatDateTime(refund.date).split(' ')[0]}</span>
                                                <span className="time">{formatDateTime(refund.date).split(' ')[1]}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="address-cell">
                                                <span className="address-display">
                                                    {shortenAddress(refund.bidder)}
                                                </span>
                                                {accounts && accounts[0] && accounts[0].toLowerCase() === refund.bidder.toLowerCase() && (
                                                    <Badge bg="info" className="user-badge">Bạn</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="amount-cell">
                                                <FaEthereum className="eth-icon" />
                                                <span className="amount-value">{parseFloat(refund.amount).toFixed(4)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="tx-display">
                                                {refund.transactionHash.substring(0, 10)}...{refund.transactionHash.substring(refund.transactionHash.length - 6)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination className="refund-pagination">
                                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                                <Pagination.Prev onClick={() => setCurrentPage(prevPage => Math.max(prevPage - 1, 1))} disabled={currentPage === 1} />
                                {pageItems}
                                <Pagination.Next onClick={() => setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages))} disabled={currentPage === totalPages} />
                                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                            </Pagination>
                        )}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <FaHistory />
                        </div>
                        {viewMode === 'myRefunds' ? (
                            <p>Bạn không có giao dịch hoàn tiền nào.</p>
                        ) : (
                            <p>Không tìm thấy dữ liệu hoàn tiền nào.</p>
                        )}
                    </div>
                )}
                
                {/* Privacy notice */}
                {viewMode === 'allRefunds' && (
                    <div className="mt-4">
                        <Card bg="light" className="privacy-notice">
                            <Card.Body>
                                <Card.Title>Thông báo về quyền riêng tư</Card.Title>
                                <Card.Text>
                                    Để bảo vệ quyền riêng tư, địa chỉ ví được hiển thị ở dạng rút gọn. 
                                    Chỉ chủ sở hữu ví mới nhìn thấy giao dịch được đánh dấu là của họ.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </div>
                )}
            </Container>
        </Container>
    );
};

export default RefundHistory;
