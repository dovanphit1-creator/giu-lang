/* Enable downloads only with a verified, complete release manifest. Never inject release HTML. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const validRepository = (value) => value === 'dovanphit1-creator/giu-lang';
  function trustedUrl(value, repository, asset) {
    if (typeof value !== 'string') return false;
    try {
      const url = new URL(value);
      const prefix = `/${repository}/releases/${asset ? 'download/' : 'tag/'}`;
      return url.protocol === 'https:' && url.hostname === 'github.com' && !url.port && !url.username && !url.password && !url.search && !url.hash && url.pathname.startsWith(prefix) && url.pathname.length > prefix.length;
    } catch { return false; }
  }
  function validAsset(asset, repository, suffix) {
    return asset && trustedUrl(asset.url, repository, true) && asset.url.toLowerCase().endsWith(suffix) && /^[a-f0-9]{64}$/i.test(asset.sha256 || '') && Number.isSafeInteger(asset.size) && asset.size > 0;
  }
  function enable(id, asset) {
    const link = $(id);
    link.href = asset.url;
    link.removeAttribute('aria-disabled');
    link.removeAttribute('tabindex');
    link.classList.remove('disabled');
  }
  function renderAndroid(release) {
    const android = release.android;
    if (!android || android.status !== 'published') return;
    if (!validRepository(release.repository) ||
        !/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(android.version || '') ||
        !trustedUrl(android.releaseUrl, release.repository, false) ||
        !validAsset(android.apk, release.repository, '.apk') ||
        typeof android.minimumAndroid !== 'string' || !android.minimumAndroid.trim()) {
      $('android-status').textContent = 'Chưa xác minh được bản Android. Vui lòng thử lại sau.';
      return;
    }
    enable('android-apk', android.apk);
    const testedDevice = android.deviceTested === true && typeof android.testedDevice === 'string' && android.testedDevice.trim();
    const testStatus = testedDevice ? `Đã thử trên ${testedDevice}` : 'Chưa xác nhận kiểm thử trên điện thoại thật';
    $('android-status').textContent = `Bản thử nghiệm · Android ${android.version} · ${testStatus}`;
    $('android-note').textContent = `Yêu cầu Android ${android.minimumAndroid} trở lên. Xem hướng dẫn cài đặt và giới hạn kiểm thử tại trang phiên bản.`;
    $('android-details').textContent = `APK: ${(android.apk.size / 1048576).toFixed(1)} MB. SHA-256: ${android.apk.sha256}`;
    $('android-release-link').href = android.releaseUrl;
    $('android-release-link').hidden = false;
  }
  fetch('./release.json', {cache:'no-store', signal:AbortSignal.timeout(10000)})
    .then(response => { if (!response.ok) throw new Error('manifest'); return response.json(); })
    .then(release => {
      renderAndroid(release);
      if (release.status !== 'published') return;
      if (!validRepository(release.repository) || !/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(release.version || '') || !trustedUrl(release.releaseUrl, release.repository, false) || !validAsset(release.installer, release.repository, '.exe') || !validAsset(release.portable, release.repository, '.zip')) throw new Error('invalid release');
      enable('installer', release.installer);
      enable('portable', release.portable);
      $('version').textContent = release.version;
      $('release-status').textContent = `Đã phát hành · Phiên bản ${release.version}`;
      $('release-note').textContent = 'Windows 10/11 64-bit. Cần .NET Framework 4.8 và Microsoft Edge WebView2 Runtime. Node.js được đóng gói cùng game.';
      $('file-details').textContent = `Bộ cài: ${(release.installer.size / 1048576).toFixed(1)} MB · ZIP: ${(release.portable.size / 1048576).toFixed(1)} MB. SHA-256 bộ cài: ${release.installer.sha256}`;
      $('release-link').href = release.releaseUrl;
      $('release-link').hidden = false;
      document.querySelector('.hero-note').textContent = `Phiên bản ${release.version} · Windows 10/11 64-bit`;
      document.querySelector('footer p').textContent = 'Giữ Làng · Phân phối qua GitHub Releases';
      document.querySelector('#faq details p').textContent = 'Các nút tải chỉ mở khi thông tin phát hành và tệp tải hợp lệ. Nếu chưa tải được, hãy thử làm mới trang hoặc quay lại sau.';
    })
    .catch(() => { $('release-status').textContent = 'Chưa xác minh được bản phát hành. Vui lòng thử lại sau.'; });
})();
