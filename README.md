# AlfaNotificationBot

This project implements simple Telegram bot that fetches USD/EUR currency rate data from alfabank.ru and notifies subscribers when buying price changes.
Bot supports the following commands:

  * **/usd** - send current buying price for USD
  * **/eur** - send current buying price for EUR
  * **/subscribe** - subscribe to currency rate changes
  * **/unsubscribe** - unsubscribe from currency rate changes

To make it work - change the ```token``` variable to your token and start it with ```node index.js```
