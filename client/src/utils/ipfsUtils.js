const resolveIPFSUri = (uri) => {
  if (!uri) return '';
  
  // Xử lý giao thức ipfs://
  if (uri.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${uri.substring(7)}`;
  }
  
  // Xử lý định dạng ipfs://ipfs/ (một số NFT sử dụng định dạng này)
  if (uri.startsWith('ipfs://ipfs/')) {
    return uri.replace('ipfs://ipfs/', 'https://ipfs.io/ipfs/');
  }
  
  // Xử lý data URI
  if (uri.startsWith('data:')) {
    return uri;
  }
  
  // Nếu đã là URL HTTP, giữ nguyên
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  return uri;
};

// Hàm xử lý metadata từ IPFS
const resolveIPFSMetadata = (metadata) => {
  if (!metadata) return null;
  
  const resolvedMetadata = { ...metadata };
  
  // Xử lý URI hình ảnh
  if (resolvedMetadata.image) {
    resolvedMetadata.image = resolveIPFSUri(resolvedMetadata.image);
  }
  
  // Xử lý URI animation_url (cho NFT có video hoặc mô hình 3D)
  if (resolvedMetadata.animation_url) {
    resolvedMetadata.animation_url = resolveIPFSUri(resolvedMetadata.animation_url);
  }
  
  // Xử lý external_url
  if (resolvedMetadata.external_url) {
    resolvedMetadata.external_url = resolveIPFSUri(resolvedMetadata.external_url);
  }
  
  return resolvedMetadata;
};