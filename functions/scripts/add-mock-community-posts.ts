/**
 * Script: Add Mock Community Posts
 * Purpose: Add sample community posts for screenshots
 * Usage: Run from project root: npm run add:mock-posts (or: npx ts-node --project tsconfig.json functions/scripts/add-mock-community-posts.ts)
 */

import * as admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { Timestamp } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  initializeApp();
}

const db = admin.firestore();

// Mock user data
const mockUsers = [
  { id: 'mock-user-1', name: 'SarahM', isPro: true },
  { id: 'mock-user-2', name: 'AlexTV', isPro: false },
  { id: 'mock-user-3', name: 'MovieBuff99', isPro: true },
  { id: 'mock-user-4', name: 'Cinephile23', isPro: false },
];

// Generate slug from title
function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^\da-z]+/g, '-')
      .replace(/^-|-$/g, '') + `-${Date.now()}`
  );
}

// Create mock posts
const posts = [
  {
    title: 'Just finished watching the latest episode',
    body: 'That Stranger Things finale was incredible! I can\'t believe they went there. What did everyone else think? The character development this season has been top-notch.',
    excerpt: 'That ending was wild. I didn\'t see that coming at all.',
    authorId: mockUsers[0].id,
    authorName: mockUsers[0].name,
    authorEmail: null,
    tagSlugs: ['tv-shows', 'discussion'],
    topics: ['tv-shows'],
    containsSpoilers: false,
    authorIsPro: mockUsers[0].isPro,
    score: 12,
    voteCount: 8,
    commentCount: 3,
  },
  {
    title: 'Just uploaded a fan edit to the community player',
    body: 'I put together a short compilation video and shared it in the community player. Would love feedback or tips from others who\'ve done video posts before.',
    excerpt: 'Put together a short compilation and added it to the community player. Curious what people think.',
    authorId: mockUsers[1].id,
    authorName: mockUsers[1].name,
    authorEmail: null,
    tagSlugs: ['off-topic', 'video'],
    topics: ['off-topic'],
    containsSpoilers: false,
    authorIsPro: mockUsers[1].isPro,
    score: 5,
    voteCount: 4,
    commentCount: 1,
  },
  {
    title: 'Submitted a quote for the marquee',
    body: 'Submitted a quote I love to the marquee feed. Curious what kinds of quotes everyone else is sending in.',
    excerpt: 'Dropped a favorite quote into the marquee feed. Hoping it gets picked.',
    authorId: mockUsers[2].id,
    authorName: mockUsers[2].name,
    authorEmail: null,
    tagSlugs: ['off-topic', 'marquee'],
    topics: ['off-topic'],
    containsSpoilers: false,
    authorIsPro: mockUsers[2].isPro,
    score: 8,
    voteCount: 6,
    commentCount: 2,
  },
  {
    title: 'Found an amazing movie through the recommendations',
    body: 'Flicklet suggested "Everything Everywhere All at Once" based on my watchlist and I finally watched it last night. Mind-blowing! The way it blends genres and the emotional core really got me. SPOILER: The everything bagel scene had me in tears. Anyone else discover something great through the recommendations?',
    excerpt: 'Flicklet suggested this based on my watchlist and it was incredible. The everything bagel scene...',
    authorId: mockUsers[3].id,
    authorName: mockUsers[3].name,
    authorEmail: null,
    tagSlugs: ['movies', 'recommendations', 'discussion'],
    topics: ['movies'],
    containsSpoilers: true,
    authorIsPro: mockUsers[3].isPro,
    score: 18,
    voteCount: 15,
    commentCount: 7,
  },
];

async function addMockPosts() {
  try {
    console.log('Adding mock community posts...');

    const now = Date.now();
    const postsRef = db.collection('posts');

    // Add posts with recent timestamps (most recent first)
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const timestamp = Timestamp.fromMillis(now - i * 60000); // 1 minute apart, most recent first

      const postData = {
        ...post,
        slug: generateSlug(post.title),
        publishedAt: timestamp,
        updatedAt: timestamp,
      };

      const docRef = await postsRef.add(postData);
      console.log(`✓ Added post: "${post.title}" (ID: ${docRef.id})`);
    }

    console.log(`\n✅ Successfully added ${posts.length} mock posts!`);
    console.log('These posts will appear as the most recent entries in the community section.');
  } catch (error) {
    console.error('❌ Error adding mock posts:', error);
    process.exit(1);
  }
}

// Run the script
addMockPosts()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

