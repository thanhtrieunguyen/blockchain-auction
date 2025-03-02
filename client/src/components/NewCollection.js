import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiTrash2 } from "react-icons/fi";
import '../css/Drop.css';

const NewCollection = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);

  // Xử lý khi người dùng tải ảnh lên
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Xử lý xóa ảnh
  const handleRemoveImage = () => {
    setImage(null);
  };

  return (
    <div className="drop-page">
      {/* Back Button */}
      <div className="back-button" onClick={() => navigate(-1)}>
      <FiArrowLeft size={28} />
      <span>Create an NFT</span>
      </div>

      <div className="drop-container">
        {/* Main Content */}
        <div className="content-wrapper">
          {/* Left Section: Form */}
          <div className="form-section">
            <h3 className="light-heading">First, you’ll need to create a collection for your NFT.</h3>
            <p className="small-text">
            You’ll need to deploy an ERC-1155 contract on the blockchain to create a collection for your NFT. <a href="/">What is a contract?</a>
            </p>

            {/* Upload */}
            <label>Logo image</label>
            <div className="upload-box">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="file-input"
              />
              <div className="upload-content">
                <div className="image-preview">
                  {image ? (
                    <>
                      <img src={image} alt="Preview" className="preview-image" />
                      <button className="delete-button" onClick={handleRemoveImage}>
                        <FiTrash2 className="trash-icon" size={15} />
                      </button>
                    </>
                  ) : (
                    <div className="upload-area"></div>
                  )}
                </div>
                <div className="upload-text">
                  <strong>Drag and drop or click to upload</strong>
                  <p>Recommended size: 350 x 350.</p>
                  <p>File types: JPG, PNG, SVG, or GIF</p>
                </div>
              </div>
            </div>

            {/* Contract Name & Token Symbol */}
            <div className="input-wrapper">
              <div className="input-group">
                <label>Contract name</label>
                <input type="text" placeholder="My Collection Name" />
              </div>
              <div className="input-group">
                <label>Token symbol</label>
                <input type="text" placeholder="MCN" />
              </div>
            </div>

            {/* Blockchain Selection */}
            <div className="blockchain-section">
              <label>Blockchain</label>
              <div className="blockchain-options">
                <label className="blockchain-card">
                  <input type="radio" name="blockchain" value="Ethereum" defaultChecked/>
                  <img 
                    alt="Ethereum" 
                    src="https://opensea.io/static/images/logos/ethereum.svg" 
                    className="blockchain-logo"
                  />
                  <p className="blockchain-name">Ethereum</p>
                  <span className="badge">Most popular</span>
                  <p className="blockchain-cost">
                    Estimated cost to deploy contract:
                  </p>
                </label>

                <label className="blockchain-card">
                  <input type="radio" name="blockchain" value="Base" />
                  <img 
                    alt="Base" 
                    src="https://opensea.io/static/images/logos/base.svg" 
                    className="blockchain-logo"
                  />
                  <p className="blockchain-name">Base</p>
                  <span className="badge cheaper">Cheaper</span>
                  <p className="blockchain-cost">
                    Estimated cost to deploy contract: $0.00
                  </p>
                </label>
              </div>
            </div>
          </div>


        </div>



        {/* Footer Button */}
        <button className="continue-button">Continue</button>
      </div>
    </div>
  );
};

export default NewCollection;
