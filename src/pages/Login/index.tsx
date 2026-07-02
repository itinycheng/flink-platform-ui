import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Flex, Form, Input, Button, Typography, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";

interface LoginFormValues {
  username: string;
  password: string;
}

export default function Login() {
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { t } = useTranslation();

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
          {t("login.title", { appName: __APP_NAME__ })}
        </Typography.Title>
        <Form<LoginFormValues> form={form} onFinish={handleSubmit} autoComplete="off" size="large">
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
        </Form>
      </Card>
    </Flex>
  );
}
