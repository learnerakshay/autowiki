# Manual QA

Run the app in a production preview and check these on real devices:

1. In Chrome, open a light tab and a dark tab. Confirm the favicon is legible in both, then open `web/public/favicon.ico` in Windows and confirm its small sizes are sharp.
2. Install the site on Android and confirm the maskable icon keeps the entire mark inside the system crop.
3. Open the landing, Workspace, and sample Wiki in Safari. Check the navigation, repository field, three-column reader, code overflow, and diagram expansion at desktop and phone widths.
4. On a phone, swipe the landing chapter story and drag the navigation and Wiki sheets. Check that a vertical swipe still scrolls outside a diagram.
5. With NVDA in Chrome or VoiceOver in Safari, start at Workspace. Enter an invalid repository, correct it, start each independent job, and hear the status changes without focus moving. Open the Wiki and navigate chapters, headings, source links, diagram controls, and the expanded viewer by keyboard and screen reader. Close each overlay with Escape and confirm focus returns to its trigger.
6. Repeat Workspace and Wiki in Windows high contrast mode and with reduced motion enabled. Every control needs a visible outline and readable name.
