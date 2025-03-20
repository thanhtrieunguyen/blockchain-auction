/**
 * Chuyển đổi an toàn giá trị thành chuỗi, xử lý BigInt và các kiểu dữ liệu khác
 * @param {any} value - Giá trị cần chuyển đổi
 * @returns {string} Chuỗi đã chuyển đổi
 */
export const toSafeString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

/**
 * Chuyển đổi an toàn giá trị thành số, xử lý BigInt và các kiểu dữ liệu khác
 * @param {any} value - Giá trị cần chuyển đổi
 * @returns {number} Số đã chuyển đổi
 */
export const toSafeNumber = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return Number(value);
};

/**
 * Chuyển đổi giá trị thành BigInt an toàn
 * @param {any} value - Giá trị cần chuyển đổi
 * @returns {bigint} BigInt đã chuyển đổi
 */
export const toSafeBigInt = (value) => {
  if (value === null || value === undefined) {
    /* global BigInt */
    return BigInt(0);
  }
  if (typeof value === 'bigint') {
    return value;
  }
  // Loại bỏ các ký tự không phải số nếu là chuỗi
  if (typeof value === 'string') {
    value = value.replace(/[^\d.-]/g, '');
  }
  try {
    return BigInt(value);
  } catch (error) {
    console.error('Error converting to BigInt:', error);
    return BigInt(0);
  }
};

/**
 * Tính toán gas limit an toàn với buffer
 * @param {number|string|bigint} estimate - Ước tính gas
 * @param {number} bufferPercent - Phần trăm buffer (mặc định 100%)
 * @returns {number} Gas limit với buffer
 */
export const calculateGasLimit = (estimate, bufferPercent = 100) => {
  const estimateNum = toSafeNumber(estimate);
  const buffer = estimateNum * (bufferPercent / 100);
  return Math.floor(estimateNum + buffer);
};

/**
 * Kiểm tra và log thông tin về các tham số để debug lỗi BigInt
 * @param {Object} params - Đối tượng chứa các tham số cần kiểm tra
 */
export const debugBigIntParams = (params) => {
  console.log("=== DEBUG BIGINT PARAMS ===");
  for (const [key, value] of Object.entries(params)) {
    console.log(`${key}:`, {
      value,
      type: typeof value,
      isBigInt: typeof value === 'bigint',
      asString: toSafeString(value)
    });
  }
  console.log("=========================");
};

/**
 * Chuẩn hóa token ID để sử dụng trong gọi contract
 * @param {string|number|BigInt} tokenId - Token ID
 * @returns {string} Token ID đã chuẩn hóa
 */
export const normalizeTokenId = (tokenId) => {
  return toSafeString(tokenId);
};

/**
 * Chuyển đổi timestamp từ blockchain sang đối tượng Date
 * @param {string|number|BigInt} timestamp - Timestamp từ blockchain
 * @returns {Date} Đối tượng Date
 */
export const toDate = (timestamp) => {
  return new Date(toSafeNumber(timestamp) * 1000);
};
