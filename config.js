// Higher.study Training Configuration
// Single point of configuration for Google Sheets and environment settings.

(function() {
  const localUrl = (() => {
    try {
      return localStorage.getItem('hs-sheet-url') || '';
    } catch (e) {
      return '';
    }
  })();

  window.HS_CONFIG = {
    // Google Apps Script Web App URL (deployed from Code.gs)
    SHEET_URL: localUrl || 'https://script.google.com/macros/s/AKfycbw13Qnih-SAwXFL54YGdzZrt4h8H7geDDiXoUIeypROU7Ncl2gGu9cCH8jU8ZbZ7BR5Fw/exec',
    
    // Set to true only if you want to block registration/login until Google Sheet is connected
    REQUIRE_SHEET: false,

    // Initial Primary Admin Seed
    PRIMARY_ADMIN_EMAIL: 'hsadmin@gmail.com',
    PRIMARY_ADMIN_INITIAL_PW: 'hsadmin@2026',

    // App Version
    VERSION: '3.0.0-PROD'
  };
})();
