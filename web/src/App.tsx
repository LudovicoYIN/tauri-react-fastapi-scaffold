import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Form,
  Space,
  Spin,
  message,
  Select,
  Card,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  SettingOutlined,
  ReloadOutlined,
  CopyOutlined,
  LikeOutlined,
  DislikeOutlined,
} from '@ant-design/icons';
import {
  Bubble,
  Sender,
} from '@ant-design/x';
import { createStyles } from 'antd-style';
import './App.css';

const { Title, Text } = Typography;
const { Option } = Select;

type BubbleDataType = {
  role: string;
  content: string;
};

// API基础URL
const API_BASE_URL = "http://127.0.0.1:8000";

const useStyle = createStyles(({ token, css }) => {
  return {
    layout: css`
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: ${token.colorBgContainer};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `,
    header: css`
      background: ${token.colorBgContainer};
      border-bottom: 1px solid ${token.colorBorderSecondary};
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `,
    configSection: css`
      background: ${token.colorBgLayout};
      padding: 16px 24px;
      border-bottom: 1px solid ${token.colorBorderSecondary};
    `,
    chatContainer: css`
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 16px 24px;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    `,
    chatList: css`
      flex: 1;
      overflow: auto;
      margin-bottom: 16px;
    `,
    loadingMessage: css`
      background-image: linear-gradient(90deg, #ff6b23 0%, #af3cb8 31%, #53b6ff 89%);
      background-size: 100% 2px;
      background-repeat: no-repeat;
      background-position: bottom;
    `,
    welcome: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      color: ${token.colorTextSecondary};
    `,
    configForm: css`
      .ant-form-item {
        margin-bottom: 12px;
      }
    `,
  };
});

interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const App: React.FC = () => {
  const { styles } = useStyle();
  
  // 配置状态
  const [openAIConfig, setOpenAIConfig] = useState<OpenAIConfig>({
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
  });
  const [configVisible, setConfigVisible] = useState(true);
  const [form] = Form.useForm();

  // 聊天状态
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  // 发送请求到OpenAI
  const sendMessage = async (content: string) => {
    if (!openAIConfig.apiKey) {
      message.error('请先配置 API Key');
      setConfigVisible(true);
      return;
    }

    if (loading) {
      message.error('正在处理请求，请等待完成');
      return;
    }

    setLoading(true);
    
    // 添加用户消息
    const newUserMessage = { role: 'user', content: content };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);

    // 添加助手占位消息
    const assistantMessage = { role: 'assistant', content: '', loading: true };
    setMessages([...newMessages, assistantMessage]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/openai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          })),
          api_key: openAIConfig.apiKey,
          base_url: openAIConfig.baseUrl,
          model: openAIConfig.model,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let assistantContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setLoading(false);
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                  loading: false
                };
                return updated;
              });
              return;
            }

            try {
              const parsedData = JSON.parse(data);
              if (parsedData.content) {
                assistantContent += parsedData.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: assistantContent,
                    loading: true
                  };
                  return updated;
                });
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      setLoading(false);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '请求失败，请重试！',
          loading: false
        };
        return updated;
      });
    }
  };

  // 检查后端连接
  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setIsConnected(true);
        return true;
      }
    } catch (error) {
      console.log("后端服务未启动:", error);
    }
    setIsConnected(false);
    return false;
  };

  // 保存OpenAI配置
  const saveConfig = async (values: OpenAIConfig) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/openai/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: values.apiKey,
          base_url: values.baseUrl,
        }),
      });

      if (response.ok) {
        setOpenAIConfig(values);
        setConfigVisible(false);
        message.success('配置保存成功！');
      } else {
        message.error('配置保存失败');
      }
    } catch (error) {
      message.error('无法连接到后端服务');
    }
  };

  // 提交消息
  const onSubmit = (val: string) => {
    if (!val) return;
    sendMessage(val);
  };

  // 清空对话
  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    checkBackendConnection();
    form.setFieldsValue(openAIConfig);
  }, []);

  return (
    <div className={styles.layout}>
      {/* 头部 */}
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            width: 24, 
            height: 24, 
            background: 'linear-gradient(45deg, #1677ff, #722ed1)', 
            borderRadius: 6 
          }} />
          <Title level={4} style={{ margin: 0 }}>OpenAI 聊天助手</Title>
        </div>
        <Space>
          <Text type={isConnected ? 'success' : 'danger'}>
            {isConnected ? '✅ 后端已连接' : '❌ 后端未连接'}
          </Text>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setConfigVisible(!configVisible)}
          >
            配置
          </Button>
          <Button onClick={clearMessages}>清空对话</Button>
        </Space>
      </div>

      {/* 配置区域 */}
      {configVisible && (
        <div className={styles.configSection}>
          <Card size="small" title="OpenAI 配置">
            <Form
              form={form}
              layout="inline"
              onFinish={saveConfig}
              initialValues={openAIConfig}
              className={styles.configForm}
            >
              <Row gutter={16} style={{ width: '100%' }}>
                <Col span={8}>
                  <Form.Item
                    name="apiKey"
                    label="API Key"
                    rules={[{ required: true, message: '请输入 API Key' }]}
                  >
                    <Input.Password placeholder="sk-..." style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="baseUrl"
                    label="Base URL"
                    rules={[{ required: true, message: '请输入 Base URL' }]}
                  >
                    <Input placeholder="https://api.openai.com/v1" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item
                    name="model"
                    label="模型"
                    rules={[{ required: true, message: '请输入模型名' }]}
                  >
                    <Input placeholder="gpt-3.5-turbo" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit">
                        保存配置
                      </Button>
                      <Button onClick={() => setConfigVisible(false)}>
                        隐藏
                      </Button>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </div>
      )}

      {/* 聊天容器 */}
      <div className={styles.chatContainer}>
        {/* 聊天列表 */}
        <div className={styles.chatList}>
          {messages?.length ? (
            <Bubble.List
              items={messages?.map((msg) => ({
                role: msg.role,
                content: msg.content,
                classNames: {
                  content: msg.loading ? styles.loadingMessage : '',
                },
                typing: msg.loading ? { step: 5, interval: 20 } : false,
              }))}
              roles={{
                assistant: {
                  placement: 'start',
                  avatar: { 
                    src: null,
                    style: { background: '#1677ff' },
                    children: '🤖'
                  },
                  footer: (
                    <div style={{ display: 'flex' }}>
                      <Button type="text" size="small" icon={<ReloadOutlined />} />
                      <Button type="text" size="small" icon={<CopyOutlined />} />
                      <Button type="text" size="small" icon={<LikeOutlined />} />
                      <Button type="text" size="small" icon={<DislikeOutlined />} />
                    </div>
                  ),
                  loadingRender: () => <Spin size="small" />,
                },
                user: { 
                  placement: 'end',
                  avatar: { 
                    style: { background: '#87d068' },
                    children: '👤'
                  }
                },
              }}
            />
          ) : (
            <div className={styles.welcome}>
              <div style={{ 
                width: 64, 
                height: 64, 
                background: 'linear-gradient(45deg, #1677ff, #722ed1)', 
                borderRadius: 16, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                fontSize: 28,
                marginBottom: 16 
              }}>
                🤖
              </div>
              <Title level={3} style={{ color: '#666' }}>欢迎使用 OpenAI 聊天助手</Title>
              <Text type="secondary">配置您的 API Key 和模型，开始与 AI 进行智能对话</Text>
            </div>
          )}
        </div>

        {/* 发送器 */}
        <Sender
          value={inputValue}
          onSubmit={() => {
            onSubmit(inputValue);
            setInputValue('');
          }}
          onChange={setInputValue}
          loading={loading}
          placeholder="输入消息开始对话..."
        />
      </div>
    </div>
  );
};

export default App;
