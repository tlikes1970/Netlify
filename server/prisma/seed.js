import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Process: Community Seed
 * Purpose: Populate database with initial read-only community hub data
 * Data Source: Static seed data for users, posts, comments, and tags
 * Update Path: Run `pnpm prisma db seed` or `pnpm seed`
 * Dependencies: Prisma schema, database connection
 */

async function main() {
  console.log("Starting seed...");

  // Clear existing data (idempotent - safe to re-run)
  await prisma.postTag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing data");

  // Create 20 users with profiles
  const users = [];
  for (let index = 1; index <= 20; index++) {
    const user = await prisma.user.create({
      data: {
        email: `user${index}@example.com`,
        username: `user${index}`,
        profile: {
          create: {
            bio: `Bio for user ${index}`,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${index}`,
          },
        },
      },
    });
    users.push(user);
  }
  console.log(`Created ${users.length} users`);

  // Create 10 tags
  const tagNames = [
    "Discussion",
    "Review",
    "Theory",
    "Question",
    "Announcement",
    "Guide",
    "News",
    "Meta",
    "Support",
    "Feature",
  ];

  const tags = [];
  for (const name of tagNames) {
    const tag = await prisma.tag.create({
      data: {
        name,
        slug: name.toLowerCase().replaceAll(/\s+/g, "-"),
      },
    });
    tags.push(tag);
  }
  console.log(`Created ${tags.length} tags`);

  // Create 50 posts (half back-dated, half future)
  const now = new Date();
  const posts = [];
  const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  const randomItem = (array) => array[Math.floor(Math.random() * array.length)];

  const titles = [
    "Welcome to the Community Hub",
    "Getting Started Guide",
    "New Feature Announcement",
    "Discussion: Best Practices",
    "Weekly Update",
    "Community Guidelines",
    "FAQ: Common Questions",
    "Release Notes",
    "Tutorial: How to Use Tags",
    "Community Spotlight",
  ];

  for (let index = 1; index <= 50; index++) {
    const isPast = index <= 25;
    const daysOffset = isPast
      ? -randomInt(1, 90) // Past: 1-90 days ago
      : randomInt(1, 30); // Future: 1-30 days from now

    const publishedAt = new Date(now);
    publishedAt.setDate(publishedAt.getDate() + daysOffset);
    publishedAt.setHours(randomInt(8, 20), randomInt(0, 59));

    const author = randomItem(users);
    const title = `${randomItem(titles)} ${index > 10 ? `#${index}` : ""}`;
    const content = `This is the content for post ${index}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;

    // Generate slug from title
    const slug = `${title
      .toLowerCase()
      .replaceAll(/[^\da-z]+/g, "-")
      .replaceAll(/^-|-$/g, "")}-${index}`;

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        publishedAt,
        authorId: author.id,
      },
    });
    posts.push(post);

    // Assign 1-3 random tags to each post
    const numberTags = randomInt(1, 3);
    const selectedTags = [];
    const tagPool = [...tags];

    for (let index_ = 0; index_ < numberTags && tagPool.length > 0; index_++) {
      const tagIndex = randomInt(0, tagPool.length - 1);
      selectedTags.push(tagPool.splice(tagIndex, 1)[0]);
    }

    for (const tag of selectedTags) {
      await prisma.postTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      });
    }
  }
  console.log(`Created ${posts.length} posts with tags`);

  // Create 150 comments spread randomly across posts
  const comments = [];
  for (let index = 1; index <= 150; index++) {
    const post = randomItem(posts);
    const author = randomItem(users);
    const daysAgo = randomInt(0, 60);
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(randomInt(0, 23), randomInt(0, 59));

    const comment = await prisma.comment.create({
      data: {
        content: `This is comment ${index} on post "${post.title}". Great post!`,
        postId: post.id,
        authorId: author.id,
        createdAt,
      },
    });
    comments.push(comment);
  }
  console.log(`Created ${comments.length} comments`);

  console.log("Seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Error during seed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
