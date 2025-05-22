export const config = c => ({
  title: c.title,
    
  theme: localStorage.getItem('app-theme') ? ref(localStorage.getItem('app-theme')) : c.theme, // dark Or light
    
  navigationMenu: localStorage.getItem('app-menu') ? ref(localStorage.getItem('app-menu')) : c.navigationMenu, // horizontal or vertical
  isBoxLayout: c.isBoxLayout,
    
  isVerticalMenuMini: localStorage.getItem('app-menu-mini') ? ref(JSON.parse(localStorage.getItem('app-menu-mini'))) : c.isVerticalMenuMini,
  defaultLocale: c.defaultLocale, // en | fr | ar
  isRtl: c.isRtl,
    
  isSemiDark: localStorage.getItem('app-semi-dark') ? ref(JSON.parse(localStorage.getItem('app-semi-dark'))) : c.isSemiDark,
    
  skins: localStorage.getItem('app-skins') ? ref(localStorage.getItem('app-skins')) : c.skins, // classic | modern
    
  isNavbarFixed: localStorage.getItem('app-navbar-fixed') ? ref(JSON.parse(localStorage.getItem('app-navbar-fixed'))) : c.isNavbarFixed,
  routeTransition: c.routeTransition,
})
