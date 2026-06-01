import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import JoinGamePage from "./page";

// Mock router and search params
const mockPush = vi.fn();
let mockUrlParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockUrlParams,
}));

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockPush.mockClear();
  vi.clearAllMocks();
  mockUrlParams = new URLSearchParams();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("JoinGamePage", () => {
  test("renders all UI elements and initial states", () => {
    render(<JoinGamePage />);

    expect(screen.getByRole("heading", { name: "Join a Game" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Game Code")).toBeInTheDocument();
    
    const joinButton = screen.getByRole("button", { name: "Join" });
    expect(joinButton).toBeInTheDocument();
    expect(joinButton).toBeDisabled();

    const backLink = screen.getByRole("link", { name: /Back to Home/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  test("pre-populates username if provided in search parameters", () => {
    mockUrlParams = new URLSearchParams({ username: "Alice" });
    
    render(<JoinGamePage />);

    const usernameInput = screen.getByPlaceholderText("Enter Username") as HTMLInputElement;
    expect(usernameInput.value).toBe("Alice");

    const joinButton = screen.getByRole("button", { name: "Join" });
    expect(joinButton).toBeDisabled(); // still disabled because roomCode is empty
  });

  test("enables join button only when both username and game code are filled", () => {
    render(<JoinGamePage />);

    const usernameInput = screen.getByPlaceholderText("Enter Username");
    const codeInput = screen.getByPlaceholderText("Enter Game Code");
    const joinButton = screen.getByRole("button", { name: "Join" });

    // Enter username only
    fireEvent.change(usernameInput, { target: { value: "Alice" } });
    expect(joinButton).toBeDisabled();

    // Enter room code only (clear username first)
    fireEvent.change(usernameInput, { target: { value: "" } });
    fireEvent.change(codeInput, { target: { value: "ABCD" } });
    expect(joinButton).toBeDisabled();

    // Enter both
    fireEvent.change(usernameInput, { target: { value: "Alice" } });
    expect(joinButton).toBeEnabled();
  });

  test("successfully joins game and redirects to /create", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ inviteCode: "XYZW", gameId: "987" }),
    });

    render(<JoinGamePage />);

    const usernameInput = screen.getByPlaceholderText("Enter Username");
    const codeInput = screen.getByPlaceholderText("Enter Game Code");
    const joinButton = screen.getByRole("button", { name: "Join" });

    fireEvent.change(usernameInput, { target: { value: "  Alice  " } });
    // test case-insensitivity and trimming for room code
    fireEvent.change(codeInput, { target: { value: "  xyzw  " } });
    
    expect(joinButton).toBeEnabled();
    fireEvent.click(joinButton);

    // Verify loading state
    expect(screen.getByRole("button", { name: "Joining..." })).toBeInTheDocument();
    expect(joinButton).toBeDisabled();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/games/XYZW/players",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: "Alice" }),
        })
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/create?code=XYZW&gameId=987&username=Alice");
    });
  });

  test("displays API error when joining fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Room code not found" }),
    });

    render(<JoinGamePage />);

    const usernameInput = screen.getByPlaceholderText("Enter Username");
    const codeInput = screen.getByPlaceholderText("Enter Game Code");
    const joinButton = screen.getByRole("button", { name: "Join" });

    fireEvent.change(usernameInput, { target: { value: "Alice" } });
    fireEvent.change(codeInput, { target: { value: "XYZW" } });
    
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText("Room code not found")).toBeInTheDocument();
    });

    // Verify error state allows resubmission
    expect(joinButton).toBeEnabled();
    expect(screen.getByRole("button", { name: "Join" })).toBeInTheDocument();
  });

  test("displays generic error message when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network connection lost"));

    render(<JoinGamePage />);

    const usernameInput = screen.getByPlaceholderText("Enter Username");
    const codeInput = screen.getByPlaceholderText("Enter Game Code");
    const joinButton = screen.getByRole("button", { name: "Join" });

    fireEvent.change(usernameInput, { target: { value: "Alice" } });
    fireEvent.change(codeInput, { target: { value: "XYZW" } });
    
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText("Network connection lost")).toBeInTheDocument();
    });
  });
});
