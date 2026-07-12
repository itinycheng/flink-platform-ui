import type { ThemeConfig } from "antd";

/**
 * Reusable theme configs to scope with `<ConfigProvider theme={...}>` where needed.
 * Add more variants here as they come up (e.g. a denser menu, wider dropdown, etc.).
 */

/** Compact popup menu rows — for dropdown / context menus (keeps nav/sidebar menus at default).
 * `cssVar` must match the root ConfigProvider (App.tsx) — without it this nested theme
 * switches to hash mode and the menu-item hover background var stops resolving. */
export const compactMenuTheme: ThemeConfig = {
  cssVar: { prefix: "ant" },
  components: { Menu: { itemHeight: 30, itemMarginBlock: 2 } },
};
