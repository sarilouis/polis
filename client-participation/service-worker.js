self.addEventListener('install', function(event) {
  // Perform install steps
  console.log('[Service Worker install]');
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker activate] ', event);
 });

self.addEventListener('push', function(event) {
  var data = ( event.data ? event.data.json() : {} );
  console.info('[Service Worker Push] data:' , data );
  var title = data.title || 'Polis';
  
  var options = {
    'body': data.body || 'New statements to vote on' ,
    'tag': data.tag || 'polis',
    'data' : { 'url': data.url || '/' } ,
    'badge': '/favicon.ico' ,
    'icon': '/favicon.ico'
  };
  event.waitUntil( self.registration.showNotification(title, options) ); 
});

self.addEventListener('notificationclick', function(event) {
  console.log ( '[Service Worker notificationclick]'  , event.notification  );
  var url = event.notification.data.url || '/';
  //event.notification.close(); //Close the notification
  self.registration.getNotifications().then(function(notifications) { //Close all notifications
    notifications.forEach(function(notification) { notification.close(); });
  });
  //event.waitUntil(clients.openWindow(url));
  
  event.waitUntil( 
    self.clients.matchAll({type: 'window',includeUncontrolled: true}).then(function(windowClients) {
      const urlToOpen = new URL(url, self.location.origin).href;
      var matchingClient = null;
  
      for (var i = 0; i < windowClients.length; i++) {
        const windowClient = windowClients[i];
        if (windowClient.url === urlToOpen) {
          matchingClient = windowClient;
          break;
        }
      }
      if (matchingClient) {
        console.log('[Service Worker notificationclick] Application is already open switching focus!');
        //matchingClient.postMessage({ "action" : "open_window" , "url" : url });
        return matchingClient.focus();
      } else {
        console.log('[Service Worker notificationclick] Open new tab');
        return self.clients.openWindow(url);
        }
    })  
    );

});