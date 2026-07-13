export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentPath = null;
    this.currentCleanup = null;
    this._onHashChange = this._onHashChange.bind(this);
  }

  navigate(path) {
    window.location.hash = path;
  }

  start() {
    window.addEventListener('hashchange', this._onHashChange);
    const initialPath = this.getCurrentPath();
    this._render(initialPath);
  }

  getCurrentPath() {
    return window.location.hash.replace(/^#/, '') || '/';
  }

  _onHashChange() {
    const path = this.getCurrentPath();
    this._render(path);
  }

  async _render(path) {
    if (this.currentCleanup) {
      this.currentCleanup();
      this.currentCleanup = null;
    }

    const route = this.routes[path];
    if (!route) {
      const fallback = this.routes['/404'] || this.routes['/'];
      if (fallback) {
        const app = document.getElementById('app');
        if (app) app.innerHTML = fallback.render();
        if (fallback.setup) fallback.setup();
      }
      return;
    }

    const app = document.getElementById('app');
    if (app) app.innerHTML = route.render();
    if (route.setup) route.setup();
  }
}
