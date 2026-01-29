# Bridge Service Health Check - Design Document

## Overview

This enhancement provides users with an indication when the Wafir bridge service is unavailable by implementing a health check system and conditionally disabling the submit button.

## Architecture

### 1. Health Endpoint (Bridge Service)

**File:** `apps/bridge/src/routes/health.ts`

A new lightweight endpoint that returns service status:

- **Route:** `GET /health`
- **Response:** `{ status: "ok", timestamp: "2026-01-24T..." }`
- **Purpose:** Allows clients to quickly verify the bridge service is reachable
- **No Authentication Required:** Public endpoint for status checks

### 2. Health Check Function (Client API)

**File:** `packages/wafir/src/api/client.ts`

New function `checkBridgeHealth()`:

- Calls the `/health` endpoint
- 5-second timeout to prevent long hangs
- Returns boolean: `true` if service is available, `false` otherwise
- Handles network errors gracefully with console warnings

### 3. Bridge Availability State (Widget)

**File:** `packages/wafir/src/wafir-widget.ts`

Added state management:

- **State:** `isBridgeAvailable` (boolean, default: true)
- **Health Check Trigger:** Runs when modal opens via `_openModal()`
- **Check Method:** `_checkBridgeHealth()` - calls API and updates state
- **State Propagation:** Passes `bridgeAvailable` prop to `wafir-form`

### 4. Conditional Submit Button (Form)

**File:** `packages/wafir/src/wafir-form.ts`

Updated form component:

- **New Prop:** `bridgeAvailable` (boolean, default: true)
- **Submit Button Behavior:**
  - Disabled when `!bridgeAvailable` or `loading`
  - Button text changes to "Service Unavailable" when bridge is down
  - Visual state clearly indicates the service is unreachable

### 5. OpenAPI Schema Update

**File:** `packages/wafir/src/api/index.ts`

Added `/health` endpoint to TypeScript types for type safety across the client.

## User Flow

1. **User Opens Widget Modal**
   - Widget triggers health check in background
   - Modal opens immediately (non-blocking)

2. **Health Check Executes**
   - Attempts to reach `/health` endpoint
   - 5-second timeout prevents indefinite waiting
   - Updates `isBridgeAvailable` state

3. **Form Displays Current State**
   - If available: Submit button is enabled and says "Submit"
   - If unavailable: Submit button is disabled and grayed out, says "Service Unavailable"

4. **User Experience**
   - Clear visual feedback about service status
   - Cannot submit when service is down (button disabled)
   - No confusing error messages after attempted submission

## Benefits

✅ **Proactive Indication:** Users know immediately if service is down  
✅ **Better UX:** Prevents submission attempts that will fail  
✅ **Clear Messaging:** Button text clearly states "Service Unavailable"  
✅ **Fast Check:** 5-second timeout ensures quick response  
✅ **Non-Intrusive:** Check happens in background during modal open  
✅ **Graceful Degradation:** Defaults to available if check fails

## Technical Details

### Timeout Handling

- Uses `AbortSignal.timeout(5000)` for 5-second timeout
- Prevents indefinite waiting on network issues
- Falls back to unavailable state on timeout

### Error Handling

- All errors logged to console with warnings
- Never throws errors to user interface
- Defaults to "unavailable" on any error for safety

### Performance

- Lightweight endpoint (no database queries)
- Parallel execution with config fetch
- Minimal impact on modal open speed

## Future Enhancements (Optional)

1. **Periodic Background Checks:** Check health every 30 seconds while modal is open
2. **Visual Status Indicator:** Add a small status badge/icon in modal header
3. **Retry Button:** Allow users to manually retry health check
4. **Detailed Error Messages:** Differentiate between timeout, network error, server error
5. **Telemetry:** Track service availability metrics for monitoring

## Implementation Files Changed

1. ✅ `apps/bridge/src/routes/health.ts` - New health endpoint
2. ✅ `packages/wafir/src/api/client.ts` - Health check function
3. ✅ `packages/wafir/src/wafir-widget.ts` - State management & health check trigger
4. ✅ `packages/wafir/src/wafir-form.ts` - Conditional submit button
5. ✅ `packages/wafir/src/api/index.ts` - OpenAPI schema update

## Testing Recommendations

1. **Happy Path:** Verify submit button is enabled when service is running
2. **Service Down:** Stop bridge service, verify button is disabled with correct text
3. **Network Timeout:** Simulate slow network, verify 5-second timeout works
4. **Network Error:** Disconnect network, verify graceful handling
5. **Recovery:** Start service while modal is open, verify state doesn't auto-update (expected behavior for MVP)
