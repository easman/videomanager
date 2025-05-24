import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Modal, message, Switch, Badge, Tooltip, InputNumber, Row, Col, Alert, Input, Typography, Divider } from 'antd';
import { ExclamationCircleOutlined, CloudServerOutlined, UsbOutlined, LinkOutlined, QuestionCircleOutlined, SendOutlined, CodeOutlined } from '@ant-design/icons';
import { db } from '../../db';
import { exportDB, importDB } from 'dexie-export-import';

const { confirm } = Modal;
const { TextArea } = Input;
const { Text } = Typography;

const SettingsPage: React.FC = () => {
  const [devToolsEnabled, setDevToolsEnabled] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // USB 和 HTTP 服务相关状态
  const [iproxyInstalled, setIproxyInstalled] = useState(false);
  const [iproxyChecking, setIproxyChecking] = useState(false);
  const [isIPhoneConnected, setIsIPhoneConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [usbServiceRunning, setUsbServiceRunning] = useState(false);
  const [httpServerRunning, setHttpServerRunning] = useState(false);
  const [httpPort, setHttpPort] = useState(3001);       // HTTP 服务器端口 - 默认为 3001
  const [iproxyHostPort, setIproxyHostPort] = useState(3000);  // iproxy 主机端口 - 默认为 3000
  const [iproxyDevicePort, setIproxyDevicePort] = useState(3000);  // iproxy 设备端口 - 默认为 3000
  const [loading, setLoading] = useState({
    startUsb: false,
    stopUsb: false,
    startHttp: false,
    stopHttp: false,
    diagnose: false
  });
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  
  // 命令执行相关状态
  const [commandInput, setCommandInput] = useState('');
  const [commandResult, setCommandResult] = useState<any>(null);
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
  const [showAdvancedDebugging, setShowAdvancedDebugging] = useState(false);

  // 获取本机 IP 地址
  const [localIpAddresses, setLocalIpAddresses] = useState<string[]>([]);

  // 在组件加载时获取本机 IP 地址
  useEffect(() => {
    const getLocalIpAddresses = async () => {
      try {
        const result = await window.electronAPI.executeCommand('ifconfig | grep inet | grep -v 127.0.0.1 | grep -v inet6 | awk \'{print $2}\'');
        if (result.success && result.stdout) {
          const addresses = result.stdout.trim().split('\n').filter(Boolean);
          setLocalIpAddresses(addresses);
        }
      } catch (error) {
        console.error('获取 IP 地址失败:', error);
      }
    };

    getLocalIpAddresses();
  }, []);

  // 获取开发者工具状态
  useEffect(() => {
    const checkDevTools = async () => {
      const isEnabled = await window.electronAPI.isDevToolsEnabled();
      setDevToolsEnabled(isEnabled);
    };
    checkDevTools();
  }, []);

  // 检查 iproxy 安装状态和 iPhone 连接状态
  useEffect(() => {
    checkIproxyInstallation();
    checkIPhoneConnection();
    
    // 设置 iPhone 连接状态检查定时器
    const connectionTimer = setInterval(() => {
      checkIPhoneConnection();
    }, 5000);
    
    // 在组件卸载时清理定时器
    return () => {
      clearInterval(connectionTimer);
    };
  }, []);

  // 检查 iproxy 是否已安装
  const checkIproxyInstallation = async () => {
    try {
      setIproxyChecking(true);
      const result = await window.electronAPI.checkIproxyInstallation();
      setIproxyInstalled(result.isInstalled);
    } catch (error) {
      console.error('检查 iproxy 安装失败:', error);
      setIproxyInstalled(false);
    } finally {
      setIproxyChecking(false);
    }
  };

  // 检查 iPhone 连接状态
  const checkIPhoneConnection = async () => {
    try {
      setIsCheckingConnection(true);
      const result = await window.electronAPI.checkIPhoneConnection();
      setIsIPhoneConnected(result.isConnected);
    } catch (error) {
      console.error('检查 iPhone 连接失败:', error);
      setIsIPhoneConnected(false);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // 获取 USB 服务状态
  const getUsbServiceStatus = async () => {
    try {
      const result = await window.electronAPI.getUsbServiceStatus();
      if (result.success) {
        setUsbServiceRunning(result.status.iproxyRunning);
        setHttpServerRunning(result.status.serverRunning);
      }
    } catch (error) {
      console.error('获取 USB 服务状态失败:', error);
    }
  };

  // 在检查到 iPhone 连接状态变化时也获取最新服务状态
  useEffect(() => {
    getUsbServiceStatus();
  }, [isIPhoneConnected]);

  // 启动 USB 端口转发
  const startUsbForwarding = async () => {
    if (!iproxyInstalled) {
      message.error('请先安装 usbmuxd 工具：brew install usbmuxd');
      return;
    }
    
    if (!isIPhoneConnected) {
      message.warning('未检测到 iPhone 连接，请连接后再试');
      return;
    }
    
    // 检查 HTTP 服务器是否已启动
    if (!httpServerRunning) {
      message.warning('请先启动 HTTP 服务器');
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, startUsb: true }));
      
      // 配置 USB 端口转发
      await window.electronAPI.configureUsbForwarding({ 
        hostPort: iproxyHostPort,  // 必须与 HTTP 服务器监听的端口相同
        devicePort: iproxyDevicePort 
      });
      
      // 启动端口转发
      const result = await window.electronAPI.startUsbForwarding();
      if (result.success) {
        message.success('USB 端口转发已启动');
        setUsbServiceRunning(true);
        getUsbServiceStatus();
      } else {
        message.error(`启动失败: ${result.message}`);
      }
    } catch (error) {
      message.error('启动 USB 端口转发失败: ' + (error as Error).message);
    } finally {
      setLoading(prev => ({ ...prev, startUsb: false }));
    }
  };

  // 停止 USB 端口转发
  const stopUsbForwarding = async () => {
    try {
      setLoading(prev => ({ ...prev, stopUsb: true }));
      const result = await window.electronAPI.stopUsbForwarding();
      if (result.success) {
        message.success('USB 端口转发已停止');
        setUsbServiceRunning(false);
        getUsbServiceStatus();
      } else {
        message.error(`停止失败: ${result.message}`);
      }
    } catch (error) {
      message.error('停止 USB 端口转发失败: ' + (error as Error).message);
    } finally {
      setLoading(prev => ({ ...prev, stopUsb: false }));
    }
  };

  // 启动 HTTP 服务器
  const startHttpServer = async () => {
    try {
      setLoading(prev => ({ ...prev, startHttp: true }));
      
      // 配置服务器使用不同的端口
      await window.electronAPI.configureHttpServer({
        port: httpPort // 使用设置的主机端口
      });
      
      // 启动服务器
      const result = await window.electronAPI.startHttpServer();
      if (result.success) {
        message.success('HTTP 服务器已启动');
        setHttpServerRunning(true);
        getUsbServiceStatus();
      } else {
        message.error(`启动失败: ${result.message}`);
      }
    } catch (error) {
      message.error('启动 HTTP 服务器失败: ' + (error as Error).message);
    } finally {
      setLoading(prev => ({ ...prev, startHttp: false }));
    }
  };

  // 停止 HTTP 服务器
  const stopHttpServer = async () => {
    try {
      setLoading(prev => ({ ...prev, stopHttp: true }));
      const result = await window.electronAPI.stopHttpServer();
      if (result.success) {
        message.success('HTTP 服务器已停止');
        setHttpServerRunning(false);
        getUsbServiceStatus();
      } else {
        message.error(`停止失败: ${result.message}`);
      }
    } catch (error) {
      message.error('停止 HTTP 服务器失败: ' + (error as Error).message);
    } finally {
      setLoading(prev => ({ ...prev, stopHttp: false }));
    }
  };

  // 处理开发者工具开关
  const handleDevToolsToggle = async (checked: boolean) => {
    try {
      await window.electronAPI.toggleDevTools(checked);
      setDevToolsEnabled(checked);
      message.success(`已${checked ? '启用' : '禁用'}开发者工具`);
    } catch (error) {
      message.error('操作失败：' + (error as Error).message);
    }
  };

  const handleClearData = () => {
    confirm({
      title: '确认清空所有数据？',
      icon: <ExclamationCircleOutlined />,
      content: '此操作将清空所有服饰、视频素材、项目数据、身材记录以及图片文件，且不可恢复。',
      okText: '确认清空',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          // 清空数据库
          await Promise.all([
            db.skus.clear(),
            db.videoMaterials.clear(),
            db.projects.clear(),
            db.bodyRecords.clear(),
          ]);

          // 清理图片文件
          const imagesDir = await window.electronAPI.getAppImagesDir();
          const clearResult = await window.electronAPI.clearDirectory(imagesDir);
          
          if (!clearResult.success) {
            throw new Error(clearResult.message || '清理图片失败');
          }
          
          message.success('所有数据和图片已清空');
        } catch (error) {
          message.error('清空数据失败：' + (error as Error).message);
        }
      },
    });
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      // 导出数据库数据
      const blob = await exportDB(db);
      const exportData = await blob.text();
      
      // 发送到主进程进行保存
      const result = await window.electronAPI.exportData(exportData);
      
      if (result.success) {
        message.success('数据导出成功');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      message.error('导出数据失败：' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    try {
      setIsImporting(true);
      
      // 确认导入
      confirm({
        title: '确认导入数据？',
        icon: <ExclamationCircleOutlined />,
        content: '此操作将覆盖当前所有数据，请确保已备份重要数据。',
        okText: '确认导入',
        okType: 'danger',
        cancelText: '取消',
        async onOk() {
          try {
            // 从主进程获取导入数据
            const result = await window.electronAPI.importData();
            
            if (!result.success || !result.dbData) {
              throw new Error(result.message || '导入失败');
            }
            
            // 清空现有数据
            await Promise.all([
              db.skus.clear(),
              db.videoMaterials.clear(),
              db.projects.clear(),
              db.bodyRecords.clear(),
            ]);
            
            // 导入新数据
            const blob = new Blob([result.dbData], { type: 'application/json' });
            await importDB(blob);
            
            message.success('数据导入成功');
          } catch (error) {
            message.error('导入数据失败：' + (error as Error).message);
          }
        },
      });
    } catch (error) {
      message.error('导入数据失败：' + (error as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  // 运行诊断
  const runDiagnostics = async () => {
    try {
      setLoading(prev => ({ ...prev, diagnose: true }));
      setDiagnosticResults(null);
      
      const results = await window.electronAPI.diagnoseConnection();
      console.log('诊断结果:', results);
      setDiagnosticResults(results);
      
      // 根据诊断结果给出提示
      if (results.success) {
        message.success('诊断完成，服务正常运行');
      } else {
        const failedSteps = results.steps?.filter(step => !step.success) || [];
        if (failedSteps.length > 0) {
          message.error(`诊断发现问题: ${failedSteps[0].message}`);
        } else {
          message.error('诊断发现问题，但无法确定具体原因');
        }
      }
    } catch (error) {
      message.error('运行诊断失败: ' + (error as Error).message);
      console.error('诊断错误:', error);
    } finally {
      setLoading(prev => ({ ...prev, diagnose: false }));
    }
  };

  // 执行命令
  const executeCommand = async () => {
    if (!commandInput.trim()) {
      message.warning('请输入要执行的命令');
      return;
    }
    
    try {
      setIsExecutingCommand(true);
      setCommandResult(null);
      
      const result = await window.electronAPI.executeCommand(commandInput);
      setCommandResult(result);
      
      if (result.success) {
        message.success('命令执行成功');
      } else {
        message.error(`命令执行失败: ${result.error}`);
      }
    } catch (error) {
      setCommandResult({ success: false, error: (error as Error).message });
      message.error('执行命令失败: ' + (error as Error).message);
    } finally {
      setIsExecutingCommand(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>系统设置</h2>
      
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        {/* USB 视频上传服务 */}
        <Card 
          title={
            <Space>
              <UsbOutlined />
              <span>USB 视频上传服务</span>
              {isIPhoneConnected ? (
                <Badge status="success" text="iPhone 已连接" />
              ) : (
                <Badge status="error" text="iPhone 未连接" />
              )}
              <Tooltip title="通过 USB 连接将视频从 iPhone 传输到电脑">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          } 
          style={{ maxWidth: 800 }}
        >
          {!iproxyInstalled && (
            <Alert
              message="未安装 USB 工具"
              description={
                <div>
                  <p>请在终端中执行以下命令安装 usbmuxd 工具：</p>
                  <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                    brew install usbmuxd
                  </pre>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Alert
            message="使用说明"
            description={
              <div>
                <p><strong>操作步骤：</strong></p>
                <ol>
                  <li>确保 iPhone 通过 USB 数据线连接到 Mac</li>
                  <li>设置：
                    <ul>
                      <li>HTTP 端口：建议设置为 3001（不为 3000）</li>
                      <li>iproxy 主机端口：3000（与 HTTP 端口不能相同）</li>
                      <li>iproxy 设备端口：3000（iPhone 上访问的端口）</li>
                    </ul>
                  </li>
                  <li>先点击"启动 HTTP 服务器"按钮</li>
                  <li>再点击"启动 USB 端口转发"按钮</li>
                  <li>在 iPhone 上打开 Safari 浏览器，访问 <strong>http://127.0.0.1:{iproxyDevicePort}</strong></li>
                </ol>
                <p><strong>重要：</strong> HTTP 端口与 iproxy 主机端口必须不同，否则会出现端口冲突！</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={16} align="middle">
            <Col span={4}>HTTP 端口:</Col>
            <Col span={6}>
              <InputNumber 
                min={1024} 
                max={65535} 
                value={httpPort} 
                onChange={(value) => setHttpPort(value as number)} 
                disabled={httpServerRunning}
              />
            </Col>
            <Col span={14}>
              <Text type="secondary">HTTP 服务器监听端口，建议设置为 3001 避免冲突</Text>
            </Col>
          </Row>
          
          <Row gutter={16} align="middle" style={{ marginTop: 8 }}>
            <Col span={4}>iproxy 主机端口:</Col>
            <Col span={6}>
              <InputNumber 
                min={1024} 
                max={65535} 
                value={iproxyHostPort} 
                onChange={(value) => setIproxyHostPort(value as number)} 
                disabled={usbServiceRunning || httpServerRunning}
              />
            </Col>
            <Col span={4}>设备端口:</Col>
            <Col span={6}>
              <InputNumber 
                min={1024} 
                max={65535} 
                value={iproxyDevicePort} 
                onChange={(value) => setIproxyDevicePort(value as number)}
                disabled={usbServiceRunning}
              />
            </Col>
            <Col span={4}>
              <Text type="secondary">iproxy 端口转发设置</Text>
            </Col>
          </Row>
          
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button 
                type="primary" 
                icon={<LinkOutlined />} 
                onClick={startUsbForwarding} 
                loading={loading.startUsb}
                disabled={usbServiceRunning || !iproxyInstalled || !isIPhoneConnected}
              >
                启动 USB 端口转发
              </Button>
              
              <Button 
                danger 
                onClick={stopUsbForwarding} 
                loading={loading.stopUsb}
                disabled={!usbServiceRunning}
              >
                停止端口转发
              </Button>
            </Space>
          </div>
          
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button 
                type="primary" 
                icon={<CloudServerOutlined />} 
                onClick={startHttpServer} 
                loading={loading.startHttp}
                disabled={httpServerRunning}
              >
                启动 HTTP 服务器
              </Button>
              
              <Button 
                danger 
                onClick={stopHttpServer} 
                loading={loading.stopHttp}
                disabled={!httpServerRunning}
              >
                停止 HTTP 服务器
              </Button>
              
              <Button
                type="default"
                icon={<QuestionCircleOutlined />}
                onClick={runDiagnostics}
                loading={loading.diagnose}
              >
                诊断连接问题
              </Button>
            </Space>
          </div>
          
          {httpServerRunning && (
            <Alert
              message="HTTP 服务器已启动"
              description={
                <div>
                  <p>1. HTTP 服务器已在本地端口 {httpPort} 上启动</p>
                  <p>2. 现在请点击"启动 USB 端口转发"按钮，建立 iPhone 与 Mac 的连接</p>
                  <p>3. 连接建立后，在 iPhone 上打开 Safari 浏览器，访问以下地址：</p>
                  <p style={{ fontWeight: 'bold' }}>http://127.0.0.1:{iproxyDevicePort}</p>
                  <p>注意：必须先通过 USB 数据线连接 iPhone 到电脑</p>
                  
                  <Divider dashed />
                  
                  <p><strong>如果上述方法不工作，可以尝试直接通过 IP 地址访问：</strong></p>
                  <p>确保 iPhone 和 Mac 在同一 WiFi 网络，然后在 iPhone 上访问：</p>
                  {localIpAddresses.length > 0 ? (
                    <ul>
                      {localIpAddresses.map((ip, index) => (
                        <li key={index}>
                          <Text copyable strong>
                            http://{ip}:{httpPort}
                          </Text>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>正在获取 IP 地址...</p>
                  )}
                  <Button 
                    type="primary"
                    size="small"
                    onClick={() => {
                      if (localIpAddresses.length > 0) {
                        const testUrl = `http://${localIpAddresses[0]}:${httpPort}/status`;
                        window.electronAPI.executeCommand(`curl -s ${testUrl}`).then(result => {
                          if (result.success && result.stdout) {
                            message.success('成功连接到 HTTP 服务器！');
                          } else {
                            message.error('无法连接到 HTTP 服务器: ' + (result.stderr || result.error || '未知错误'));
                          }
                        });
                      }
                    }}
                  >
                    测试服务器连接
                  </Button>
                </div>
              }
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
          
          {usbServiceRunning && !httpServerRunning && (
            <Alert
              message="USB 端口转发已启动"
              description="请启动 HTTP 服务器以完成设置。"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
          
          {/* 诊断结果显示 */}
          {diagnosticResults && (
            <div style={{ marginTop: 16 }}>
              <Card title="诊断结果" size="small">
                {diagnosticResults.steps?.map((step: any, index: number) => (
                  <div key={index} style={{ marginBottom: 8 }}>
                    <Badge 
                      status={step.success ? 'success' : 'error'} 
                      text={
                        <span>
                          <strong>{step.name}</strong>: {step.success ? '正常' : step.message || '失败'}
                        </span>
                      }
                    />
                  </div>
                ))}
                
                {diagnosticResults.success ? (
                  <Alert
                    message="所有服务正常运行，但手机仍然无法访问"
                    description="可能的原因：
                    1. iPhone 上存在 HTTP 代理设置
                    2. iPhone 需要信任设备证书
                    3. 防火墙阻止了连接
                    4. 尝试重启 iPhone 或重新连接 USB"
                    type="warning"
                    showIcon
                  />
                ) : (
                  <Alert
                    message="检测到问题"
                    description="请根据上面的诊断结果修复问题后重试"
                    type="error"
                    showIcon
                  />
                )}
              </Card>
            </div>
          )}
        </Card>

        <Card title="数据管理" style={{ maxWidth: 800 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Button danger onClick={handleClearData}>
                清空所有数据
              </Button>
              <span style={{ marginLeft: 8, color: '#999' }}>
                清空所有服饰、视频素材、项目视频、身材记录数据以及图片文件
              </span>
            </div>
            
            <div>
              <Button onClick={handleExportData} loading={isExporting}>
                导出数据
              </Button>
              <span style={{ marginLeft: 8, color: '#999' }}>
                导出所有数据为备份文件
              </span>
            </div>
            
            <div>
              <Button onClick={handleImportData} loading={isImporting}>
                导入数据
              </Button>
              <span style={{ marginLeft: 8, color: '#999' }}>
                从备份文件导入数据
              </span>
            </div>
          </Space>
        </Card>

        <Card title="开发者选项" style={{ maxWidth: 800 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Switch
                checked={devToolsEnabled}
                onChange={handleDevToolsToggle}
              />
              <span style={{ marginLeft: 8 }}>
                开发者工具
                <span style={{ marginLeft: 8, color: '#999' }}>
                  启用后可以使用 Ctrl+Shift+I (Windows) 或 Cmd+Option+I (Mac) 打开开发者工具
                </span>
              </span>
            </div>
            
            <div style={{ marginTop: 16 }}>
              <Button 
                type="default" 
                icon={<CodeOutlined />}
                onClick={() => setShowAdvancedDebugging(!showAdvancedDebugging)}
              >
                {showAdvancedDebugging ? '隐藏高级调试' : '显示高级调试'}
              </Button>
            </div>
            
            {showAdvancedDebugging && (
              <div style={{ marginTop: 16 }}>
                <Card title="高级调试" size="small">
                  <div>
                    <TextArea
                      placeholder="输入要执行的系统命令，例如：ps aux | grep iproxy"
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      rows={3}
                      style={{ marginBottom: 16 }}
                    />
                    <div>
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={executeCommand}
                        loading={isExecutingCommand}
                      >
                        执行命令
                      </Button>
                      <Button
                        style={{ marginLeft: 8 }}
                        onClick={() => {
                          setCommandInput('');
                          setCommandResult(null);
                        }}
                      >
                        清除
                      </Button>
                    </div>
                  </div>
                  
                  {commandResult && (
                    <div style={{ marginTop: 16 }}>
                      <Alert
                        message={commandResult.success ? '命令执行成功' : '命令执行失败'}
                        type={commandResult.success ? 'success' : 'error'}
                        showIcon
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text strong>执行命令:</Text>
                        <pre style={{ 
                          background: '#f5f5f5', 
                          padding: '8px', 
                          borderRadius: '4px', 
                          overflowX: 'auto' 
                        }}>
                          {commandResult.command}
                        </pre>
                      </div>
                      {commandResult.stdout && (
                        <div style={{ marginTop: 8 }}>
                          <Text strong>标准输出:</Text>
                          <pre style={{ 
                            background: '#f5f5f5', 
                            padding: '8px', 
                            borderRadius: '4px', 
                            overflowX: 'auto',
                            maxHeight: '300px',
                            overflowY: 'auto'
                          }}>
                            {commandResult.stdout}
                          </pre>
                        </div>
                      )}
                      {commandResult.stderr && (
                        <div style={{ marginTop: 8 }}>
                          <Text strong>错误输出:</Text>
                          <pre style={{ 
                            background: '#f5f5f5', 
                            padding: '8px', 
                            borderRadius: '4px', 
                            overflowX: 'auto' 
                          }}>
                            {commandResult.stderr}
                          </pre>
                        </div>
                      )}
                      {commandResult.error && (
                        <div style={{ marginTop: 8 }}>
                          <Text strong>错误信息:</Text>
                          <pre style={{ 
                            background: '#f5f5f5', 
                            padding: '8px', 
                            borderRadius: '4px', 
                            overflowX: 'auto' 
                          }}>
                            {commandResult.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div style={{ marginTop: 16 }}>
                    <Alert
                      message="常用命令参考"
                      description={
                        <ul>
                          <li><code>ps aux | grep iproxy</code> - 查看 iproxy 进程</li>
                          <li><code>ps aux | grep usbmuxd</code> - 查看 usbmuxd 进程</li>
                          <li><code>idevice_id -l</code> - 列出已连接的 iOS 设备</li>
                          <li><code>lsof -i :{iproxyHostPort}</code> - 检查端口 {iproxyHostPort} 是否被监听</li>
                          <li><code>ifconfig | grep inet</code> - 查看网络接口信息</li>
                          <li><code>brew info usbmuxd</code> - 查看 usbmuxd 安装信息</li>
                        </ul>
                      }
                      type="info"
                    />
                  </div>
                  
                  <div style={{ marginTop: 16 }}>
                    <Card title="直接启动 iproxy" size="small">
                      <p>如果上面的方法都无法解决问题，可以尝试直接启动 iproxy</p>
                      <Space direction="horizontal">
                        <span>设备端口:</span>
                        <InputNumber 
                          min={1000} 
                          max={65535} 
                          defaultValue={3000} 
                          id="direct-device-port"
                        />
                        <span>主机端口:</span>
                        <InputNumber 
                          min={1000} 
                          max={65535} 
                          defaultValue={3000} 
                          id="direct-host-port"
                        />
                        <Button
                          type="primary"
                          onClick={async () => {
                            try {
                              const devicePort = document.getElementById('direct-device-port')?.['value'] || 3000;
                              const hostPort = document.getElementById('direct-host-port')?.['value'] || 3000;
                              
                              message.loading('正在启动 iproxy...', 1);
                              
                              const result = await window.electronAPI.startIproxyWithParams(
                                devicePort, 
                                hostPort
                              );
                              
                              if (result.success) {
                                message.success('iproxy 启动成功');
                              } else {
                                message.error(`iproxy 启动失败: ${result.message}`);
                              }
                            } catch (error) {
                              message.error('启动失败: ' + (error as Error).message);
                            }
                          }}
                        >
                          直接启动 iproxy
                        </Button>
                        <Button
                          danger
                          onClick={async () => {
                            try {
                              await window.electronAPI.stopUsbForwarding();
                              message.success('iproxy 已停止');
                            } catch (error) {
                              message.error('停止失败: ' + (error as Error).message);
                            }
                          }}
                        >
                          停止 iproxy
                        </Button>
                      </Space>
                    </Card>
                  </div>
                </Card>
              </div>
            )}
          </Space>
        </Card>

        <Card title="高级故障排除" size="small">
          <Alert
            message="如果您持续遇到连接问题，请尝试以下方法"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              onClick={async () => {
                try {
                  // 关闭所有服务
                  if (usbServiceRunning) {
                    await window.electronAPI.stopUsbForwarding();
                  }
                  if (httpServerRunning) {
                    await window.electronAPI.stopHttpServer();
                  }
                  
                  // 执行诊断
                  await runDiagnostics();
                  
                  message.success('重置完成，请尝试重新启动服务');
                } catch (error) {
                  message.error('重置失败: ' + (error as Error).message);
                }
              }}
            >
              重置所有服务
            </Button>
            
            <Button
              onClick={async () => {
                try {
                  const result = await window.electronAPI.executeCommand('killall -9 iproxy');
                  message.info('已尝试强制终止所有 iproxy 进程');
                } catch (error) {
                  // 忽略错误
                }
              }}
            >
              强制终止所有 iproxy 进程
            </Button>
            
            <Button
              onClick={async () => {
                try {
                  // 检查 libimobiledevice 工具
                  const result = await window.electronAPI.executeCommand('brew list libimobiledevice');
                  if (result.success) {
                    message.success('libimobiledevice 工具已安装');
                  } else {
                    // 使用 Modal.confirm 替代直接调用 confirm
                    Modal.confirm({
                      title: '安装推荐工具',
                      content: '未安装 libimobiledevice 工具，这可能会影响 USB 连接。是否安装？',
                      onOk: async () => {
                        message.loading('正在安装 libimobiledevice...');
                        const installResult = await window.electronAPI.executeCommand('brew install libimobiledevice');
                        if (installResult.success) {
                          message.success('libimobiledevice 安装成功！');
                        } else {
                          message.error('安装失败: ' + installResult.error);
                        }
                      }
                    });
                  }
                } catch (error) {
                  message.error('检查失败: ' + (error as Error).message);
                }
              }}
            >
              检查并安装 libimobiledevice
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default SettingsPage; 