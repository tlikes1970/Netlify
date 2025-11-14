# Firestore "mail" Collection Writes and firestore-send-email References

## Writes to Firestore Collection "mail"

- **functions/src/weeklyDigest.ts:137** - Method: `db.collection("mail").add()`
  - `// Send email via firestore-send-email extension`
  - `await db.collection("mail").add({ to: subscriber.email, message: { subject: "Your Weekly Flicklet Digest", html: emailHtml, text: buildPlainTextTemplate({...}), }, });`

## References to "firestore-send-email"

- **firebase.json:39** - `"firestore-send-email": "firebase/firestore-send-email@0.2.4"`

- **.firebaserc:10** - `"firestore-send-email": "a3a80cb222030ef74d14cf4155befb48b2999847d0e068b7bc9cdda0c9281f97"`

- **extensions/firestore-send-email.env:10** - `MAIL_COLLECTION=mail`

- **extensions/firestore-send-email.env:13** - `SMTP_CONNECTION_URI=smtp://apikey:${SENDGRID_API_KEY}@smtp.sendgrid.net:587`

- **extensions/firestore-send-email.env:4** - `DEFAULT_FROM=noreply@flicklet.app`

