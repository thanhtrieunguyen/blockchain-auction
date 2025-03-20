// Rút gọn địa chỉ Ethereum
export const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Định dạng ngày giờ
export const formatDateTime = (date) => {
    if (!date) return '';
    
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit'
    };
    
    return new Date(date).toLocaleDateString('vi-VN', options);
};

// Định dạng số ETH
export const formatEther = (amount) => {
    if (!amount) return '0';
    return parseFloat(amount).toFixed(4);
};
