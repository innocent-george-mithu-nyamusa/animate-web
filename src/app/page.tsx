"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  Check,
  Sparkles,
  Zap,
  Crown,
  LogIn,
  LogOut,
  Mail,
  Lock,
  User as UserIcon,
  CreditCard,
  Phone,
  ChevronDown,
  Menu,
  Download,
  ShoppingCart,
} from "lucide-react";
import { firebaseAuth } from "@/lib/firebase-client";
import type { User } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getApp } from "firebase/app";
import StructuredData from "@/components/StructuredData";
import FAQSchema from "@/components/FAQSchema";
import SoftwareApplicationSchema from "@/components/SoftwareApplicationSchema";

// Style definitions with their prompts
const STYLES = [
  {
    id: "classic-figure",
    name: "Classic Figure",
    icon: "🎭",
    preview: "/styles/classic-figure.jpg",
    color: "from-blue-500 to-cyan-500",
    prompt: `Create a 1/7 scale commercialized figurine of the characters in the picture, in a realistic style, in a real environment. The figurine is placed on a computer desk. The figurine has a round transparent acrylic base, with no text on the base. The content on the computer screen is a 3D modeling process of this figurine. Next to the computer screen is a toy packaging box, designed in a style reminiscent of high-quality collectible figures, printed with original artwork.`,
  },
  {
    id: "plush-toy",
    name: "Plush Toy",
    icon: "🧸",
    preview: "/styles/plush-toy.jpg",
    color: "from-pink-500 to-rose-500",
    prompt: `A soft, high-quality plush toy of the character in the image, with an oversized head, small body, and stubby limbs. Made of fuzzy fabric with visible stitching and embroidered facial features. The plush is shown sitting against a neutral background. The expression is cute and the lighting is soft and even, with a realistic, collectible plush look.`,
  },
  {
    id: "retro-action",
    name: "Retro Action Hero",
    icon: "💪",
    preview: "/styles/retro-action.jpg",
    color: "from-orange-500 to-red-500",
    prompt: `Convert this photo into a 1980s action figure complete with neon colors, muscle definition, and dramatic pose. Package it in retro-style cardboard backing with comic book artwork, action descriptions, and "COLLECT THEM ALL!" text. Make it look like it belongs in a vintage toy aisle.`,
  },
  {
    id: "superhero",
    name: "Superhero Collectible",
    icon: "⚡",
    preview: "/styles/superhero.jpg",
    color: "from-purple-500 to-indigo-500",
    prompt: `Transform this person into a detailed fantasy RPG figurine with elaborate costume, magical accessories, and heroic pose. Place it on a mystical base with glowing runes, surrounded by miniature fantasy landscape elements like crystals, tiny trees, and magical effects.`,
  },
  {
    id: "pet-companion",
    name: "Pet Companion",
    icon: "🐾",
    preview: "/styles/pet-companion.jpg",
    color: "from-green-500 to-emerald-500",
    prompt: `Create a realistic figurine of this pet with incredibly detailed fur/feather textures, capturing their unique personality and expression. Place on a nature-themed base with tiny grass, flowers, or appropriate habitat elements. Include a small nameplate and paw print details.`,
  },
  {
    id: "studio-ghibli",
    name: "Studio Ghibli",
    icon: "🏰",
    preview: "/styles/studio-ghibli.jpg",
    color: "from-teal-500 to-green-600",
    prompt: `Transform into Studio Ghibli art style with warm, earthy tones, clean organic lines, large expressive eyes, soft painted shadows, and semi-realistic backgrounds with atmospheric perspective. Include nostalgic, cinematic color grading with golden-hour lighting.`,
  },
  {
    id: "video-game",
    name: "16-Bit Character",
    icon: "🎮",
    preview: "/styles/video-game.jpg",
    color: "from-yellow-500 to-orange-600",
    prompt: `Reimagine me as a 16-Bit Video Game character and put me in a 2D 16-bit platform video game with pixel art style, vibrant colors, and retro gaming aesthetics.`,
  },
  {
    id: "anime-figure",
    name: "Anime Figure",
    icon: "🌸",
    preview: "/styles/anime-figure.jpg",
    color: "from-pink-500 to-purple-600",
    prompt: `Transform this into a premium anime figure with dynamic pose, detailed clothing textures, and vibrant colors. Place it in a collector's display case with LED lighting, surrounded by other anime figures on transparent acrylic shelves. Include the original character artwork poster in the background.`,
  },
  {
    id: "funko-pop",
    name: "Funko Pop",
    icon: "🎨",
    preview: "/styles/funko-pop.jpg",
    color: "from-indigo-500 to-blue-600",
    prompt: `Create a detailed 3D render of a chibi Funko Pop figure, strictly based on the provided reference photo. The figure should accurately reflect the person's appearance, hairstyle, attire, and characteristic style from the photo. High detail, studio lighting, photorealistic texture, pure white background.`,
  },
  {
    id: "pen-painting",
    name: "Pen Sketch",
    icon: "✏️",
    preview: "/styles/pen-painting.jpg",
    color: "from-slate-600 to-gray-700",
    prompt: `Create a photo-style line drawing / ink sketch of the faces identical to the uploaded reference image — keep every facial feature, proportion, and expression exactly the same. Use blue and white ink tones with intricate, fine line detailing, drawn on a notebook-page style background. Show a right hand holding a pen and an eraser near the sketch, as if the artist is still working.`,
  },
];

// Pricing tiers
const PRICING_TIERS = [
  {
    id: "free",
    name: "Free",
    usd: 0,
    zwg: 0,
    generations: 3,
    features: [
      "3 generations per month",
      "All 10 styles",
      "Standard resolution",
      "Community support",
    ],
    popular: false,
  },
  {
    id: "standard",
    name: "Standard",
    usd: 9.99,
    zwg: 297,
    generations: 120,
    features: [
      "120 generations per month",
      "All 10 styles",
      "High resolution",
      "Priority processing",
      "Email support",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    usd: 19.99,
    zwg: 620,
    generations: 280,
    features: [
      "280 generations per month",
      "All 10 styles",
      "Ultra-high resolution",
      "Lightning-fast processing",
      "Priority support",
      "Commercial license",
    ],
    popular: false,
  },
];

export default function AnimateSPA() {
  const router = useRouter();
  const [view, setView] = useState<"app" | "pricing">("app");
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [styledImage, setStyledImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [selectedTier, setSelectedTier] = useState<typeof PRICING_TIERS[0] | null>(null);
  const [currency, setCurrency] = useState<"USD" | "ZWG">("USD");
  const [paymentMethod, setPaymentMethod] = useState<"ecocash" | "onemoney" | "card">("ecocash");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [showPolicyDropdown, setShowPolicyDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [userSubscription, setUserSubscription] = useState<{
    tier: string;
    status: string;
    credits: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const styleDropdownRef = useRef<HTMLDivElement>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        setAuthEmail(user.email || "");
        setCheckoutEmail(user.email || "");

        // Fetch user subscription data from Firestore
        try {
          const app = getApp();
          const db = getFirestore(app);
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Credits is an object with {remaining, total, tier, updatedAt}
            const creditsRemaining = typeof userData.credits === 'object'
              ? userData.credits?.remaining || 0
              : userData.credits || 0;

            setUserSubscription({
              tier: userData.subscription?.tier || "free",
              status: userData.subscription?.status || "active",
              credits: creditsRemaining,
            });
          } else {
            // New user - default to free tier
            setUserSubscription({
              tier: "free",
              status: "active",
              credits: 3,
            });
          }
        } catch (error) {
          console.error("Error fetching user subscription:", error);
          // Default to free tier on error
          setUserSubscription({
            tier: "free",
            status: "active",
            credits: 3,
          });
        }
      } else {
        // User is signed out
        setUserSubscription(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPolicyDropdown(false);
      }
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target as Node)) {
        setShowStyleDropdown(false);
      }
    };

    if (showPolicyDropdown || showStyleDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPolicyDropdown, showStyleDropdown]);

  // Reset payment method to ecocash if currency is ZWG and card is selected
  useEffect(() => {
    if (currency === "ZWG" && paymentMethod === "card") {
      setPaymentMethod("ecocash");
    }
  }, [currency, paymentMethod]);

  // Handle image upload
  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setStyledImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  // Process image with AI
  const handleStyleImage = async () => {
    if (!uploadedImage) return;

    // Check if user is signed in
    // if (!user) {
    //   alert('Please sign in to apply styles to your images.');
    //   setShowAuth(true);
    //   return;
    // }

    // Check if user has credits
    if (!userSubscription || userSubscription.credits <= 0) {
      alert('You have no credits. Please upgrade your plan to continue.');
      setView('pricing');
      return;
    }

    setIsProcessing(true);

    try {
      // Get user ID token for authentication
      const idToken = await firebaseAuth.getIdToken();

      if (!idToken) {
        alert('Please sign in to apply styles');
        setShowAuth(true);
        setIsProcessing(false);
        return;
      }

      const response = await fetch('/api/process-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: uploadedImage,
          prompt: selectedStyle.prompt,
          idToken
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }


      const data = await response.json();

      if (data.success) {
        // Set the styled image
        setStyledImage(data.styledImage || uploadedImage);

        // Log the AI description for debugging
        console.log('Style Description:', data.description);

        // Update local state with credits from server response
        // Credits are deducted server-side by the process-image API
        if (userSubscription && typeof data.creditsRemaining === 'number') {
          setUserSubscription({
            ...userSubscription,
            credits: data.creditsRemaining
          });
          console.log('Credits updated. Remaining:', data.creditsRemaining);
        }
      } else {
        throw new Error(data.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Error styling image:', error);
      alert('Failed to style image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download styled image
  const handleDownload = () => {
    if (!styledImage) return;

    const link = document.createElement('a');
    link.href = styledImage;
    link.download = `iconicme-${selectedStyle.id}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Navigate to checkout page to order physical product
  const handleOrder = () => {
    if (!styledImage || !user) {
      alert("Please sign in to order products");
      setShowAuth(true);
      return;
    }

    // Store order data in session storage
    sessionStorage.setItem("checkoutImageData", styledImage);
    sessionStorage.setItem("checkoutStyle", selectedStyle.name);

    // Navigate to checkout page
    router.push("/checkout");
  };

  // Handle authentication
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (authMode === "signin") {
        const result = await firebaseAuth.signIn(authEmail, authPassword);
        if (result.success) {
          setShowAuth(false);
          setAuthEmail("");
          setAuthPassword("");
        } else {
          alert(result.error || "Failed to sign in");
        }
      } else {
        const result = await firebaseAuth.signUp(
          authEmail,
          authPassword,
          authDisplayName
        );
        if (result.success) {
          setShowAuth(false);
          setAuthEmail("");
          setAuthPassword("");
          setAuthDisplayName("");
        } else {
          alert(result.error || "Failed to create account");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert("Authentication failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    try {
      const result = await firebaseAuth.signInWithGoogle();
      if (result.success) {
        setShowAuth(false);
      } else {
        alert(result.error || "Failed to sign in with Google");
      }
    } catch (error) {
      console.error("Google auth error:", error);
      alert("Google authentication failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await firebaseAuth.signOut();
    setUser(null);
  };

  // Handle checkout
  const handleCheckout = (tier: typeof PRICING_TIERS[0]) => {
    // If free tier and user not logged in, show sign up modal
    if (tier.usd === 0 && !user) {
      setAuthMode('signup');
      setShowAuth(true);
      return;
    }

    // If free tier and user is logged in, they already have it
    if (tier.usd === 0 && user) {
      alert('You already have the free plan!');
      setView('app');
      return;
    }

    // For paid tiers, show checkout modal
    setSelectedTier(tier);
    setShowCheckout(true);
  };

  // Process payment
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTier || selectedTier.usd === 0) {
      alert("Please select a paid plan");
      return;
    }

    if (!checkoutEmail || !checkoutPhone) {
      alert("Please fill in all required fields");
      return;
    }

    setAuthLoading(true);

    try {
      // Get user ID token
      const idToken = await firebaseAuth.getIdToken();

      if (!idToken) {
        alert("Please sign in to continue");
        setShowAuth(true);
        setShowCheckout(false);
        return;
      }

      const amount = currency === "USD" ? selectedTier.usd : selectedTier.zwg;

      // Call payment initiation API
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          paymentMethod,
          amount,
          currency,
          phoneNumber: checkoutPhone,
          email: checkoutEmail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `Payment initiated successfully! ${data.message || ""}\n\n${
            data.instructions || ""
          }`
        );
        setShowCheckout(false);

        // If it's a web payment, redirect to payment URL
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      } else {
        alert(data.error || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to process payment. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 text-white">
      {/* Structured Data for SEO */}
      <StructuredData />
      <SoftwareApplicationSchema />
      <FAQSchema />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/prod-logo.png"
                alt="IconicMe Logo"
                className="w-10 h-10 rounded-xl object-contain"
              />
              <span className="text-2xl font-bold">IconicMe</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setView("app")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  view === "app" ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                App
              </button>

              {/* Show Pricing link only if user doesn't have active paid subscription */}
              {(!userSubscription || userSubscription.tier === "free") && (
                <button
                  onClick={() => setView("pricing")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    view === "pricing" ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                >
                  Pricing
                </button>
              )}

              {/* Policies Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowPolicyDropdown(!showPolicyDropdown)}
                  className="px-4 py-2 rounded-lg transition-colors hover:bg-white/10 flex items-center space-x-1"
                >
                  <span>Policies</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showPolicyDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPolicyDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg shadow-xl overflow-hidden z-50">
                    <a
                      href="/privacy-policy"
                      className="block px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10"
                      onClick={() => setShowPolicyDropdown(false)}
                    >
                      <div className="font-semibold">Privacy Policy</div>
                      <div className="text-xs text-gray-400">How we handle your data</div>
                    </a>
                    <a
                      href="/data-deletion-policy"
                      className="block px-4 py-3 hover:bg-white/10 transition-colors"
                      onClick={() => setShowPolicyDropdown(false)}
                    >
                      <div className="font-semibold">Data Deletion Policy</div>
                      <div className="text-xs text-gray-400">Request data removal</div>
                    </a>
                  </div>
                )}
              </div>

              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {/* Subscription Plan Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      userSubscription?.tier === "premium"
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : userSubscription?.tier === "standard"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500"
                        : "bg-gray-600"
                    }`}>
                      {userSubscription?.tier === "premium" && <Crown className="w-3 h-3 inline mr-1" />}
                      {userSubscription?.tier ? userSubscription.tier.charAt(0).toUpperCase() + userSubscription.tier.slice(1) : "Free"}
                    </div>
                    <div className="text-sm">
                      <div className="font-semibold">{user.displayName || "User"}</div>
                      <div className="text-gray-400 text-xs">
                        {userSubscription?.credits || 0} credits
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* Anonymous Badge */}
                  <div className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-700">
                    Anonymous
                  </div>
                  <button
                    onClick={() => setShowAuth(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-700 px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-white/10">
            <div className="px-4 py-4 space-y-3">
              {/* User Info (Mobile) */}
              {user ? (
                <div className="pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      userSubscription?.tier === "premium"
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : userSubscription?.tier === "standard"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500"
                        : "bg-gray-600"
                    }`}>
                      {userSubscription?.tier === "premium" && <Crown className="w-3 h-3 inline mr-1" />}
                      {userSubscription?.tier ? userSubscription.tier.charAt(0).toUpperCase() + userSubscription.tier.slice(1) : "Free"}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{user.displayName || "User"}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {userSubscription?.credits || 0} credits remaining
                  </div>
                </div>
              ) : (
                <div className="pb-3 border-b border-white/10">
                  <div className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 inline-block mb-2">
                    Anonymous
                  </div>
                  <div className="text-sm text-gray-400">Sign in to get started</div>
                </div>
              )}

              {/* Navigation Links */}
              <button
                onClick={() => {
                  setView("app");
                  setShowMobileMenu(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  view === "app" ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                App
              </button>

              {(!userSubscription || userSubscription.tier === "free") && (
                <button
                  onClick={() => {
                    setView("pricing");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    view === "pricing" ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                >
                  Pricing
                </button>
              )}

              {/* Policies */}
              <a
                href="/privacy-policy"
                className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Privacy Policy
              </a>
              <a
                href="/data-deletion-policy"
                className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Data Deletion Policy
              </a>

              {/* Auth Button */}
              {user ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-all flex items-center space-x-2 justify-center"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowAuth(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-700 px-4 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2 justify-center"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="pt-20 px-4 sm:px-6 pb-6">
        {view === "app" ? (
          <div className="max-w-7xl mx-auto h-[calc(100vh-7rem)]">
            <div className="grid lg:grid-cols-[400px_1fr] gap-6 h-full">
              {/* Left Sidebar - Style Gallery (Desktop Only) */}
              <div className="hidden lg:block bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 p-6 overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <Sparkles className="w-6 h-6 mr-2 text-yellow-400" />
                  Choose Style
                </h2>
                <div className="space-y-3">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style)}
                      className={`w-full text-left p-4  rounded-xl transition-all transform hover:scale-[1.02] ${
                        selectedStyle.id === style.id
                          ? `bg-gradient-to-r ${style.color} shadow-lg`
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{style.icon}</div>
                        <div className="flex-1">
                          <div className="font-semibold">{style.name}</div>
                          <div className="text-xs text-white/70 line-clamp-1">
                            {style.prompt.substring(0, 50)}...
                          </div>
                        </div>
                        {selectedStyle.id === style.id && (
                          <Check className="w-5 h-5 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Canvas Area */}
              <div className="flex flex-col space-y-4">
                {/* Mobile Style Selector Dropdown */}
                <div className="lg:hidden bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 p-4 relative z-50" ref={styleDropdownRef}>
                  <div className="relative">
                    <button
                      onClick={() => setShowStyleDropdown(!showStyleDropdown)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all bg-gradient-to-r ${selectedStyle.color}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{selectedStyle.icon}</span>
                        <div className="text-left">
                          <div className="font-semibold">{selectedStyle.name}</div>
                          <div className="text-xs text-white/80">Tap to change style</div>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform ${showStyleDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showStyleDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl max-h-[60vh] overflow-y-auto z-[100]">
                        {STYLES.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => {
                              setSelectedStyle(style);
                              setShowStyleDropdown(false);
                            }}
                            className={`w-full z-1000 text-left p-4 transition-all border-b border-white/10 last:border-b-0 ${
                              selectedStyle.id === style.id
                                ? `bg-gradient-to-r ${style.color}`
                                : "hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{style.icon}</span>
                              <div className="flex-1">
                                <div className="font-semibold">{style.name}</div>
                                <div className="text-xs text-white/70 line-clamp-1">
                                  {style.prompt.substring(0, 40)}...
                                </div>
                              </div>
                              {selectedStyle.id === style.id && (
                                <Check className="w-5 h-5 shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Image Upload/Display Area */}
                <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex-1 flex flex-col">
                  {!uploadedImage ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 border-2 border-dashed border-white/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-white/5 transition-all"
                    >
                      <Upload className="w-16 h-16 mb-4 text-gray-400" />
                      <p className="text-xl font-semibold mb-2">
                        Drop your image here
                      </p>
                      <p className="text-gray-400 mb-4">
                        or click to browse
                      </p>
                      <div className={`inline-flex items-center space-x-2 bg-gradient-to-r ${selectedStyle.color} px-6 py-3 rounded-full font-semibold`}>
                        <span>{selectedStyle.icon}</span>
                        <span>{selectedStyle.name} Style Ready</span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      {/* Original Image */}
                      <div className="relative rounded-xl overflow-hidden bg-black/50">
                        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold z-10">
                          Original
                        </div>
                        <img
                          src={uploadedImage}
                          alt="Original"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Styled Image */}
                      <div className="relative rounded-xl overflow-hidden bg-black/50">
                        <div className={`absolute top-4 left-4 bg-gradient-to-r ${selectedStyle.color} backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold z-10 flex items-center space-x-1`}>
                          <span>{selectedStyle.icon}</span>
                          <span>{selectedStyle.name}</span>
                        </div>
                        {isProcessing ? (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <div className="relative">
                              <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                              <Sparkles className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-500 animate-pulse" />
                            </div>
                            <p className="mt-4 text-gray-300">
                              Applying {selectedStyle.name} style...
                            </p>
                          </div>
                        ) : styledImage ? (
                          <img
                            src={styledImage}
                            alt="Styled"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>Click "Apply Style" to see the magic</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {uploadedImage && (
                  <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <button
                        onClick={() => {
                          setUploadedImage(null);
                          setStyledImage(null);
                        }}
                        className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10 transition-all flex items-center space-x-2"
                      >
                        <X className="w-5 h-5" />
                        <span>Clear</span>
                      </button>

                      <div className="flex-1 flex items-center justify-center space-x-2 text-sm text-gray-300">
                        <span className="text-2xl">{selectedStyle.icon}</span>
                        <span>
                          <strong>{selectedStyle.name}</strong> style selected
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {styledImage && !isProcessing && (
                          <>
                            <button
                              onClick={handleDownload}
                              className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 font-semibold transition-all transform hover:shadow-lg hover:scale-105 flex items-center space-x-2"
                            >
                              <Download className="w-5 h-5" />
                              <span>Download</span>
                            </button>
                            <button
                              onClick={handleOrder}
                              className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 font-semibold transition-all transform hover:shadow-lg hover:scale-105 flex items-center space-x-2"
                            >
                              <ShoppingCart className="w-5 h-5" />
                              <span>Order Your Image Toy</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={handleStyleImage}
                          disabled={isProcessing}
                          className={`px-8 py-3 rounded-lg font-semibold transition-all transform flex items-center space-x-2 ${
                            isProcessing
                              ? "bg-gray-600 cursor-not-allowed"
                              : `bg-gradient-to-r ${selectedStyle.color} hover:shadow-lg hover:scale-105`
                          }`}
                        >
                          <Sparkles className="w-5 h-5" />
                          <span>{isProcessing ? "Processing..." : "Apply Style"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Pricing View */
          <div className="max-w-6xl mx-auto h-[calc(100vh-7rem)] flex flex-col">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
              <p className="text-gray-300">
                Transform your photos into art with flexible pricing
              </p>
              <div className="mt-4 inline-flex items-center space-x-2 bg-white/10 rounded-full p-1">
                <button
                  onClick={() => setCurrency("USD")}
                  className={`px-6 py-2 rounded-full transition-all ${
                    currency === "USD"
                      ? "bg-gradient-to-r from-pink-500 to-purple-700"
                      : "hover:bg-white/10"
                  }`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setCurrency("ZWG")}
                  className={`px-6 py-2 rounded-full transition-all ${
                    currency === "ZWG"
                      ? "bg-gradient-to-r from-pink-500 to-purple-700"
                      : "hover:bg-white/10"
                  }`}
                >
                  ZWG (ZWL)
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 flex-1">
              {PRICING_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className={`bg-black/30 backdrop-blur-md rounded-2xl border p-6 flex flex-col ${
                    tier.popular
                      ? "border-purple-500/50 shadow-lg shadow-purple-500/20 scale-105"
                      : "border-white/10"
                  }`}
                >
                  {tier.popular && (
                    <div className="bg-gradient-to-r from-pink-500 to-purple-700 text-center py-2 -mt-6 -mx-6 mb-4 rounded-t-2xl font-semibold">
                      Most Popular
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <div className="text-4xl font-bold mb-2">
                      {currency === "USD" ? "$" : "ZWL "}
                      {currency === "USD" ? tier.usd : tier.zwg}
                      {tier.usd > 0 && (
                        <span className="text-lg text-gray-300">/mo</span>
                      )}
                    </div>
                    <p className="text-gray-300">
                      {tier.generations} generations/month
                    </p>
                  </div>
                  <ul className="space-y-3 mb-6 flex-1">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleCheckout(tier)}
                    className={`w-full py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                      tier.popular
                        ? "bg-gradient-to-r from-pink-500 to-purple-700 shadow-lg"
                        : "border border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {tier.usd === 0 ? "Get Started" : "Subscribe Now"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-2xl border border-white/20 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Checkout</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Plan Summary */}
            <div className="bg-white/10 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{selectedTier.name} Plan</span>
                {selectedTier.popular && (
                  <Crown className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              <div className="text-3xl font-bold mb-2">
                {currency === "USD" ? "$" : "ZWL "}
                {currency === "USD" ? selectedTier.usd : selectedTier.zwg}
                <span className="text-lg text-gray-300">/month</span>
              </div>
              <p className="text-sm text-gray-300">
                {selectedTier.generations} generations per month
              </p>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">
                Payment Method
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("ecocash")}
                  className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between ${
                    paymentMethod === "ecocash"
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Ecocash</div>
                      <div className="text-xs text-gray-400">Mobile money payment</div>
                    </div>
                  </div>
                  {paymentMethod === "ecocash" && (
                    <Check className="w-5 h-5 text-purple-500" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("onemoney")}
                  className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between ${
                    paymentMethod === "onemoney"
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">OneMoney</div>
                      <div className="text-xs text-gray-400">Mobile money payment</div>
                    </div>
                  </div>
                  {paymentMethod === "onemoney" && (
                    <Check className="w-5 h-5 text-purple-500" />
                  )}
                </button>

                {/* Card payment only available for USD */}
                {currency === "USD" && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between ${
                      paymentMethod === "card"
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">Visa / Mastercard</div>
                        <div className="text-xs text-gray-400">Bank card payment via Paynow</div>
                      </div>
                    </div>
                    {paymentMethod === "card" && (
                      <Check className="w-5 h-5 text-purple-500" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <form onSubmit={handlePayment} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+263 77 123 4567"
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-700 py-4 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? "Processing..." : "Complete Payment"}
              </button>
            </form>

            <p className="text-xs text-center text-gray-400">
              Secure payment • Cancel anytime
            </p>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-2xl border border-white/20 p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {authMode === "signin" ? "Sign In" : "Create Account"}
              </h2>
              <button
                onClick={() => setShowAuth(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4 mb-6">
              {authMode === "signup" && (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={authDisplayName}
                      onChange={(e) => setAuthDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-700 py-4 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? "Loading..." : authMode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-purple-900 to-indigo-900 text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleAuth}
              disabled={authLoading}
              className="w-full border border-white/20 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Google</span>
            </button>

            <p className="text-center text-sm text-gray-400 mt-6">
              {authMode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setAuthMode("signup")}
                    className="text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setAuthMode("signin")}
                    className="text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
