import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CreateGamePage from "./page";

// Mock router and search params
const mockPush = vi.fn();
let mockUrlParams = new URLSearchParams({
  code: "ABCD",
  gameId: "123",
  username: "testuser",
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockUrlParams,
}));

// Mock Supabase Server client
const channelListeners = new Map<
  string,
  Array<{ event: string; filter?: { event?: string; [key: string]: unknown }; callback: (...args: unknown[]) => void }>
>();
const channelSubscribeCallbacks = new Map<string, (...args: unknown[]) => void>();
let lastChannelName = "";

interface MockChannel {
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  track: ReturnType<typeof vi.fn>;
  presenceState: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
}

const mockChannel: MockChannel = {
  on: vi.fn().mockImplementation((event: string, filter: unknown, callback?: (...args: unknown[]) => void) => {
    const cb = typeof filter === "function"
      ? (filter as (...args: unknown[]) => void)
      : callback;
    if (cb) {
      const listeners = channelListeners.get(lastChannelName) || [];
      listeners.push({
        event,
        filter: typeof filter === "function" ? undefined : (filter as { event?: string; [key: string]: unknown }),
        callback: cb,
      });
      channelListeners.set(lastChannelName, listeners);
    }
    return mockChannel;
  }),
  subscribe: vi.fn().mockImplementation((cb?: (...args: unknown[]) => void) => {
    if (cb) {
      channelSubscribeCallbacks.set(lastChannelName, cb);
    }
    return mockChannel;
  }),
  track: vi.fn().mockResolvedValue({}),
  presenceState: vi.fn().mockReturnValue({}),
  send: vi.fn().mockResolvedValue({}),
};

vi.mock("@/lib/supabase/client", () => ({
  supabaseServer: {
    channel: vi.fn((name) => {
      lastChannelName = name;
      return mockChannel;
    }),
    removeChannel: vi.fn(),
  },
}));

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockPush.mockClear();
  vi.clearAllMocks();
  channelListeners.clear();
  channelSubscribeCallbacks.clear();
  // Reset default URL search params
  mockUrlParams = new URLSearchParams({
    code: "ABCD",
    gameId: "123",
    username: "testuser",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CreateGamePage - UI Rendering and Roles", () => {

  test("renders loading state initially", async () => {
    // Return a promise that doesn't resolve to hold the loading state
    mockFetch.mockReturnValue(new Promise(() => {}));

    render(<CreateGamePage />);

    expect(screen.getByText("Loading players...")).toBeInTheDocument();
  });

  test("renders error state when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Failed to fetch players" }),
    });

    render(<CreateGamePage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch players")).toBeInTheDocument();
    });
  });

  test("renders empty player list message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ players: [] }),
    });

    render(<CreateGamePage />);

    await waitFor(() => {
      expect(screen.getByText("No players yet.")).toBeInTheDocument();
    });
  });

  test("renders player list with 'You', 'Host', and ready status badges", async () => {
    // Current user is "testuser"
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        players: [
          {
            id: "p1",
            username: "testuser",
            is_host: true,
            is_ready: true,
            avatar_url: null,
          },
          {
            id: "p2",
            username: "otherplayer",
            is_host: false,
            is_ready: false,
            avatar_url: null,
          },
        ],
      }),
    });

    render(<CreateGamePage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading players...")).not.toBeInTheDocument();
    });

    // Check usernames are rendered
    expect(screen.getByText(/testuser/)).toBeInTheDocument();
    expect(screen.getByText(/otherplayer/)).toBeInTheDocument();

    // Check "You" badge is rendered for current player
    expect(screen.getByText("You")).toBeInTheDocument();

    // Check "Host" badge is rendered for host player
    expect(screen.getByText("Host")).toBeInTheDocument();

    // Check correct ready/not-ready status badges
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Not Ready")).toBeInTheDocument();
  });

  test("renders controls for regular (non-host) player", async () => {
    // Current user is "otherplayer" (not host)
    mockUrlParams = new URLSearchParams({
      code: "ABCD",
      gameId: "123",
      username: "otherplayer",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        players: [
          {
            id: "p1",
            username: "hostplayer",
            is_host: true,
            is_ready: true,
            avatar_url: null,
          },
          {
            id: "p2",
            username: "otherplayer",
            is_host: false,
            is_ready: false,
            avatar_url: null,
          },
        ],
      }),
    });

    render(<CreateGamePage />);

    await waitFor(() => {
      expect(screen.getByText("Not Ready")).toBeInTheDocument();
    });

    // Non-host player should see the "Ready" action button
    const readyButton = screen.getByRole("button", { name: "Ready" });
    expect(readyButton).toBeInTheDocument();

    // Start Game (host-only) button should not be present
    expect(screen.queryByRole("button", { name: "Start Game" })).not.toBeInTheDocument();
  });

  test("renders controls for host player", async () => {
    // Current user is "hostplayer" (host)
    mockUrlParams = new URLSearchParams({
      code: "ABCD",
      gameId: "123",
      username: "hostplayer",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        players: [
          {
            id: "p1",
            username: "hostplayer",
            is_host: true,
            is_ready: true,
            avatar_url: null,
          },
        ],
      }),
    });

    render(<CreateGamePage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
    });

    // Non-host buttons ("Ready" / "Unready" action buttons) should not be present
    expect(screen.queryByRole("button", { name: "Ready" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unready" })).not.toBeInTheDocument();
  });
});

describe("User Interactions and Navigation", () => {
    test("Leave Game: calls DELETE API and navigates to home when currentPlayerId exists", async () => {
        mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            players: [
            {
                id: "p1",
                username: "testuser",
                is_host: false,
                is_ready: false,
                avatar_url: null,
            },
            ],
        }),
        });

        render(<CreateGamePage />);

        await waitFor(() => {
        expect(screen.getByText("testuser")).toBeInTheDocument();
        });

        mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        });

        const backButton = screen.getByRole("button", { name: /Back to Home/i });
        fireEvent.click(backButton);

        await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
            "/api/games/123/players",
            expect.objectContaining({
            method: "DELETE",
            body: JSON.stringify({ playerId: "p1" }),
            })
        );
        });

        expect(mockPush).toHaveBeenCalledWith("/");
    });

    test("Leave Game: skips DELETE API and only navigates to home when currentPlayerId does not exist", async () => {
        mockUrlParams = new URLSearchParams({
        code: "ABCD",
        gameId: "123",
        username: "unknownuser",
        });

        mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            players: [
            {
                id: "p1",
                username: "otheruser",
                is_host: true,
                is_ready: false,
                avatar_url: null,
            },
            ],
        }),
        });

        render(<CreateGamePage />);

        await waitFor(() => {
        expect(screen.getByText("otheruser")).toBeInTheDocument();
        });

        mockFetch.mockClear();

        const backButton = screen.getByRole("button", { name: /Back to Home/i });
        fireEvent.click(backButton);

        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/");
    });

    test("Toggle Ready: handles optimistic update and successful PATCH request", async () => {
        mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            players: [
            {
                id: "p1",
                username: "testuser",
                is_host: false,
                is_ready: false,
                avatar_url: null,
            },
            ],
        }),
        });

        render(<CreateGamePage />);

        await waitFor(() => {
        expect(screen.getByRole("button", { name: "Ready" })).toBeInTheDocument();
        });

        let resolvePatch: (value: Response) => void = () => {};
        const patchPromise = new Promise<Response>((resolve) => {
        resolvePatch = resolve;
        });
        mockFetch.mockReturnValueOnce(patchPromise);

        const readyButton = screen.getByRole("button", { name: "Ready" });
        fireEvent.click(readyButton);

        expect(screen.getByRole("button", { name: "Updating..." })).toBeInTheDocument();
        const listReadyBadge = screen.getByText("Ready", { selector: "span" });
        expect(listReadyBadge).toBeInTheDocument();

        resolvePatch({
        ok: true,
        json: async () => ({ success: true }),
        } as Response);

        await waitFor(() => {
        expect(screen.getByRole("button", { name: "Unready" })).toBeInTheDocument();
        });

        expect(mockFetch).toHaveBeenLastCalledWith(
        "/api/games/123/players",
        expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({ playerId: "p1", isReady: true }),
        })
        );
    });

    test("Toggle Ready: switches status badge from 'Not Ready' to 'Ready' and back to 'Not Ready' on button clicks", async () => {
        mockUrlParams = new URLSearchParams({
            code: "ABCD",
            gameId: "123",
            username: "testuser",
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                players: [
                    {
                        id: "p1",
                        username: "testuser",
                        is_host: false,
                        is_ready: false,
                        avatar_url: null,
                    },
                ],
            }),
        });

        render(<CreateGamePage />);

        await waitFor(() => {
            expect(screen.getByText("Not Ready")).toBeInTheDocument();
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        const readyButton = screen.getByRole("button", { name: "Ready" });
        fireEvent.click(readyButton);

        await waitFor(() => {
            expect(screen.getByText("Ready")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Unready" })).toBeInTheDocument();
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        const unreadyButton = screen.getByRole("button", { name: "Unready" });
        fireEvent.click(unreadyButton);

        await waitFor(() => {
            expect(screen.getByText("Not Ready")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Ready" })).toBeInTheDocument();
        });
    });

    test("Host Controls: Start Game button is disabled when not all players are ready", async () => {
        mockUrlParams = new URLSearchParams({
        code: "ABCD",
        gameId: "123",
        username: "hostplayer",
        });

        mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            players: [
            {
                id: "p1",
                username: "hostplayer",
                is_host: true,
                is_ready: true,
                avatar_url: null,
            },
            {
                id: "p2",
                username: "otherplayer",
                is_host: false,
                is_ready: false,
                avatar_url: null,
            },
            ],
        }),
        });

        render(<CreateGamePage />);

        await waitFor(() => {
        expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
        });

        const startButton = screen.getByRole("button", { name: "Start Game" });
        expect(startButton).toBeDisabled();
    });

    test("Host Controls: Start Game button is enabled when all players are ready, broadcasts event, and navigates on click", async () => {
        mockUrlParams = new URLSearchParams({
        code: "ABCD",
        gameId: "123",
        username: "hostplayer",
        });

        mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            players: [
            {
                id: "p1",
                username: "hostplayer",
                is_host: true,
                is_ready: true,
                avatar_url: null,
            },
            {
                id: "p2",
                username: "otherplayer",
                is_host: false,
                is_ready: true,
                avatar_url: null,
            },
            ],
        }),
        });

        render(<CreateGamePage />);

        await waitFor(() => {
        expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
        });

        const startButton = screen.getByRole("button", { name: "Start Game" });
        expect(startButton).toBeEnabled();

        fireEvent.click(startButton);

        expect(mockChannel.send).toHaveBeenCalledWith({
        type: "broadcast",
        event: "start_game",
        payload: {},
        });

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/game?code=ABCD&gameId=123&username=hostplayer");
        });
    });
});

describe("Supabase Real-time Interactions", () => {
    test("Postgres Changes: INSERT and UPDATE trigger player list refresh", async () => {
      // Mock initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          players: [
            {
              id: "p1",
              username: "testuser",
              is_host: true,
              is_ready: true,
              avatar_url: null,
            },
          ],
        }),
      });

      render(<CreateGamePage />);

      await waitFor(() => {
        expect(screen.getByText("testuser")).toBeInTheDocument();
      });

      // Clear calls so we can trace subsequent fetches
      mockFetch.mockClear();

      // Mock subsequent fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          players: [
            {
              id: "p1",
              username: "testuser",
              is_host: true,
              is_ready: true,
              avatar_url: null,
            },
            {
              id: "p2",
              username: "newplayer",
              is_host: false,
              is_ready: false,
              avatar_url: null,
            },
          ],
        }),
      });

      // Find the postgres changes INSERT listener
      const listeners = channelListeners.get("realtime:players");
      const insertListener = listeners?.find(
        (l) => l.event === "postgres_changes" && l.filter?.event === "INSERT"
      );
      expect(insertListener).toBeDefined();

      // Trigger the insert callback
      insertListener!.callback();

      await waitFor(() => {
        expect(screen.getByText("newplayer")).toBeInTheDocument();
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Now trigger UPDATE listener
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ players: [] }),
      });

      const updateListener = listeners?.find(
        (l) => l.event === "postgres_changes" && l.filter?.event === "UPDATE"
      );
      expect(updateListener).toBeDefined();
      updateListener!.callback();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    test("Postgres Changes: DELETE filters out the deleted player from state", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          players: [
            {
              id: "p1",
              username: "testuser",
              is_host: true,
              is_ready: true,
              avatar_url: null,
            },
            {
              id: "p2",
              username: "deletedplayer",
              is_host: false,
              is_ready: false,
              avatar_url: null,
            },
          ],
        }),
      });

      render(<CreateGamePage />);

      await waitFor(() => {
        expect(screen.getByText("deletedplayer")).toBeInTheDocument();
      });

      const listeners = channelListeners.get("realtime:players");
      const deleteListener = listeners?.find(
        (l) => l.event === "postgres_changes" && l.filter?.event === "DELETE"
      );
      expect(deleteListener).toBeDefined();

      // Trigger delete callback with payload containing the old ID
      deleteListener!.callback({ old: { id: "p2" } });

      await waitFor(() => {
        expect(screen.queryByText("deletedplayer")).not.toBeInTheDocument();
      });
    });

    test("Broadcast Channel: start_game event navigates regular player to game page", async () => {
      mockUrlParams = new URLSearchParams({
        code: "ABCD",
        gameId: "123",
        username: "testuser",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          players: [
            {
              id: "p1",
              username: "testuser",
              is_host: false,
              is_ready: true,
              avatar_url: null,
            },
          ],
        }),
      });

      render(<CreateGamePage />);

      await waitFor(() => {
        expect(screen.getByText("testuser")).toBeInTheDocument();
      });

      const listeners = channelListeners.get("game-broadcast-123");
      const broadcastListener = listeners?.find(
        (l) => l.event === "broadcast" && l.filter?.event === "start_game"
      );
      expect(broadcastListener).toBeDefined();

      // Trigger start_game event
      broadcastListener!.callback();

      expect(mockPush).toHaveBeenCalledWith("/game?code=ABCD&gameId=123&username=testuser");
    });

    test("Presence Channel: leaves and cleanup by host after 5 seconds grace period", async () => {
      // Host is testuser (p1)
      mockUrlParams = new URLSearchParams({
        code: "ABCD",
        gameId: "123",
        username: "testuser",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          players: [
            {
              id: "p1",
              username: "testuser",
              is_host: true,
              is_ready: true,
              avatar_url: null,
            },
            {
              id: "p2",
              username: "otherplayer",
              is_host: false,
              is_ready: true,
              avatar_url: null,
            },
          ],
        }),
      });

      // Mock presenceState to NOT have p2 (simulating that otherplayer is offline)
      const mockPresenceState = vi.fn().mockReturnValue({
        p1: [{ online: true }],
      });
      mockChannel.presenceState = mockPresenceState;

      render(<CreateGamePage />);

      await waitFor(() => {
        expect(screen.getByText("otherplayer")).toBeInTheDocument();
      });

      // Setup fake timers to mock the 5 seconds grace period setTimeout
      vi.useFakeTimers();

      const listeners = channelListeners.get("presence-123");
      const leaveListener = listeners?.find(
        (l) => l.event === "presence" && l.filter?.event === "leave"
      );
      expect(leaveListener).toBeDefined();

      // Trigger presence leave event for p2
      leaveListener!.callback({ key: "p2" });

      // Before 5 seconds, nothing should have been deleted
      expect(mockFetch).not.toHaveBeenCalledWith(
        "/api/games/123/players",
        expect.objectContaining({ method: "DELETE" })
      );

      // Advance timers by 5 seconds
      vi.advanceTimersByTime(5000);

      // Restore real timers so that waitFor does not get stuck faking intervals
      vi.useRealTimers();

      // Verify cleanup API is called by host
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/games/123/players",
          expect.objectContaining({
            method: "DELETE",
            body: JSON.stringify({ playerId: "p2" }),
          })
        );
      });
    });

    test("Presence Channel: does not clean up if player reconnects within 5 seconds", async () => {
      // Host is testuser (p1)
      mockUrlParams = new URLSearchParams({
        code: "ABCD",
        gameId: "123",
        username: "testuser",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          players: [
            {
              id: "p1",
              username: "testuser",
              is_host: true,
              is_ready: true,
              avatar_url: null,
            },
            {
              id: "p2",
              username: "otherplayer",
              is_host: false,
              is_ready: true,
              avatar_url: null,
            },
          ],
        }),
      });

      // Mock presenceState to have p2 (simulating p2 reconnected)
      const mockPresenceState = vi.fn().mockReturnValue({
        p1: [{ online: true }],
        p2: [{ online: true }],
      });
      mockChannel.presenceState = mockPresenceState;

      render(<CreateGamePage />);

      await waitFor(() => {
        expect(screen.getByText("otherplayer")).toBeInTheDocument();
      });
    
      // Setup fake timers to mock the 5 seconds grace period setTimeout
      vi.useFakeTimers();

      const listeners = channelListeners.get("presence-123");
      const leaveListener = listeners?.find(
        (l) => l.event === "presence" && l.filter?.event === "leave"
      );
      expect(leaveListener).toBeDefined();

      // Clear fetch calls from initial load
      mockFetch.mockClear();

      // Trigger presence leave event for p2
      leaveListener!.callback({ key: "p2" });

      // Advance timers by 5 seconds
      vi.advanceTimersByTime(5000);

      // Verify DELETE API was NOT called because p2 is back online in presenceState
      expect(mockFetch).not.toHaveBeenCalledWith(
        "/api/games/123/players",
        expect.objectContaining({ method: "DELETE" })
      );
    
      // Restore real timers
      vi.useRealTimers();
    });

    test("Presence Channel: does not clean up if current user is not host", async () => {
      // Current user is otherplayer (p2)
      mockUrlParams = new URLSearchParams({
        code: "ABCD",
        gameId: "123",
        username: "otherplayer",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          players: [
            {
              id: "p1",
              username: "testuser",
              is_host: true,
              is_ready: true,
              avatar_url: null,
            },
            {
              id: "p2",
              username: "otherplayer",
              is_host: false,
              is_ready: true,
              avatar_url: null,
            },
          ],
        }),
      });

      // Mock presenceState to NOT have p1 (host offline)
      const mockPresenceState = vi.fn().mockReturnValue({
        p2: [{ online: true }],
      });
      mockChannel.presenceState = mockPresenceState;

      render(<CreateGamePage />);

      await waitFor(() => {
        expect(screen.getByText("otherplayer")).toBeInTheDocument();
      });
      // Setup fake timers to mock the 5 seconds grace period setTimeout
      vi.useFakeTimers();
    
      const listeners = channelListeners.get("presence-123");
      const leaveListener = listeners?.find(
        (l) => l.event === "presence" && l.filter?.event === "leave"
      );
      expect(leaveListener).toBeDefined();
    
      // Clear fetch calls from initial load
      mockFetch.mockClear();
    
      // Trigger presence leave event for p1
      leaveListener!.callback({ key: "p1" });
    
      // Advance timers by 5 seconds
      vi.advanceTimersByTime(5000);
    
      // Verify DELETE API was NOT called because p2 is not host
      expect(mockFetch).not.toHaveBeenCalledWith(
        "/api/games/123/players",
        expect.objectContaining({ method: "DELETE" })
      );
    
      // Restore real timers
      vi.useRealTimers();
    });
  });
