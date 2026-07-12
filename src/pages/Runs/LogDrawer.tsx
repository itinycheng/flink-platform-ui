import { useEffect, useState } from "react";
import { Drawer, Spin, Typography } from "antd";
import { useTranslation } from "react-i18next";
import type { RunLog } from "@/types/run";

interface LogDrawerProps {
  open: boolean;
  title: string;
  /** Loader for the log of the currently selected run; null when nothing selected. */
  loader: (() => Promise<RunLog>) | null;
  onClose: () => void;
}

export default function LogDrawer({ open, title, loader, onClose }: LogDrawerProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open || !loader) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setContent("");
      try {
        const log = await loader();
        if (!cancelled) setContent(log.content);
      } catch {
        if (!cancelled) setContent(t("runs.logLoadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, loader, t]);

  return (
    <Drawer title={title} placement="right" size="large" open={open} onClose={onClose} data-testid="log-drawer">
      {loading ? (
        <div style={{ textAlign: "center", paddingTop: 80 }}>
          <Spin />
        </div>
      ) : (
        <Typography.Paragraph>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              background: "var(--ant-color-fill-quaternary)",
              padding: 12,
              borderRadius: 6,
              fontSize: 12,
              margin: 0,
            }}
          >
            {content}
          </pre>
        </Typography.Paragraph>
      )}
    </Drawer>
  );
}
