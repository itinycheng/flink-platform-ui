import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import KeyValueEditor from "./KeyValueEditor";

describe("KeyValueEditor", () => {
  it("renders existing pairs as rows", () => {
    render(<KeyValueEditor value={{ a: "1", b: "2" }} />);
    expect(screen.getAllByPlaceholderText("Key")).toHaveLength(2);
  });

  it("adds a row and emits the updated map on edit", () => {
    const onChange = vi.fn();
    render(<KeyValueEditor value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    const keyInput = screen.getByPlaceholderText("Key");
    const valInput = screen.getByPlaceholderText("Value");
    fireEvent.change(keyInput, { target: { value: "host" } });
    fireEvent.change(valInput, { target: { value: "localhost" } });
    expect(onChange).toHaveBeenLastCalledWith({ host: "localhost" });
  });
});
