import FingerprintJS from '@fingerprintjs/fingerprintjs';

export const getDeviceHash = async (): Promise<string> => {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
};
