"use client";

import { useEffect, useState } from "react";
import { loginAdmin, getAllFoodItems, deleteFoodItem, addFoodItem, updateFoodItem, uploadImage } from "../actions";
import { Plus, Edit2, Trash2, Upload, Link as LinkIcon, Loader, CheckCircle2, AlertCircle, X, Sparkles } from "lucide-react";

interface FoodItem {
  id: string;
  name: string;
  price: number;
  photo_url: string;
  created_at?: string;
}

interface ToastMessage {
  type: "success" | "error";
  text: string;
}

export default function AdminPage() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [inputUsername, setInputUsername] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  
  // Image Upload Type
  const [imageSource, setImageSource] = useState<"url" | "file">("url");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Stats
  const [totalDishes, setTotalDishes] = useState(0);
  const [avgPrice, setAvgPrice] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem("admin_auth");
      if (auth === "true") {
        setIsAuthenticated(true);
      }
      setAuthChecked(true);
    }
    fetchItems();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { success, error } = await loginAdmin(inputUsername, inputPassword);

      if (error) throw new Error(error);

      if (success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
        setLoginError("");
      } else {
        setLoginError("Invalid credentials. Try again.");
      }
    } catch (err) {
      console.error("Login verification error:", err);
      // Fallback in case table has not been seeded/created yet
      if (inputUsername === "admin" && inputPassword === "admin123") {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
        setLoginError("");
      } else {
        setLoginError("Invalid credentials. Table 'admin_users' query failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_auth");
    setInputUsername("");
    setInputPassword("");
  };

  useEffect(() => {
    if (items.length > 0) {
      setTotalDishes(items.length);
      const totalSum = items.reduce((sum, item) => sum + Number(item.price), 0);
      setAvgPrice(totalSum / items.length);
    } else {
      setTotalDishes(0);
      setAvgPrice(0);
    }
  }, [items]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  async function fetchItems() {
    setLoading(true);
    try {
      const { data, error } = await getAllFoodItems();

      if (error) throw new Error(error);
      setItems(data || []);
    } catch (err) {
      console.error("Fetch items error:", err);
      showToast("error", "Could not load food items from database. Ensure table structure is created.");
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadFileToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const { url, error } = await uploadImage(formData);
    if (error || !url) {
      throw new Error(error || "Upload failed");
    }
    return url;
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setName("");
    setPrice("");
    setPhotoUrl("");
    setSelectedFile(null);
    setFilePreview(null);
    setImageSource("url");
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: FoodItem) => {
    setEditingItem(item);
    setName(item.name);
    setPrice(item.price.toString());
    setPhotoUrl(item.photo_url || "");
    setSelectedFile(null);
    setFilePreview(null);
    setImageSource(item.photo_url && item.photo_url.startsWith("/uploads/") ? "file" : "url");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      showToast("error", "Name and Price are required.");
      return;
    }

    let finalPhotoUrl = photoUrl;

    if (imageSource === "file" && selectedFile) {
      setUploadingImage(true);
      try {
        finalPhotoUrl = await uploadFileToServer(selectedFile);
        showToast("success", "Photo uploaded successfully!");
      } catch (err) {
        console.warn("Storage upload failed, falling back to base64 encoding:", err);
        try {
          finalPhotoUrl = await convertToBase64(selectedFile);
          showToast("success", "Storage upload failed. Image saved as Base64 in database!");
        } catch (base64Err) {
          console.error("Base64 conversion error:", base64Err);
          showToast("error", "Photo upload and base64 conversion failed.");
          setUploadingImage(false);
          return;
        }
      }
      setUploadingImage(false);
    }

    const itemData = {
      name,
      price: parseFloat(price),
      photo_url: finalPhotoUrl,
    };

    try {
      if (editingItem) {
        // UPDATE
        const { data, error } = await updateFoodItem(editingItem.id, itemData.name, itemData.price, itemData.photo_url);

        if (error || !data) throw new Error(error || "Update failed");
        
        setItems(items.map((item) => (item.id === editingItem.id ? data : item)));
        showToast("success", "Food item updated successfully!");
      } else {
        // CREATE
        const { data, error } = await addFoodItem(itemData.name, itemData.price, itemData.photo_url);

        if (error || !data) throw new Error(error || "Create failed");

        setItems([data, ...items]);
        showToast("success", "Food item added successfully!");
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Database write error:", err);
      const errMsg = err instanceof Error ? err.message : (err as any)?.message || "Unknown error";
      showToast("error", `Failed to save menu item: ${errMsg}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    try {
      const { error } = await deleteFoodItem(id);

      if (error) throw new Error(error);

      setItems(items.filter((item) => item.id !== id));
      showToast("success", "Food item deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("error", "Failed to delete item from database.");
    }
  };

  if (!authChecked) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div 
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid rgba(255, 255, 255, 0.1)",
            borderTopColor: "var(--accent-primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "20px" }}>
        <div className="modal-content" style={{ maxWidth: "400px", margin: "0 auto", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div className="hero-badge" style={{ marginBottom: "12px" }}>
              <Sparkles size={12} /> Restricted Access
            </div>
            <h2 className="modal-title" style={{ marginBottom: "8px" }}>Admin Portal Login</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Enter credentials to manage the food menu</p>
          </div>

          {loginError && (
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                padding: "12px", 
                background: "var(--error-glow)", 
                border: "1px solid rgba(239, 68, 68, 0.2)", 
                borderRadius: "var(--radius-md)", 
                color: "var(--error)", 
                fontSize: "14px", 
                marginBottom: "20px" 
              }}
            >
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label" htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="e.g. admin"
                className="input-field"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: "24px" }}>
              <label className="input-label" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                className="input-field"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} id="login-submit-btn">
              Login to Dashboard
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "var(--text-muted)" }}>
            <span>Hint: Use <strong>admin</strong> / <strong>admin123</strong></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: "80px" }}>
      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Admin Panel Header */}
      <div className="admin-header">
        <div>
          <div className="hero-badge" style={{ marginBottom: "12px" }}>
            <Sparkles size={12} /> Management Portal
          </div>
          <h1 className="admin-title">Admin Dashboard</h1>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn btn-secondary" onClick={handleLogout} id="logout-btn">
            Log Out
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal} id="add-item-btn">
            <Plus size={16} /> Add Food Item
          </button>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-label">Total Dishes</span>
          <span className="stat-value">{totalDishes}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average Price</span>
          <span className="stat-value">${avgPrice.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">System Status</span>
          <span className="stat-value" style={{ color: "var(--success)", fontSize: "20px", display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
            <CheckCircle2 size={18} /> Active
          </span>
        </div>
      </div>

      {/* CRUD List Table */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <div 
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(255, 255, 255, 0.1)",
              borderTopColor: "var(--accent-primary)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}
          />
        </div>
      ) : items.length === 0 ? (
        <div 
          style={{ 
            textAlign: "center", 
            padding: "80px 24px", 
            background: "var(--bg-secondary)", 
            borderRadius: "var(--radius-md)", 
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)"
          }}
        >
          <p style={{ fontSize: "16px", marginBottom: "16px" }}>No items found in your database table.</p>
          <button className="btn btn-primary" onClick={handleOpenAddModal} id="first-add-btn">
            Create Your First Food Item
          </button>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Food Item</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} id={`row-${item.id}`}>
                  <td>
                    <div className="admin-item-meta">
                      <img 
                        src={item.photo_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=100&auto=format&fit=crop&q=80"} 
                        alt={item.name} 
                        className="admin-item-thumb"
                      />
                      <div>
                        <div className="admin-item-name">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--accent-primary)" }}>${Number(item.price).toFixed(2)}</span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: "8px 12px", fontSize: "13px" }} 
                        onClick={() => handleOpenEditModal(item)}
                        id={`edit-btn-${item.id}`}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: "8px 12px", fontSize: "13px" }} 
                        onClick={() => handleDelete(item.id)}
                        id={`delete-btn-${item.id}`}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CRUD Form Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)} id="form-modal">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setModalOpen(false)} 
              style={{ 
                position: "absolute", 
                top: "20px", 
                right: "20px", 
                background: "rgba(255, 255, 255, 0.05)", 
                padding: "8px", 
                borderRadius: "50%",
                cursor: "pointer"
              }}
              id="close-form-btn"
            >
              <X size={16} />
            </button>

            <h2 className="modal-title">{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</h2>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label" htmlFor="food-name">Dish Name</label>
                <input
                  type="text"
                  id="food-name"
                  placeholder="e.g. Grilled Lamb Chops"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="food-price">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  id="food-price"
                  placeholder="e.g. 24.50"
                  className="input-field"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              {/* Photo Upload Options */}
              <div className="input-group" style={{ marginBottom: "8px" }}>
                <label className="input-label">Dish Photo Source</label>
                <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                  <button
                    type="button"
                    className={`btn btn-secondary ${imageSource === "url" ? "active" : ""}`}
                    onClick={() => setImageSource("url")}
                    style={{ flexGrow: 1, padding: "8px 12px", fontSize: "14px", display: "flex", gap: "6px", borderColor: imageSource === "url" ? "var(--accent-primary)" : "" }}
                    id="source-url-btn"
                  >
                    <LinkIcon size={14} /> Image URL
                  </button>
                  <button
                    type="button"
                    className={`btn btn-secondary ${imageSource === "file" ? "active" : ""}`}
                    onClick={() => setImageSource("file")}
                    style={{ flexGrow: 1, padding: "8px 12px", fontSize: "14px", display: "flex", gap: "6px", borderColor: imageSource === "file" ? "var(--accent-primary)" : "" }}
                    id="source-file-btn"
                  >
                    <Upload size={14} /> Upload File
                  </button>
                </div>
              </div>

              {imageSource === "url" ? (
                <div className="input-group">
                  <input
                    type="url"
                    id="food-photo-url"
                    placeholder="https://example.com/images/lamb-chops.jpg"
                    className="input-field"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>We recommend high resolution URLs from Unsplash, or Pexels.</p>
                </div>
              ) : (
                <div className="input-group">
                  <div 
                    className="upload-container" 
                    onClick={() => document.getElementById("file-input")?.click()}
                    id="upload-zone"
                  >
                    <Upload size={24} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                      {selectedFile ? selectedFile.name : "Click to select a food image file"}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Supports JPG, PNG, WEBP (Max 5MB)</p>
                    <input
                      type="file"
                      id="file-input"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </div>
                  {filePreview && (
                    <img 
                      src={filePreview} 
                      alt="Upload preview" 
                      className="upload-preview"
                    />
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: "16px", marginTop: "32px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flexGrow: 1 }}
                  onClick={() => setModalOpen(false)}
                  id="cancel-form-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flexGrow: 2 }}
                  disabled={uploadingImage}
                  id="submit-form-btn"
                >
                  {uploadingImage ? (
                    <>
                      <Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Uploading...
                    </>
                  ) : editingItem ? (
                    "Save Changes"
                  ) : (
                    "Create Item"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
