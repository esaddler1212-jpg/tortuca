/* Alfred service worker — push notifications */
self.addEventListener("push", (event) => {
  let data = { title: "Alfred", body: "You have a reminder.", url: "/" };
  try {
    data = { ...data, ...JSON.parse(event.data?.text() ?? "{}") };
  } catch {
    /* use defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: data.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          if ("navigate" in client && client.url !== new URL(url, self.location.origin).href) {
            return client.navigate(url).then(() => client.focus());
          }
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
