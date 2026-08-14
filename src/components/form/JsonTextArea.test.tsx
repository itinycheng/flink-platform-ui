import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import JsonTextArea from "./JsonTextArea";

describe("JsonTextArea", () => {
  it("parses valid JSON on blur and emits the object", () => {
    const onChange = vi.fn();
    render(<JsonTextArea value={{}} onChange={onChange} />);
    const ta = screen.getByRole("textbox");
    fireEvent.change(ta, { target: { value: '{"k":"v"}' } });
    fireEvent.blur(ta);
    expect(onChange).toHaveBeenLastCalledWith({ k: "v" });
  });

  it("shows an error and does not emit on invalid JSON", () => {
    const onChange = vi.fn();
    render(<JsonTextArea value={{}} onChange={onChange} />);
    const ta = screen.getByRole("textbox");
    fireEvent.change(ta, { target: { value: "{bad}" } });
    fireEvent.blur(ta);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/JSON/i)).toBeInTheDocument();
  });
});
