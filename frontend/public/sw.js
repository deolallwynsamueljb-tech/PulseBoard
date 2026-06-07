// Kill-switch: claim clients, reload all tabs, then unregister
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.claim()
      .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
      .then((clients) => {
        clients.forEach((c) => c.navigate(c.url));
        return self.registration.unregister();
      })
  );
});
