"use client";

import { useEffect, useState, useRef } from "react";
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

const ITEMS_PER_PAGE = 8;

export default function MenuPage() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [activePhotoItem, setActivePhotoItem] = useState<FoodItem | null>(null);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch initial page when debounced search query changes
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchItems(0, debouncedSearchQuery, true);
  }, [debouncedSearchQuery]);

  // Setup Intersection Observer for scrolling loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading && !isFetchingMore) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchItems(nextPage, debouncedSearchQuery, false);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, loading, isFetchingMore, debouncedSearchQuery]);

  // Keyboard listener to close photo lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePhotoItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function fetchItems(pageToFetch: number, search: string, isInitial: boolean) {
    if (isInitial) {
      setLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const from = pageToFetch * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("food_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (search.trim()) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      const { data, error } = await query.range(from, to);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setItems((prev) => (isInitial ? data : [...prev, ...data]));
        setHasMore(data.length === ITEMS_PER_PAGE);
        setUsingMockData(false);
      } else {
        if (isInitial) {
          setItems([]);
        }
        setHasMore(false);
        setUsingMockData(false);
      }
    } catch (err) {
      console.error("Supabase error fetching food items:", err);
      // Fallback to mock data if Supabase query fails and it is the initial fetch
      if (isInitial) {
        const mockFiltered = MOCK_ITEMS.filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase())
        );
        setItems(mockFiltered);
        setUsingMockData(true);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }

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
            <h1 className="hero-title">Shalpal Food Menu</h1>
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
        ) : items.length === 0 ? (
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
          <>
            <div className="menu-grid">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="menu-card"
                  id={`menu-card-${item.id}`}
                >
                  <div
                    className="menu-card-image-wrapper"
                    style={{ cursor: "pointer" }}
                    onClick={() => setActivePhotoItem(item)}
                  >
                    <img
                      src={item.photo_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=80"}
                      alt={item.name}
                      className="menu-card-image"
                      loading="lazy"
                    />
                    <div className="image-hover-overlay">
                      <Sparkles size={18} />
                      <span>View Photo</span>
                    </div>
                  </div>
                  <div className="menu-card-body">
                    <div className="menu-card-header" style={{ marginBottom: 0 }}>
                      <h3 className="menu-card-title">{item.name}</h3>
                      {/* <span className="menu-card-price">{Number(item.price).toFixed(2)} MMK</span> */}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sentinel element for Intersection Observer */}
            <div ref={loaderRef} style={{ height: "60px", margin: "20px 0", display: "flex", justifyContent: "center", alignItems: "center" }}>
              {isFetchingMore && (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    border: "4px solid rgba(255, 255, 255, 0.1)",
                    borderTopColor: "var(--accent-primary)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}
                />
              )}
            </div>
          </>
        )}
      </section>

      {/* Premium Lightbox Modal for Photo viewing */}
      {activePhotoItem && (
        <div
          className="lightbox-overlay"
          onClick={() => setActivePhotoItem(null)}
        >
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="lightbox-close"
              onClick={() => setActivePhotoItem(null)}
              aria-label="Close photo view"
            >
              &times;
            </button>
            <img
              src={activePhotoItem.photo_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=80"}
              alt={activePhotoItem.name}
              className="lightbox-image"
            />
            <div className="lightbox-footer">
              <h3 className="lightbox-title">{activePhotoItem.name}</h3>
              {/* <span className="lightbox-price">{Number(activePhotoItem.price).toFixed(2)} MMK</span> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
