import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Flex, Form, Input, Button, Typography, message, Spin } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { getLoginConfig } from "@/api/auth";
import { APP } from "@/config";

interface LoginFormValues {
  username: string;
  password: string;
}

/** LOCAL (password) login form with demo-credential prefill + hint. */
function LocalLoginForm({
  form,
  onFinish,
  loading,
}: {
  form: ReturnType<typeof Form.useForm<LoginFormValues>>[0];
  onFinish: (values: LoginFormValues) => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Form<LoginFormValues>
      form={form}
      onFinish={onFinish}
      autoComplete="off"
      size="large"
      initialValues={{ username: "admin", password: "123456" }}
    >
      <Form.Item name="username" rules={[{ required: true, message: t("login.usernameRequired") }]}>
        <Input prefix={<UserOutlined />} placeholder={t("login.username")} data-testid="username-input" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: t("login.passwordRequired") }]}>
        <Input.Password prefix={<LockOutlined />} placeholder={t("login.password")} data-testid="password-input" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block data-testid="login-button">
          {t("login.loginButton")}
        </Button>
      </Form.Item>
      <Typography.Text type="secondary" style={{ display: "block", textAlign: "center", fontSize: 12 }}>
        {t("login.demoHint")}
      </Typography.Text>
    </Form>
  );
}

/** SSO (CAS/OIDC) redirect panel. */
function SsoLoginPanel({ ssoLoginUrl }: { ssoLoginUrl: string }) {
  const { t } = useTranslation();
  return (
    <Flex vertical gap={16} align="center" style={{ padding: "24px 0" }}>
      <Typography.Text type="secondary">{t("login.ssoRedirectHint")}</Typography.Text>
      <Button type="primary" size="large" block href={ssoLoginUrl || undefined} data-testid="sso-login-button">
        {t("login.ssoLogin")}
      </Button>
    </Flex>
  );
}

export default function Login() {
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [authType, setAuthType] = useState("LOCAL");
  const [ssoLoginUrl, setSsoLoginUrl] = useState("");
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    getLoginConfig()
      .then((config) => {
        if (!mounted) return;
        setAuthType(config.authType);
        setSsoLoginUrl(config.ssoLoginUrl ?? "");
      })
      .catch(() => {
        // Endpoint unreachable — fall back to the LOCAL password form.
      })
      .finally(() => {
        if (mounted) setConfigLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success(t("login.loginSuccess"));
      await navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t("login.loginFailed");
      message.error(errorMessage);
      form.setFieldsValue({ password: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex justify="center" align="center" style={{ minHeight: "100vh" }}>
      <Card style={{ width: 400 }}>
        <Typography.Title level={3} style={{ textAlign: "center" }}>
          {t("login.title", { appName: APP.name })}
        </Typography.Title>
        {configLoading ? (
          <Flex justify="center" style={{ padding: 24 }}>
            <Spin data-testid="login-config-loading" />
          </Flex>
        ) : authType === "LOCAL" ? (
          <LocalLoginForm form={form} onFinish={handleSubmit} loading={loading} />
        ) : (
          <SsoLoginPanel ssoLoginUrl={ssoLoginUrl} />
        )}
      </Card>
    </Flex>
  );
}
