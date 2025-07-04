import gdAbtest from '@gaoding/gd-abtest';

export const initABTest = async (options: {
  deviceId: string;
  userId?: string;
  orgId?: string;
}) => {
  gdAbtest._requestInstance = null;
  gdAbtest.init({
    app_key: process.env.AB_APP_KEY,
    app_name: 'gd_gdesign_web_dev',
    region: 'CHINA',
    user_id: options.userId || '',
    device_id: options.deviceId,
    org_id: options.orgId || '0',
    is_login: options.userId ? 1 : 0,
  });
};

export const getAbValue = (key: string, defaultVal: string) => {
  return gdAbtest.getValue(key, defaultVal);
};
