import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "antd";
import DynamicListEditor from "./DynamicListEditor";

describe("DynamicListEditor", () => {
  it("adds an item using the newItem factory", () => {
    const onChange = vi.fn();
    render(
      <DynamicListEditor<{ name: string }>
        value={[]}
        onChange={onChange}
        newItem={() => ({ name: "" })}
        renderItem={(item, onItemChange) => (
          <Input value={item.name} onChange={(e) => onItemChange({ name: e.target.value })} />
        )}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(onChange).toHaveBeenLastCalledWith([{ name: "" }]);
  });

  it("removes an item by index", () => {
    const onChange = vi.fn();
    render(
      <DynamicListEditor<{ name: string }>
        value={[{ name: "a" }, { name: "b" }]}
        onChange={onChange}
        newItem={() => ({ name: "" })}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    expect(onChange).toHaveBeenLastCalledWith([{ name: "b" }]);
  });
});
