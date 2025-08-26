# Koa Precompute

## Background

In the Next.js ecosystem, the Flag system provides powerful precompute functionality that allows pre-generating flag values on the server side and serializing them into strings, then quickly deserializing them on the client side to obtain results. This mechanism can significantly improve performance and reduce repeated server-side calculations.

However, when using Flag's precompute functionality in the Koa framework, we encountered a critical limitation:

### Problem Analysis

1. **Flag Precompute Limitations**: Flag's `precompute` and `evaluate` functions do not support dynamically passing `request` objects
2. **Flag Function Flexibility**: The flag functions provided by `flag/next` themselves support passing `request` parameters [Reference Pages Router](https://flags-sdk.dev/frameworks/next#pages-router)
3. **Koa Environment Requirements**: In Koa applications, Flag cannot automatically obtain `request` internally and requires manual passing

### Core Contradiction

```typescript
// flag's precompute function doesn't support request parameter
export async function precompute<T extends FlagsArray>(
  flags: T,
  // ❌ No request parameter
): Promise<string>;

// But flag functions themselves support request parameters
const flag = flag<boolean>({
  key: 'user-feature',
  decide: (request) => {
    // ✅ Can access cookies, headers, etc. from request
    return request?.cookies?.['user-type'] === 'premium';
  },
});
```

## Solution

To solve this problem, we provide enhanced precompute functions for the Koa environment that support dynamically passing `request` objects:

### New Features

1. **evaluate function supporting request parameters**
2. **precompute function supporting request parameters**
3. **Complete type safety support**
4. **Backward compatibility**

### Implementation Principle

```typescript
// Koa's enhanced precompute functions
export async function evaluate<T extends FlagsArray>(
  flags: T,
  request?: KoaRequest, // ✅ Supports optional request parameter
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }>;

export async function precompute<T extends FlagsArray>(
  flags: T,
  request?: KoaRequest, // ✅ Supports optional request parameter
): Promise<string>;
```

## Usage Examples

### Basic Usage

```typescript
import { flag } from '@web-widget/flags/next';
import { precompute, evaluate } from '@web-widget/flags/koa';

// Define flags that support request
const userFeatureFlag = flag<boolean>({
  key: 'user-feature',
  decide: (request) => {
    // Decide flag value based on request context
    const userType = request?.cookies?.['user-type'];
    return userType === 'premium';
  },
});

const themeFlag = flag<string>({
  key: 'theme',
  decide: (request) => {
    // Decide theme based on cookies
    return request?.cookies?.['theme'] || 'light';
  },
});

const flags = [userFeatureFlag, themeFlag];
```

### Precompute Usage

```typescript
// Use in Koa middleware
app.use(async (ctx, next) => {
  // Create Koa-compatible request object
  const koaRequest = {
    cookies: ctx.cookies,
    headers: ctx.headers,
    // Other necessary properties...
  };

  try {
    // Precompute all flags
    const precomputedCode = await precompute(flags, koaRequest);

    // Pass precomputed results to client
    ctx.state.precomputedFlags = precomputedCode;

    await next();
  } catch (error) {
    console.error('Flag precompute failed:', error);
    await next();
  }
});
```

### Dynamic Evaluation

```typescript
// Directly evaluate flags (without precompute)
app.use(async (ctx, next) => {
  const koaRequest = {
    cookies: ctx.cookies,
    headers: ctx.headers,
  };

  try {
    // Directly evaluate flags
    const flagValues = await evaluate(flags, koaRequest);

    // Use evaluation results
    ctx.state.userFeature = flagValues[0]; // userFeatureFlag value
    ctx.state.theme = flagValues[1]; // themeFlag value

    await next();
  } catch (error) {
    console.error('Flag evaluation failed:', error);
    await next();
  }
});
```

## Type Definitions

### KoaRequest Type

```typescript
type KoaRequestCookies = Partial<{
  [key: string]: string;
}>;

type KoaRequest = IncomingMessage & {
  cookies: KoaRequestCookies;
};
```

### Function Signatures

```typescript
// Evaluate flags
export async function evaluate<T extends FlagsArray>(
  flags: T,
  request?: KoaRequest,
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }>;

// Precompute flags
export async function precompute<T extends FlagsArray>(
  flags: T,
  request?: KoaRequest,
): Promise<string>;

// Deserialize
export async function deserialize(
  flags: FlagsArray,
  code: string,
  secret?: string,
): Promise<Record<string, JsonValue>>;

// Get precomputed value
export async function getPrecomputed<T extends JsonValue>(
  flag: Flag<T, any>,
  precomputeFlags: FlagsArray,
  code: string,
  secret?: string,
): Promise<T>;
```
