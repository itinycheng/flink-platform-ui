import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DurationInput from "./DurationInput";
import { isValidDuration } from "./validators";

describe("isValidDuration", () => {
  it("accepts single and multi-segment durations", () => {
    expect(isValidDuration("5s")).toBe(true);
    expect(isValidDuration("1m")).toBe(true);
    expect(isValidDuration("2h30m")).toBe(true);
    expect(isValidDuration("1d")).toBe(true);
  });
  it("rejects malformed values", () => {
    expect(isValidDuration("")).toBe(false);
    expect(isValidDuration("5")).toBe(false);
    expect(isValidDuration("5x")).toBe(false);
    expect(isValidDuration("abc")).toBe(false);
  });
});

describe("DurationInput", () => {
  it("emits the raw string on change", () => {
    const onChange = vi.fn();
    render(<DurationInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "10s" } });
    expect(onChange).toHaveBeenLastCalledWith("10s");
  });
});
