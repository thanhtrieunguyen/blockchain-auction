/**
 * Rút gọn địa chỉ Ethereum để hiển thị
 * Ví dụ: 0x1234...5678 thay vì 0x1234567890abcdef1234567890abcdef12345678
 * 
 * @param {string} address - Địa chỉ Ethereum cần rút gọn
 * @param {number} startChars - Số ký tự hiển thị ở đầu (mặc định: 6)
 * @param {number} endChars - Số ký tự hiển thị ở cuối (mặc định: 4)
 * @returns {string} Địa chỉ đã được rút gọn
 */
export const truncateAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return '';
  
  // Nếu địa chỉ ngắn hơn tổng số ký tự hiển thị, trả về nguyên bản
  if (address.length <= startChars + endChars) {
    return address;
  }
  
  // Trả về dạng rút gọn: 0x1234...5678
  return `${address.substring(0, startChars)}...${address.substring(
    address.length - endChars
  )}`;
};

/**
 * Kiểm tra xem một chuỗi có phải là địa chỉ Ethereum hợp lệ không
 * 
 * @param {string} address - Chuỗi cần kiểm tra
 * @returns {boolean} true nếu là địa chỉ hợp lệ, false nếu không
 */
export const isValidAddress = (address) => {
  if (!address) return false;
  
  // Kiểm tra định dạng địa chỉ Ethereum (0x + 40 ký tự hex)
  return /^0x[0-9a-fA-F]{40}$/.test(address);
};

/**
 * So sánh hai địa chỉ Ethereum (không phân biệt chữ hoa/thường)
 * 
 * @param {string} address1 - Địa chỉ thứ nhất
 * @param {string} address2 - Địa chỉ thứ hai
 * @returns {boolean} true nếu hai địa chỉ giống nhau, false nếu khác nhau
 */
export const isSameAddress = (address1, address2) => {
  if (!address1 || !address2) return false;
  return address1.toLowerCase() === address2.toLowerCase();
};
