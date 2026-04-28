const OTPRepository = require('../modules/otp/repositories/otp.repository');

class OTPCronJob {
    constructor() {
        this.interval = null;
    }

    /**
     * Start the cron job to clean up expired and verified OTPs
     * @param {number} intervalMs - Interval in milliseconds (default: 5 minutes)
     */
    start(intervalMs = 5 * 60 * 1000) {
        console.log(`[OTP Cron] Starting OTP cleanup job (every ${intervalMs / 1000}s)`);
        
        // Run immediately on start
        this.cleanup();

        // Then run at the specified interval
        this.interval = setInterval(() => {
            this.cleanup();
        }, intervalMs);
    }

    /**
     * Stop the cron job
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('[OTP Cron] Stopped OTP cleanup job');
        }
    }

    /**
     * Clean up expired and verified OTPs
     */
    async cleanup() {
        try {
            console.log('[OTP Cron] Running OTP cleanup...');
            
            // Delete expired and verified OTPs
            const deletedCount = await OTPRepository.deleteExpiredAndVerified();
            
            // Also delete OTPs older than 7 days as a safety measure
            const deletedOldCount = await OTPRepository.deleteOlderThan(7);
            
            console.log(`[OTP Cron] Cleaned up ${deletedCount} expired/verified OTPs and ${deletedOldCount} old OTPs`);
        } catch (error) {
            console.error('[OTP Cron] Error during OTP cleanup:', error);
        }
    }

    /**
     * Manual trigger for cleanup (can be called via API)
     */
    async manualCleanup() {
        return await this.cleanup();
    }
}

module.exports = new OTPCronJob();