import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { simpleApi, getApiBaseUrl } from "../services/simpleApi";
import { getMyMadeHelpOffers } from "../services/simpleApi";
import { useToast } from "../hooks/useToast";
import CreatePostModal from "./CreatePostModal";
import ChatModal from "./ChatModal";
import PostDetailModal from "./PostDetailModal";
import LoadingScreen from "./LoadingScreen";
import RatingDisplay from "./RatingDisplay";
import { formatTimeAgo } from "../utils/dateUtils";
import type { HelpOffer } from '../types';

// Import the ExtendedPost type from types
import type { ExtendedPost } from "../types";

function SimplePostsPage() {
  const [posts, setPosts] = useState<ExtendedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ExtendedPost | null>(null);
  const [helpingPosts, setHelpingPosts] = useState<Set<string>>(new Set()); // Track which posts are being helped
  const [modalHelpingPosts, setModalHelpingPosts] = useState<Set<string>>(
    new Set()
  ); // Track which posts are being helped in modal
  const [chatModal, setChatModal] = useState<{
    isOpen: boolean;
    otherUserId: string;
    otherUserName: string;
    postTitle: string;
  }>({
    isOpen: false,
    otherUserId: "",
    otherUserName: "",
    postTitle: "",
  });

  const { showSuccess, showError } = useToast();

  // Erweiterte Filterung mit Helfer-Info:
const loadPosts = useCallback(async () => {
  setLoading(true);
  try {
    const postsData = await simpleApi.getPosts();
    const currentUserId = simpleApi.getCurrentUserId();
    
    // Hole sowohl erhaltene als auch gemachte Angebote
    let receivedOffers: HelpOffer[] = [];
    let madeOffers: HelpOffer[] = [];
    
    try {
      receivedOffers = await simpleApi.getHelpOffers(); // Erhaltene
      madeOffers = await getMyMadeHelpOffers(); // Gemachte (neue API)
    } catch (error) {
      console.error('Error loading help offers:', error);
    }
    
    const filteredPosts = postsData.filter(post => {
      if (post.status === 'in_progress') {
        const isCreator = post.user_id === currentUserId;
        
        // Prüfe sowohl erhaltene als auch gemachte Angebote
        const isHelperFromReceived = receivedOffers.some(offer => 
          offer.post_id === post.id && 
          offer.status === 'accepted'
        );
        
        const isHelperFromMade = madeOffers.some(offer => 
          offer.post_id === post.id && 
          offer.status === 'accepted'
        );
        
        return isCreator || isHelperFromReceived || isHelperFromMade;
      }
      return true;
    });
    
    setPosts(filteredPosts);
    setError("");
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Fehler beim Laden der Posts";
    setError(errorMessage);
    showError("Fehler beim Laden der Posts");
  } finally {
    setLoading(false);
  }
}, [showError]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleHelp = async (post: ExtendedPost) => {
    if (!simpleApi.isAuthenticated()) {
      showError("Sie müssen angemeldet sein, um Hilfe anzubieten");
      return;
    }

    // Mark post as being helped in both states
    setHelpingPosts((prev) => new Set(prev).add(post.id));
    setModalHelpingPosts((prev) => new Set(prev).add(post.id));

    try {
      await simpleApi.offerHelp(post.id);
      showSuccess(
        `Hilfe-Angebot für "${post.title}" erfolgreich gesendet! Der Ersteller wird benachrichtigt.`
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Fehler beim Hilfe anbieten";
      setError(errorMessage);
      showError(errorMessage);
      // Remove from helping posts on error
      setHelpingPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
      setModalHelpingPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
    }
  };

  const handleContact = async (post: ExtendedPost) => {
    if (!simpleApi.isAuthenticated()) {
      showError("Sie müssen angemeldet sein, um Kontakt aufzunehmen");
      return;
    }

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/posts/${post.id}/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({
            message: "Ich bin interessiert an Ihrem Hilfe-Angebot!",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Fehler beim Senden der Kontaktanfrage");
      }

      showSuccess(
        `Kontaktanfrage für "${post.title}" erfolgreich gesendet! Der Anbieter wird benachrichtigt.`
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Fehler beim Kontaktieren des Hilfeangebots";
      setError(errorMessage);
      showError(errorMessage);
    }
  };

  // Filter and sort posts
  const filteredPosts = posts
    .filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory || post.category === selectedCategory;
      const matchesType = !selectedType || post.type === selectedType;
      const matchesMyPosts =
        !showMyPosts || post.user_id === simpleApi.getCurrentUserId();
      return matchesSearch && matchesCategory && matchesType && matchesMyPosts;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        case "location":
          return a.location.localeCompare(b.location);
        default:
          return 0;
      }
    });

  const categories = [
    "Einkaufen",
    "Gartenarbeit",
    "Haustiere",
    "Handwerk",
    "Transport",
    "Kinderbetreuung",
    "Senioren",
    "Sonstiges",
  ];

  if (loading) {
    return (
      <LoadingScreen
        text="Posts werden geladen"
        subtitle="Nachbarschaftshilfe wird vorbereitet..."
        fullScreen={true}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="container-custom">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm"
              >
                <span className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                Nachbarschaftshilfe
              </h1>
              <div className="w-24"></div>
            </div>
          </div>

          {/* Error */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-red-800 mb-2">
              Fehler beim Laden
            </h3>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={loadPosts}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="container-custom">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="hidden sm:inline">Nachbarschaftshilfe</span>
              </h1>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {filteredPosts.length} Posts
              </span>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
              aria-label="Neuen Post erstellen"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Neuen Post erstellen</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6 mb-6">
          {/* Mobile: Collapsible Header */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="w-full flex items-center justify-between text-sm text-gray-900 py-1"
            >
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                  />
                </svg>
                Filter & Suche
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  isFilterExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Desktop: Collapsible Header */}
          <div className="hidden sm:block">
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="w-full flex items-center justify-between text-base sm:text-lg font-semibold text-gray-900"
              aria-label={isFilterExpanded ? "Filter schließen" : "Filter öffnen"}
            >
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                  />
                </svg>
                Filter & Suche
              </div>
              <svg
                className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform ${
                  isFilterExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Filter Grid */}
          <div
            className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${
              isFilterExpanded ? "block" : "hidden"
            }`}
          >
            {/* Search - Full Width on Mobile */}
            <div className="col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Suche
              </label>
              <input
                type="text"
                placeholder="Posts durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Posts durchsuchen"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Kategorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-sm"
              >
                <option value="">Alle</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Typ
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-sm"
              >
                <option value="">Alle</option>
                <option value="request">Hilfe gesucht</option>
                <option value="offer">Hilfe angeboten</option>
              </select>
            </div>

            {/* Sort - Full Width on Mobile */}
            <div className="col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Sortierung
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-sm"
              >
                <option value="newest">Neueste zuerst</option>
                <option value="oldest">Älteste zuerst</option>
                <option value="title">Nach Titel</option>
                <option value="location">Nach Ort</option>
              </select>
            </div>
          </div>

          {/* My Posts Checkbox - Compact on Mobile */}
          <div
            className={`mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 ${
              isFilterExpanded ? "block" : "hidden"
            }`}
          >
            <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showMyPosts}
                onChange={(e) => setShowMyPosts(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                Nur meine Posts anzeigen
              </span>
            </label>
          </div>

          {/* Active Filters - Compact on Mobile */}
          {(searchTerm || selectedCategory || selectedType || showMyPosts) && (
            <div
              className={`mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 ${
                isFilterExpanded ? "block" : "hidden"
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-xs sm:text-sm font-medium text-gray-500">
                  Aktive Filter:
                </span>

                {searchTerm && (
                  <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 sm:gap-2">
                    Suche: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="text-blue-800 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                )}

                {selectedCategory && (
                  <span className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 sm:gap-2">
                    {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory("")}
                      className="text-green-800 hover:text-green-900"
                    >
                      ×
                    </button>
                  </span>
                )}

                {selectedType && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 sm:gap-2">
                    {selectedType === "request"
                      ? "Hilfe gesucht"
                      : "Hilfe angeboten"}
                    <button
                      onClick={() => setSelectedType("")}
                      className="text-yellow-800 hover:text-yellow-900"
                    >
                      ×
                    </button>
                  </span>
                )}

                {showMyPosts && (
                  <span className="bg-purple-100 text-purple-800 px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 sm:gap-2">
                    Meine Posts
                    <button
                      onClick={() => setShowMyPosts(false)}
                      className="text-purple-800 hover:text-purple-900"
                    >
                      ×
                    </button>
                  </span>
                )}

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("");
                    setSelectedType("");
                    setShowMyPosts(false);
                  }}
                  className="bg-gray-100 text-gray-700 px-2 sm:px-3 py-1 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  Alle Filter löschen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Posts */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              Keine Posts gefunden
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {posts.length === 0
                ? "Noch keine Hilfe-Anfragen vorhanden."
                : "Keine Posts entsprechen Ihrer Suche."}
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Post erstellen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Header */}
                <div className="flex items-center mb-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-4 ${
                      post.type === "request"
                        ? "bg-gradient-to-br from-orange-400 to-orange-600"
                        : "bg-gradient-to-br from-green-400 to-green-600"
                    }`}
                  >
                    {post.user.first_name.charAt(0)}
                    {post.user.last_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {post.user.first_name} {post.user.last_name}
                    </h4>
                    <div className="flex items-center gap-2 mb-1">
                      <RatingDisplay
                        userId={post.user_id}
                        size="small"
                        inline={true}
                      />
                    </div>
                    <p className="text-xs text-gray-500 flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {post.location}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      post.type === "request"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {post.type === "request" ? "Sucht Hilfe" : "Bietet Hilfe"}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {post.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(post.created_at)}
                    </span>
                    {/* Post Status Badge - nur anzeigen wenn nicht 'active' */}
                    {post.status !== "active" && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          post.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : post.status === "closed"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {post.status === "in_progress"
                          ? "In Bearbeitung"
                          : post.status === "closed"
                          ? "Geschlossen"
                          : post.status === "rated"
                          ? "Bewertet"
                          : post.status}
                      </span>
                    )}
                    {/* Zusammenarbeit Badge - nur anzeigen wenn aktiv UND noch nicht bewertet */}
                    {post.has_active_collaboration && post.status !== 'rated' && (
                      <span className="inline-flex animate-pulse items-center px-2 py-1 rounded-full text-[12px] text-center font-medium bg-purple-600 text-white">
                        Jetzt Bewerten!
                      </span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {simpleApi.getCurrentUserId() !== post.user_id &&
                      post.status === "active" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHelp(post);
                          }}
                          disabled={
                            helpingPosts.has(post.id) ||
                            modalHelpingPosts.has(post.id) ||
                            post.status !== "active"
                          }
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            helpingPosts.has(post.id) ||
                            modalHelpingPosts.has(post.id) ||
                            post.status !== "active"
                              ? "bg-gray-400 text-white cursor-not-allowed opacity-60"
                              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:-translate-y-0.5"
                          }`}
                        >
                          {helpingPosts.has(post.id) ||
                          modalHelpingPosts.has(post.id)
                            ? "Hilfe gesendet"
                            : post.type === "request"
                            ? "Helfen"
                            : "Kontakt"}
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onPostCreated={loadPosts}
        />

        {/* Chat Modal */}
        <ChatModal
          isOpen={chatModal.isOpen}
          onClose={() => setChatModal((prev) => ({ ...prev, isOpen: false }))}
          otherUserId={chatModal.otherUserId}
          otherUserName={chatModal.otherUserName}
          postTitle={chatModal.postTitle}
        />

        {/* Post Detail Modal */}
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onHelp={handleHelp}
            onContact={handleContact}
            currentUserId={simpleApi.getCurrentUserId() ?? undefined}
            isHelping={modalHelpingPosts.has(selectedPost.id)}
            setIsHelping={(helping: boolean) => {
              if (helping) {
                setModalHelpingPosts((prev) =>
                  new Set(prev).add(selectedPost.id)
                );
              } else {
                setModalHelpingPosts((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(selectedPost.id);
                  return newSet;
                });
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

export default SimplePostsPage;
