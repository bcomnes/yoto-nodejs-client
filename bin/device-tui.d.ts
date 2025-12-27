#!/usr/bin/env node
export type DeviceCard = {
    box: Box;
    nameText: Text;
    statusText: Text;
    batteryText: Text;
    playbackText: Text;
    model: YotoDeviceModel;
    index: number;
};
export type DetailView = {
    container: Box;
    deviceBox: Box;
    connectionText: Text;
    batteryText: Text;
    volumeText: Text;
    modeText: Text;
    tempText: Text;
    playbackHeader: Text;
    trackText: Text;
    chapterText: Text;
    progressText: Text;
    cardText: Text;
    logBox: Box;
    logLines: string[];
    model: YotoDeviceModel | null;
};
import { Box } from '@unblessed/node';
import { Text } from '@unblessed/node';
import type { YotoDeviceModel } from '../lib/yoto-device.js';
//# sourceMappingURL=device-tui.d.ts.map