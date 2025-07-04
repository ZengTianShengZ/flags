import { defineMiddlewareHandler } from '@web-widget/helpers';
import { ResponseCookies, RequestCookies } from '@web-widget/helpers/headers';

const createDeviceId = () => {
  // Generate a unique device ID, e.g., using a UUID or similar method
  // This is a placeholder implementation; replace with your actual logic
  return `device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export const handler = defineMiddlewareHandler(async (ctx, next) => {
  const { request } = ctx;

  const cookieStore = new RequestCookies(request.headers);
  let deviceId = cookieStore.get('user_device_id')?.value || null;

  // If no visitor ID or reset is requested, create a new one
  if (!deviceId) {
    deviceId = createDeviceId();
    request.headers.set('x-user_device_id', deviceId);
  }

  // Continue to the route handler
  const response = await next();

  // Set the visitor ID cookie if it wasn't already set
  if (!cookieStore.has('user_device_id')) {
    const responseCookies = new ResponseCookies(response.headers);
    responseCookies.set('user_device_id', deviceId, {
      path: '/',
      httpOnly: true,
    });
  }

  return response;
});
