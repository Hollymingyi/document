# PRD: Bot Call VAD Pre-Tone Detection, Transfer Status Tracking & Transfer Timeout Optimization

## Labels

`ready-for-agent`

## Problem Statement

During AI outbound bot calls, the opening audio would play immediately upon call answer, even if the customer was still speaking (e.g., saying "喂?"). This caused the bot to talk over the customer, resulting in a poor first impression and wasted call time. Additionally, when bot calls were transferred to human agents, the platform had no visibility into why transfers failed — no structured failure codes or status tracking existed. Finally, transfer timeouts were set too high (60–180 seconds), causing customers to wait in silence for extended periods before being disconnected.

## Solution

Three targeted improvements to the gt-call outbound bot call pipeline:

1. **VAD Pre-Tone Detection**: A `PreToneDetector` module monitors incoming audio after call answer, waiting for 1 second of consecutive silence before playing the opening audio. This ensures the customer has stopped speaking before the bot begins, avoiding crosstalk. A 5-second maximum wait prevents indefinite blocking.

2. **Transfer Status & Failure Reason Tracking**: Structured transfer outcome tracking with standardized failure codes propagated through the talk info callback to gt-market. Every transfer failure point now records a specific reason: `agent_no_pickup`, `no_idle_agent`, `network_error`, or `customer_mid_hangup`.

3. **Transfer Timeout Reduction**: All transfer-related timeouts reduced from 60–180 seconds to a uniform 30 seconds, preventing customers from waiting in silence for unreasonable durations.

## User Stories

1. As a call center manager, I want the bot to wait for silence before speaking, so that customers don't experience the bot talking over them at call start.
2. As a call center manager, I want transfer attempts to time out after 30 seconds, so that customers aren't left waiting in silence for minutes when no agent is available.
3. As a call center manager, I want to know why each transfer failed, so that I can identify staffing gaps and system issues.
4. As an operations analyst, I want structured failure reason codes in talk info records, so that I can build reports on transfer failure patterns.
5. As a system administrator, I want the pre-tone detection to have a maximum wait time, so that calls don't stall indefinitely if the customer keeps speaking.
6. As a call center manager, I want to distinguish between "no agent available" and "agent didn't pick up", so that I can take different corrective actions.
7. As an operations analyst, I want to track when customers hang up mid-transfer, so that I can measure the impact of transfer wait times on customer patience.
8. As a system administrator, I want the pre-tone silence threshold to be configurable, so that I can tune it for different call scenarios (noisy environments, etc.).
9. As a developer, I want the pre-tone detector to integrate cleanly into the existing ASR sidecar flow, so that it doesn't disrupt the audio pipeline.
10. As a call center manager, I want originate timeouts and queue timeouts to be consistent (both 30s), so that customer experience is predictable regardless of which timeout fires.

## Implementation Decisions

- **PreToneDetector** is a standalone deep module with a simple interface: `startDetection(streamId, onComplete)`, `onAudioChunk(streamId, pcm)`, `cancel(streamId)`. It encapsulates all VAD logic (RMS computation, silence threshold, consecutive silence counting, max wait timer) behind this interface. Two integration points: `UdpAsrSidecarRunner.senderLoop()` diverts audio to the detector instead of the ASR transcriber during pre-tone phase; `OutboundBotCallModeHandler.handleChannelPark()` starts detection and uses the callback to trigger playback.

- PreToneDetector configuration: `silenceGateMs=1000` (1s consecutive silence), `maxWaitMs=5000` (5s absolute max), `silenceThreshold=300` (RMS), `enabled=true` by default.

- **Transfer status** uses three fields: `CallMetrics.transferFailReason` (in-memory per-call state), `TalkInfoCallbackDTO.transferStatus` (enum: `not_triggered`/`succeeded`/`failed`), and `TalkInfoCallbackDTO.lastFailureReason` (string code). The builder in `TalkInfoCallbackBuilder` maps `transferFailReason` to `lastFailureReason` and infers `transferStatus`.

- Four canonical failure codes: `agent_no_pickup` (originate to agent failed, agent didn't answer), `no_idle_agent` (ACD found no available agent), `network_error` (FreeSWITCH bridge failure), `customer_mid_hangup` (customer hung up before transfer completed).

- Failure codes are set at each failure point in `AcdBridgeService` (originate fail, bridge fail, exception) and `OutboundBotCallModeHandler` (no agent from ACD queue), then propagated via `CallMetrics` to the callback DTO.

- **Transfer timeout** is now uniformly 30 seconds across three locations: `AcdBridgeService` originate call timeout (`.orTimeout(30, SECONDS)`), `OutboundBotCallModeHandler` queued call timeout (`call.setTimeoutSeconds(30)`), and `AcdProperties.defaultQueueTimeoutSeconds` default value changed from 60 to 30.

- Pre-tone detection does NOT affect the ASR transcriber — audio is consumed by the detector during the pre-tone phase and discarded (not buffered for later transcription). ASR transcription begins only after pre-tone detection completes.

## Testing Decisions

- **PreToneDetector** tests should verify external behavior: given a sequence of audio chunks with known RMS patterns, the detector fires the callback at the correct time (after 1s silence) and respects the max wait timeout. Tests should NOT test internal RMS computation directly — only the observable outcome (callback timing). Mock audio chunk generation with known silence/speech patterns.

- **Transfer status tracking** tests should verify that each failure scenario (`agent_no_pickup`, `no_idle_agent`, `network_error`, `customer_mid_hangup`) correctly populates `CallMetrics.transferFailReason`, and that `TalkInfoCallbackBuilder` correctly maps these to `transferStatus` and `lastFailureReason` in the DTO. Test the builder as a pure function — input metrics state, output DTO fields.

- **Transfer timeout** is a configuration value — tests should verify that `AcdProperties.defaultQueueTimeoutSeconds` defaults to 30 and that `AcdBridgeService` uses the configured timeout value. These are simple assertion tests on config defaults and constructor injection.

- Prior art in the codebase: `ConcurrencyPreCheckTest` shows the pattern for testing service-layer logic with Redis mocks.

## Out of Scope

- Configurable pre-tone detection parameters via Nacos (currently hardcoded defaults).
- Transfer status display in the frontend admin UI.
- Retry logic for failed transfers.
- ACD queue priority or escalation strategies.
- Audio buffering during pre-tone phase for later ASR processing.
- Metrics/analytics dashboards for transfer failure rates.

## Further Notes

- The three features are independent and were implemented as separate tasks (Tasks 12, 13, 14). They share no runtime dependencies.
- `customer_mid_hangup` is set in `TalkInfoCallbackBuilder.build()` based on hangup timing (customer hung up while transfer was in progress), not at the failure point itself — this is a derived status rather than a directly set failure code.
- The 30-second timeout value was chosen as a balance between giving agents enough time to answer and not making customers wait too long. This can be tuned per deployment via `AcdProperties` configuration.
