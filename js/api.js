(function(){
  function getProjectBasePath() {
    const pathname = window.location.pathname || '/';
    const cleaned = pathname.replace(/\/(index\.html|cars\.html|dashboard\.html|review\.html|auth\/login\.html|auth\/register\.html)$/, '');
    return cleaned === '/' ? '' : cleaned;
  }

  function getApiBase() {
    const basePath = getProjectBasePath();
    if (window.location.protocol.startsWith('http')) {
      return `${window.location.origin}${basePath}/backend`;
    }
    return `${basePath}/backend`;
  }

  window.getProjectBasePath = getProjectBasePath;
  window.getApiBase = getApiBase;
  window.API = getApiBase();
})();
