## Plan

I want to make a Telegram bot/miniapp that can split money between users. The bot should be easily added to group chats. Ideally, there should be both chat interface (like /split commands) and light UI interface (like a Telegram mini app).

## Features

### MVP
- Split money between users (chat and miniapp)
- Split money between users with a custom split (chat and miniapp)
- Simplify debts between users in a group chat, optimizing to minimize the number of transactions (chat and miniapp)
- Converting currency based on latest exchange rates
- Miniapp interface for splitting money and viewing current balances
- Ability to restrict bots to certain groups by an admin (me) for testing and security
- It should be hosted on cloud services, making use of free-tier services as much as possible
- Data should be stored for persistence

### Future
- Subscription to the bot (weekly and yearly)
    - Does it make sense to base the cost on number of users in a group chat?
- What should subscription include?
    - Ads in free tier vs no ads in premium tier?
    - Maybe automatic currency conversion should be in premium tier?
    - Links for quick payment settlement through Google Pay and WeChat Pay?
- Smart defaulting of currency: Best guess of the currency of an expense based on the user's local timezone/location (e.g., retrieving from Telegram WebApp initData or navigator API).
