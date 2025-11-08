import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Process: Get All Tags
 * Purpose: Return array of tags with post counts
 * Data Source: Prisma tags query with count aggregation
 * Update Path: N/A - read-only
 * Dependencies: Prisma client
 */
export async function getTags(request, res, next) {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const transformedTags = tags.map((tag) => ({
      slug: tag.slug,
      name: tag.name,
      countOfPosts: tag._count.posts,
    }));

    res.json(transformedTags);
  } catch (error) {
    next(error);
  }
}











