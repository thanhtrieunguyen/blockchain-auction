import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiTrash2 } from "react-icons/fi";
import { MdAssignment, MdAutoAwesome, MdDraw, MdVisibility, MdVisibilityOff, MdExpandLess, MdExpandMore } from "react-icons/md";
import '../css/Drop.css';

const Drop = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState("Proxy");

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
      <span>Drop a collection</span>
      </div>

      <div className="drop-container">
        {/* Main Content */}
        <div className="content-wrapper">
          {/* Left Section: Form */}
          <div className="form-section">
            <h3 className="light-heading">Let's create a smart contract for your drop.</h3>
            <p className="small-text">
              You’ll need to deploy an ERC-721 contract onto the blockchain before
              you can create a drop. <a href="/">What is a contract?</a>
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

          {/* Right Section: Info Box */}
          <div className="info-box">
            <h4>After you deploy your contract you’ll be able to:</h4>
            <p><MdAssignment size={15} /> Manage collection settings</p>
            <small>Edit collection details, earnings, and links.</small>
            
            <p><MdAutoAwesome size={15} /> Set up your drop</p>
            <small>Set up your mint schedule and presale stages.</small>
            
            <p><MdDraw size={15} /> Prepare designs</p>
            <small>Customize your pages and upload all assets.</small>

            <h4>Your community:</h4>
            <p><MdVisibilityOff size={15} /> Can’t view - Your drop page until you publish</p>
            <small>Your drop page or items until you publish them.</small>
            
            <p><MdVisibility size={15} /> Can view - Once deployed on blockchain</p>
            <small>That you’ve deployed a contract onto the blockchain.</small>
          </div>
        </div>

{/* Advanced Settings - Dropdown */}
<div className="advanced-settings">
  <div className="advanced-header" onClick={() => setAdvancedOpen(!advancedOpen)}>
    <span>Advanced settings</span>
    {advancedOpen ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
  </div>

  {advancedOpen && (
    <div className="contract-options">
      {/* Proxy Contract */}
      <div
        className={`contract-card ${selectedContract === "Proxy" ? "selected" : ""}`}
        onClick={() => setSelectedContract("Proxy")}
      >
        <p className="contract-title">Proxy contract</p>
        <p className="contract-description">
          Recommended for most creators. This type of contract is cheaper to deploy but will
          require that wallets who mint, transfer, and sell items from this collection pay
          additional gas fees.
        </p>
        <p className="contract-cost">Estimated cost to deploy contract:</p>
      </div>

      {/* Standard Contract */}
      <div
        className={`contract-card ${selectedContract === "Standard" ? "selected" : ""}`}
        onClick={() => setSelectedContract("Standard")}
      >
        <p className="contract-title">Standard contract</p>
        <p className="contract-description">
          Recommended for advanced creators. This type of contract is more expensive to
          deploy but minting, transfers, and sale interactions will require less gas fees.
        </p>
        <p className="contract-cost">Estimated cost to deploy contract:</p>
      </div>
    </div>
  )}
</div>


        {/* Footer Button */}
        <button className="continue-button">Continue</button>
      </div>
    </div>
  );
};

export default Drop;
