export type WishlistGame = {
  id: number;
  igdbId: number | null;
  title: string;
  coverUrl: string;
  releaseYear: number;
  addedAt: string;
  platforms: string[];
};

export type WishlistResponse = {
  games: WishlistGame[];
};

const parseErrorMessage = (body: unknown, fallback: string) => {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) {
      return error;
    }
  }
  return fallback;
};

export const fetchWishlist = async (
  token: string,
  signal?: AbortSignal,
): Promise<WishlistResponse> => {
  const response = await fetch("/api/wishlist", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(body, "Failed to load wishlist."));
  }

  return (await response.json()) as WishlistResponse;
};

export const fetchWishlistStatus = async (
  token: string,
  gameId: number,
  signal?: AbortSignal,
): Promise<{ wishlisted: boolean; addedAt: string | null }> => {
  const response = await fetch(`/api/games/${gameId}/wishlist`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(body, "Failed to load wishlist status."));
  }

  const data = (await response.json()) as {
    wishlisted?: boolean;
    addedAt?: string | null;
  };

  return {
    wishlisted: Boolean(data.wishlisted),
    addedAt: data.addedAt ?? null,
  };
};

export const addToWishlist = async (token: string, gameId: number) => {
  const response = await fetch("/api/wishlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ gameId }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(body, "Wishlist update failed."));
  }

  return response.json();
};

export const removeFromWishlist = async (token: string, gameId: number) => {
  const response = await fetch("/api/wishlist", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ gameId }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(parseErrorMessage(body, "Wishlist update failed."));
  }

  return response.json();
};
