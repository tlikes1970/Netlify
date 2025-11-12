import { PrismaClient } from "@prisma/client";
import { getFirestore } from "../lib/firebaseAdmin.js";

const prisma = new PrismaClient();

/**
 * Process: Sync Post from Firestore to Prisma
 * Purpose: Create post in Prisma database when synced from Firestore
 * Data Source: HTTP POST request with post data
 * Update Path: Creates post, author (if needed), and tag relationships
 * Dependencies: Prisma client, Firebase Admin SDK
 */
export async function syncPost(request, res, next) {
  try {
    const {
      firestoreId,
      slug,
      title,
      content,
      publishedAt,
      authorId, // Firebase UID
      authorName,
      authorEmail,
      tagSlugs,
    } = request.body;

    // Validation
    if (!slug || !title || !content || !publishedAt) {
      return res.status(400).json({
        error: "Missing required fields: slug, title, content, publishedAt",
      });
    }

    // Check if post already exists (by slug)
    const existingPost = await prisma.post.findUnique({
      where: { slug },
    });

    if (existingPost) {
      // Post already synced
      return res.json({
        id: existingPost.id,
        slug: existingPost.slug,
        message: "Post already exists in Prisma",
      });
    }

    // Find or create author User
    let author = null;
    
    if (authorEmail) {
      // Try to find user by email
      author = await prisma.user.findUnique({
        where: { email: authorEmail },
      });
    }

    // If no user found, create a placeholder user
    if (!author) {
      // Generate a unique username from authorName or email
      const baseUsername = authorName
        ? authorName.toLowerCase().replace(/[^\da-z]+/g, "-")
        : authorEmail
        ? authorEmail.split("@")[0]
        : `user-${Date.now()}`;
      
      let username = baseUsername;
      let counter = 1;
      
      // Ensure username is unique
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}-${counter}`;
        counter++;
      }

      // Create user with email if available, otherwise use placeholder
      const userEmail = authorEmail || `${username}@placeholder.flicklet.app`;
      
      author = await prisma.user.create({
        data: {
          email: userEmail,
          username,
          profile: {
            create: {
              bio: null,
              avatarUrl: null,
            },
          },
        },
      });
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        publishedAt: new Date(publishedAt),
        authorId: author.id,
      },
    });

    // Link tags if provided
    if (tagSlugs && Array.isArray(tagSlugs) && tagSlugs.length > 0) {
      for (const tagSlug of tagSlugs) {
        // Find tag by slug
        const tag = await prisma.tag.findUnique({
          where: { slug: tagSlug },
        });

        if (tag) {
          // Create PostTag relationship
          await prisma.postTag.create({
            data: {
              postId: post.id,
              tagId: tag.id,
            },
          });
        }
      }
    }

    return res.json({
      id: post.id,
      slug: post.slug,
      message: "Post synced successfully",
    });
  } catch (error) {
    console.error("[syncPost] Error:", error);
    
    // Handle unique constraint violations
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Post with this slug already exists",
      });
    }
    
    next(error);
  }
}


