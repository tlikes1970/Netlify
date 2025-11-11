import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Process: Get User by Username
 * Purpose: Return user profile with recent 5 posts
 * Data Source: Prisma user query
 * Update Path: N/A - read-only
 * Dependencies: Prisma client
 */
export async function getUserByUsername(request, res, next) {
  try {
    const { username } = request.params;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        posts: {
          take: 5,
          orderBy: { publishedAt: "desc" },
          include: {
            tags: {
              include: {
                tag: {
                  select: {
                    slug: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Not found" });
    }

    // Transform posts tags
    const transformedPosts = user.posts.map((post) => ({
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    }));

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      posts: transformedPosts,
    });
  } catch (error) {
    next(error);
  }
}














