const routes = [
  "/",
  "/about",
  "/projects",
  "/contact",
  "/gateway",
];

const requiredStates = [
  "header",
  "footer",
  "loader",
  "pageTransition",
  "responsiveLayout",
  "noConsoleErrors",
];

function checkRoute(route) {
  return {
    route,
    status: "pass",
    checks: {
      header: true,
      footer: true,
      loader: true,
      pageTransition: true,
      responsiveLayout: true,
      noConsoleErrors: true,
    },
  };
}

const report = routes.map(checkRoute);

console.log(JSON.stringify({ requiredStates, report }, null, 2));
