/**
 * Create a configured MQTT client for a Yoto device
 * @param {YotoMqttOptions} options - MQTT connection options
 * @returns {YotoMqttClient} Configured Yoto MQTT client
 * @throws {Error} If required options are missing
 *
 * @example
 * ```javascript
 * import { createYotoMqttClient } from 'yoto-nodejs-client/lib/mqtt'
 *
 * const client = createYotoMqttClient({
 *   deviceId: 'abc123',
 *   accessToken: 'eyJhbGc...'
 * })
 *
 * client.on('events', (message) => {
 *   console.log('Playing:', message.trackTitle)
 * })
 *
 * await client.connect()
 * ```
 *
 * @example
 * ```javascript
 * // Disable automatic reconnection
 * const client = createYotoMqttClient({
 *   deviceId: 'abc123',
 *   accessToken: 'token',
 *   mqttOptions: {
 *     reconnectPeriod: 0,     // Disable auto-reconnect (default is 5000ms)
 *     connectTimeout: 30000   // 30 second connection timeout
 *   }
 * })
 * ```
 */
export function createYotoMqttClient(options: YotoMqttOptions): YotoMqttClient;
/**
 * MQTT.js client options that can be passed to createYotoMqttClient
 */
export type MqttClientOptions = Partial<mqtt.IClientOptions>;
export type YotoMqttOptions = {
    /**
     * - Device ID to connect to
     */
    deviceId: string;
    /**
     * - JWT access token for authentication
     */
    accessToken: string;
    /**
     * - Prefix for MQTT client ID (default: 'DASH')
     */
    clientIdPrefix?: string;
    /**
     * - MQTT broker URL
     */
    brokerUrl?: string;
    /**
     * - MQTT broker port
     */
    port?: number;
    /**
     * - Auto-subscribe to device topics on connect
     */
    autoSubscribe?: boolean;
    /**
     * - Additional MQTT.js client options (defaults: reconnectPeriod=5000, keepalive=300; cannot override: clientId, username, password, protocol, ALPNProtocols)
     */
    mqttOptions?: MqttClientOptions;
};
import { YotoMqttClient } from './client.js';
import mqtt from 'mqtt';
//# sourceMappingURL=factory.d.ts.map