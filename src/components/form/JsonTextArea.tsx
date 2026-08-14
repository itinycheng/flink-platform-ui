import { useEffect, useState } from "react";
import { Input, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface Props {
  value?: Record<string, unknown>;
  onChange?: (v: Record<string, unknown>) => void;
  rows?: number;
}

export default function JsonTextArea({ value, onChange, rows = 4 }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [error, setError] = useState<string | null>(null);

  // Re-sync text when the external value identity changes (e.g. form reset).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(JSON.stringify(value ?? {}, null, 2));
    setError(null);
  }, [value]);

  const handleBlur = () => {
    try {
      const parsed = JSON.parse(text || "{}") as Record<string, unknown>;
      setError(null);
      onChange?.(parsed);
    } catch {
      setError(t("common.invalidJson"));
    }
  };

  return (
    <>
      <Input.TextArea rows={rows} value={text} onChange={(e) => setText(e.target.value)} onBlur={handleBlur} />
      {error ? (
        <Typography.Text type="danger" style={{ fontSize: 12 }}>
          {error}
        </Typography.Text>
      ) : null}
    </>
  );
}
