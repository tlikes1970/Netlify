// Production SendGrid Dynamic Template for Episode Notifications
// Template ID: d-22144b9bf8d74fe0bec75f0a430ede9a

/*
Template Structure:
- userName: string (e.g., "John Doe")
- message: string (e.g., "New episode of The Office is airing!")
- showName: string (e.g., "The Office")
- episodeTitle: string (e.g., "The Dundies")
- seasonNumber: number (e.g., 2)
- episodeNumber: number (e.g., 1)
- airDate: string (e.g., "2024-01-15T21:00:00Z")

Template HTML should include:
- Personalized greeting with {{userName}}
- Show information: {{showName}}
- Episode details: Season {{seasonNumber}}, Episode {{episodeNumber}}: {{episodeTitle}}
- Air date: {{airDate}}
- Call-to-action button to open Flicklet
- Unsubscribe link

Template Text version should include the same information in plain text format.
*/

// Example template data for testing:
const exampleTemplateData = {
  userName: "John Doe",
  message: "New episode of The Office is airing!",
  showName: "The Office",
  episodeTitle: "The Dundies",
  seasonNumber: 2,
  episodeNumber: 1,
  airDate: "2024-01-15T21:00:00Z"
};





