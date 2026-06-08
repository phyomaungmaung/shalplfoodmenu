"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Sparkles, AlertCircle } from "lucide-react";

interface FoodItem {
  id: string;
  name: string;
  price: number;
  photo_url: string;
}

const MOCK_ITEMS: FoodItem[] = [
  {
    id: "mock-1",
    name: "Truffle Ribeye Steak",
    price: 48.00,
    photo_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "mock-2",
    name: "Pan-Seared Atlantic Salmon",
    price: 36.00,
    photo_url: "https://images.unsplash.com/photo-1485921325814-a50438496667?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "mock-3",
    name: "Burrata & Heirloom Salad",
    price: 18.00,
    photo_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "mock-4",
    name: "Truffle Garlic Parmesan Fries",
    price: 14.00,
    photo_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "mock-5",
    name: "Molten Lava Chocolate Cake",
    price: 16.00,
    photo_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "mock-6",
    name: "Signature Smoked Old Fashioned",
    price: 20.00,
    photo_url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80"
  }
];

export default function MenuPage() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("food_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setItems(data);
        setUsingMockData(false);
      } else {
        setItems(MOCK_ITEMS);
        setUsingMockData(true);
      }
    } catch (err) {
      console.error("Supabase error fetching food items:", err);
      setItems(MOCK_ITEMS);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = items.filter((item) => {
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero Header */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-logo-wrapper">
            <img src="/shalpllogo.png" alt="Shalpl Logo" className="hero-logo" />
          </div>
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={14} /> Premium Food Menu
            </div>
            <h1 className="hero-title">Shalpl Food Menu</h1>
            <p className="hero-subtitle">
              အရသာရှိပြီး သန့်ရှင်းလတ်ဆတ်တဲ့ ဟင်းလျာမျိုးစုံကို တစ်နေရာတည်းမှာ စုံစုံလင်လင် ရှာဖွေကြည့်ရှုလိုက်ပါ။
            </p>
          </div>
        </div>
      </section>

      {/* Main Menu Section */}
      <section className="container" style={{ marginTop: "40px" }}>
        {/* Supabase Mock Alert Warning if using mock data */}
        {usingMockData && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px 20px",
              borderRadius: "var(--radius-md)",
              background: "rgba(245, 158, 11, 0.05)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              marginBottom: "32px",
              color: "var(--accent-primary)",
              fontSize: "14px"
            }}
          >
            <AlertCircle size={18} />
            <span>
              <strong>Note:</strong> Showing pre-loaded demo menu items. Once you insert food items into your Supabase database table `food_items`, this page will dynamically display your custom menu.
            </span>
          </div>
        )}

        {/* Search Bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "40px" }}>
          <div
            style={{
              position: "relative",
              maxWidth: "600px",
              width: "100%",
              margin: "0 auto"
            }}
          >
            <input
              type="text"
              placeholder="Search dishes..."
              className="input-field"
              style={{ paddingLeft: "48px", borderRadius: "var(--radius-full)" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-input"
            />
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "18px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)"
              }}
            />
          </div>
        </div>

        {/* Menu Grid */}
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
            <style jsx global>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-secondary)" }}>
            <p style={{ fontSize: "18px" }}>No culinary items found matching your criteria.</p>
            <button
              className="btn btn-secondary"
              style={{ marginTop: "16px", borderRadius: "var(--radius-full)" }}
              onClick={() => setSearchQuery("")}
              id="clear-filters-btn"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="menu-card"
                id={`menu-card-${item.id}`}
              >
                <div className="menu-card-image-wrapper">
                  <img
                    src={item.photo_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=80"}
                    alt={item.name}
                    className="menu-card-image"
                    loading="lazy"
                  />
                </div>
                <div className="menu-card-body">
                  <div className="menu-card-header" style={{ marginBottom: 0 }}>
                    <h3 className="menu-card-title">{item.name}</h3>
                    <span className="menu-card-price">{Number(item.price).toFixed(2)} MMK</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
