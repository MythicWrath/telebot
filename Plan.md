## Plan

I want to make a Telegram bot/miniapp that can split money between users. The bot should be easily added to group chats. Ideally, there should be both chat interface (like /split commands) and light UI interface (like a Telegram mini app).

## Features

### MVP
- Split money between users (chat and miniapp)
- Split money between users with a custom split (chat and miniapp)
- Simplify debts between users in a group chat, optimizing to minimize the number of transactions (chat and miniapp)
- Allows updating and deleting expenses anytime before settling up
- Converting currency based on latest exchange rates
- Miniapp interface for splitting money and viewing current balances
- Ability to restrict bots to certain groups by an admin (me) for testing and security
- It should be hosted on cloud services, making use of free-tier services as much as possible
- Data should be stored for persistence

### Future
- Subscription to the bot (weekly and yearly)
    - Does it make sense to base the cost on number of users in a group chat?
    - I am thinking of this scenario: The current most popular app for splitting money is Splitwise. It has a free tier that comes with limits on number of expenses that you can submit. Then the paid tier is an expensive yearly subscription, which doesn't make sense if I just use it intensively for a short period of time (e.g. for trips), while barely using it the rest of the year
    - Therefore, I am thinking of offering cheap one time passes (e.g. $2 per person for 1 week), so it's a cheap low friction, pay-as-you-need way of getting people to purchase premium tiers. Subscription tiers could also include more functionality
- What should subscription include?
    - Ads in free tier vs no ads in premium tier?
    - Maybe automatic currency conversion should be in premium tier?
    - Links for quick payment settlement through Google Pay and WeChat Pay?
- Smart defaulting of currency: Best guess of the currency of an expense based on the user's local timezone/location (e.g., retrieving from Telegram WebApp initData or navigator API).
- Settings page/tab: Allow the group creator to configure settings (e.g., restricting who can edit/delete expenses to anyone vs. just the creator).
- Refactoring of backend to separate business logic from platform-dependent code (e.g., Supabase) to enable easy platform switching in the future.
